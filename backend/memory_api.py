"""
Custom Memory System RESTful API Module for PulseSpark AI
Provides vector-based semantic search and memory management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional, Union
import asyncio
import logging
from datetime import datetime
from enum import Enum
import json
import uuid
import asyncpg
from supabase import create_client, Client
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router for memory endpoints
memory_router = APIRouter(prefix="/memory-items", tags=["Memory System"])

# Security
security = HTTPBearer()

# Supabase client initialization
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Supabase configuration missing")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Pydantic Models for Request/Response Validation

class MemoryItemType(str, Enum):
    """Enumeration of supported memory item types"""
    CHAT = "chat"
    CODE = "code"
    NOTE = "note"
    DOCUMENT = "document"
    PROJECT = "project"

class MemoryMetadata(BaseModel):
    """Flexible metadata structure for memory items"""
    source: Optional[str] = Field(None, description="Source of the memory item")
    type: Optional[MemoryItemType] = Field(MemoryItemType.NOTE, description="Type of memory item")
    importance: Optional[int] = Field(1, ge=1, le=5, description="Importance level (1-5)")
    language: Optional[str] = Field(None, description="Programming language if applicable")
    framework: Optional[str] = Field(None, description="Framework or technology")
    
    class Config:
        extra = "allow"  # Allow additional metadata fields

class CreateMemoryRequest(BaseModel):
    """Request model for creating new memory items"""
    user_id: str = Field(..., description="UUID of the user creating the memory")
    project_id: Optional[str] = Field(None, description="Optional UUID of associated project")
    text: str = Field(..., min_length=1, max_length=10000, description="Text content to store")
    embedding: List[float] = Field(..., min_items=1536, max_items=1536, description="1536-dimensional embedding vector")
    metadata: Optional[MemoryMetadata] = Field(default_factory=MemoryMetadata, description="Flexible metadata object")
    tags: Optional[List[str]] = Field(default_factory=list, max_items=20, description="Array of searchable tags")
    
    @validator('user_id', 'project_id')
    def validate_uuid(cls, v):
        """Validate UUID format for user_id and project_id"""
        if v is not None:
            try:
                uuid.UUID(v)
                return v
            except ValueError:
                raise ValueError('Invalid UUID format')
        return v
    
    @validator('tags')
    def validate_tags(cls, v):
        """Validate and clean tags array"""
        if v is None:
            return []
        # Clean tags: remove empty strings, limit length, convert to lowercase
        cleaned_tags = [tag.strip().lower() for tag in v if tag.strip()]
        return list(set(cleaned_tags))  # Remove duplicates
    
    @validator('text')
    def validate_text(cls, v):
        """Validate and clean text content"""
        if not v or not v.strip():
            raise ValueError('Text content cannot be empty')
        return v.strip()

class UpdateMemoryRequest(BaseModel):
    """Request model for updating existing memory items"""
    text: Optional[str] = Field(None, min_length=1, max_length=10000, description="Updated text content")
    embedding: Optional[List[float]] = Field(None, min_items=1536, max_items=1536, description="Updated embedding vector")
    metadata: Optional[MemoryMetadata] = Field(None, description="Updated metadata object")
    tags: Optional[List[str]] = Field(None, max_items=20, description="Updated tags array")
    
    @validator('tags')
    def validate_tags(cls, v):
        """Validate and clean tags array"""
        if v is None:
            return None
        cleaned_tags = [tag.strip().lower() for tag in v if tag.strip()]
        return list(set(cleaned_tags))

class MemoryItemResponse(BaseModel):
    """Response model for memory item data"""
    id: str = Field(..., description="Unique identifier for the memory item")
    user_id: str = Field(..., description="UUID of the user who owns this memory")
    project_id: Optional[str] = Field(None, description="UUID of associated project")
    text: str = Field(..., description="Stored text content")
    metadata: Dict[str, Any] = Field(..., description="Metadata object")
    tags: List[str] = Field(..., description="Array of tags")
    similarity: Optional[float] = Field(None, description="Similarity score (only in search results)")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

class MemorySearchResponse(BaseModel):
    """Response model for memory search results"""
    items: List[MemoryItemResponse] = Field(..., description="Array of matching memory items")
    total_count: int = Field(..., description="Total number of matching items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    has_next: bool = Field(..., description="Whether there are more pages")

class MemoryStatsResponse(BaseModel):
    """Response model for memory statistics"""
    total_memories: int = Field(..., description="Total number of memory items")
    memories_by_type: Dict[str, int] = Field(..., description="Count by memory type")
    memories_by_project: Dict[str, int] = Field(..., description="Count by project")
    recent_activity: List[Dict[str, Any]] = Field(..., description="Recent memory activity")
    storage_usage: Dict[str, Any] = Field(..., description="Storage usage statistics")

# Authentication and Authorization

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Validate user authentication token and return user information
    Integrates with Supabase Auth for token validation
    """
    try:
        # Validate JWT token with Supabase
        response = supabase.auth.get_user(credentials.credentials)
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        
        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "authenticated": True
        }
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

async def verify_memory_ownership(memory_id: str, user_id: str) -> bool:
    """
    Verify that a user owns a specific memory item
    Used for authorization on update/delete operations
    """
    try:
        response = supabase.table("memory_items").select("user_id").eq("id", memory_id).single().execute()
        
        if not response.data:
            return False
            
        return response.data["user_id"] == user_id
        
    except Exception as e:
        logger.error(f"Ownership verification error: {e}")
        return False

# API Endpoints

@memory_router.get("/", response_model=MemorySearchResponse)
async def get_memory_items(
    user_id: str = Query(..., description="User ID to filter memories"),
    project_id: Optional[str] = Query(None, description="Optional project ID filter"),
    search: Optional[str] = Query(None, description="Search query for similarity or text search"),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    search_type: str = Query("hybrid", regex="^(vector|text|hybrid)$", description="Type of search to perform"),
    similarity_threshold: float = Query(0.7, ge=0.0, le=1.0, description="Minimum similarity threshold for vector search"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieve paginated list of memory items with optional search functionality
    
    Supports three types of search:
    - vector: Semantic similarity search using embeddings
    - text: Full-text search on text content
    - hybrid: Combination of both vector and text search
    """
    try:
        # Verify user authorization
        if current_user["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: can only access your own memories"
            )
        
        # Calculate pagination offset
        offset = (page - 1) * page_size
        
        # Build base query
        query = supabase.table("memory_items").select("*", count="exact").eq("user_id", user_id)
        
        # Add project filter if specified
        if project_id:
            query = query.eq("project_id", project_id)
        
        # Handle search functionality
        if search and search.strip():
            search_query = search.strip()
            
            if search_type in ["vector", "hybrid"]:
                # For vector search, we need to generate embedding first
                # This would typically call the embeddings edge function
                try:
                    # Call embeddings function to get query vector
                    embedding_response = supabase.functions.invoke(
                        "embeddings",
                        {"text": search_query}
                    )
                    
                    if embedding_response.get("data"):
                        query_embedding = embedding_response["data"]["data"][0]["embedding"]
                        
                        # Use the search_memories function for vector similarity
                        search_response = supabase.rpc(
                            "search_memories",
                            {
                                "query_embedding": query_embedding,
                                "match_threshold": similarity_threshold,
                                "match_count": page_size,
                                "filter_user_id": user_id,
                                "filter_project_id": project_id
                            }
                        ).execute()
                        
                        if search_response.data:
                            # Format search results
                            items = [
                                MemoryItemResponse(
                                    id=item["id"],
                                    user_id=item["user_id"],
                                    project_id=item["project_id"],
                                    text=item["text"],
                                    metadata=item["metadata"] or {},
                                    tags=item["tags"] or [],
                                    similarity=item.get("similarity"),
                                    created_at=item["created_at"],
                                    updated_at=item["updated_at"]
                                )
                                for item in search_response.data[offset:offset + page_size]
                            ]
                            
                            return MemorySearchResponse(
                                items=items,
                                total_count=len(search_response.data),
                                page=page,
                                page_size=page_size,
                                has_next=len(search_response.data) > offset + page_size
                            )
                            
                except Exception as e:
                    logger.warning(f"Vector search failed, falling back to text search: {e}")
                    search_type = "text"
            
            if search_type in ["text", "hybrid"]:
                # Full-text search on text content
                query = query.textSearch("text", search_query)
        
        # Apply pagination and ordering
        query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)
        
        # Execute query
        response = query.execute()
        
        # Format response
        items = [
            MemoryItemResponse(
                id=item["id"],
                user_id=item["user_id"],
                project_id=item["project_id"],
                text=item["text"],
                metadata=item["metadata"] or {},
                tags=item["tags"] or [],
                created_at=item["created_at"],
                updated_at=item["updated_at"]
            )
            for item in response.data
        ]
        
        total_count = response.count or 0
        
        return MemorySearchResponse(
            items=items,
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_next=total_count > offset + page_size
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving memory items: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve memory items"
        )

@memory_router.post("/", response_model=MemoryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_memory_item(
    memory_data: CreateMemoryRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new memory item with vector embedding
    
    Validates input data, ensures user authorization, and stores the memory
    with associated metadata and tags for future retrieval.
    """
    try:
        # Verify user authorization
        if current_user["user_id"] != memory_data.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: can only create memories for yourself"
            )
        
        # Prepare memory item data for insertion
        memory_item = {
            "user_id": memory_data.user_id,
            "project_id": memory_data.project_id,
            "text": memory_data.text,
            "embedding": memory_data.embedding,
            "metadata": memory_data.metadata.dict() if memory_data.metadata else {},
            "tags": memory_data.tags or []
        }
        
        # Insert into Supabase
        response = supabase.table("memory_items").insert(memory_item).select().single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create memory item"
            )
        
        # Format and return response
        created_item = response.data
        
        return MemoryItemResponse(
            id=created_item["id"],
            user_id=created_item["user_id"],
            project_id=created_item["project_id"],
            text=created_item["text"],
            metadata=created_item["metadata"] or {},
            tags=created_item["tags"] or [],
            created_at=created_item["created_at"],
            updated_at=created_item["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating memory item: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create memory item"
        )

@memory_router.get("/{memory_id}", response_model=MemoryItemResponse)
async def get_memory_item(
    memory_id: str = Path(..., description="UUID of the memory item to retrieve"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieve a specific memory item by ID
    
    Validates user ownership and returns detailed memory information
    including metadata, tags, and timestamps.
    """
    try:
        # Validate UUID format
        try:
            uuid.UUID(memory_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid memory ID format"
            )
        
        # Retrieve memory item
        response = supabase.table("memory_items").select("*").eq("id", memory_id).single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory item not found"
            )
        
        memory_item = response.data
        
        # Verify ownership
        if memory_item["user_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: memory item belongs to another user"
            )
        
        # Format and return response
        return MemoryItemResponse(
            id=memory_item["id"],
            user_id=memory_item["user_id"],
            project_id=memory_item["project_id"],
            text=memory_item["text"],
            metadata=memory_item["metadata"] or {},
            tags=memory_item["tags"] or [],
            created_at=memory_item["created_at"],
            updated_at=memory_item["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving memory item {memory_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve memory item"
        )

@memory_router.put("/{memory_id}", response_model=MemoryItemResponse)
async def update_memory_item(
    memory_id: str = Path(..., description="UUID of the memory item to update"),
    update_data: UpdateMemoryRequest = ...,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update an existing memory item
    
    Allows modification of text, metadata, and tags. If text is updated,
    the embedding should also be updated for accurate similarity search.
    """
    try:
        # Validate UUID format
        try:
            uuid.UUID(memory_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid memory ID format"
            )
        
        # Verify ownership
        if not await verify_memory_ownership(memory_id, current_user["user_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: memory item not found or access denied"
            )
        
        # Prepare update data
        update_fields = {}
        
        if update_data.text is not None:
            update_fields["text"] = update_data.text
        
        if update_data.embedding is not None:
            update_fields["embedding"] = update_data.embedding
        
        if update_data.metadata is not None:
            update_fields["metadata"] = update_data.metadata.dict()
        
        if update_data.tags is not None:
            update_fields["tags"] = update_data.tags
        
        # Ensure at least one field is being updated
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields provided for update"
            )
        
        # Update in Supabase
        response = supabase.table("memory_items").update(update_fields).eq("id", memory_id).select().single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory item not found"
            )
        
        # Format and return response
        updated_item = response.data
        
        return MemoryItemResponse(
            id=updated_item["id"],
            user_id=updated_item["user_id"],
            project_id=updated_item["project_id"],
            text=updated_item["text"],
            metadata=updated_item["metadata"] or {},
            tags=updated_item["tags"] or [],
            created_at=updated_item["created_at"],
            updated_at=updated_item["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating memory item {memory_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update memory item"
        )

@memory_router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory_item(
    memory_id: str = Path(..., description="UUID of the memory item to delete"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete a specific memory item
    
    Permanently removes the memory item from storage after verifying
    user ownership. This operation cannot be undone.
    """
    try:
        # Validate UUID format
        try:
            uuid.UUID(memory_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid memory ID format"
            )
        
        # Verify ownership
        if not await verify_memory_ownership(memory_id, current_user["user_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: memory item not found or access denied"
            )
        
        # Delete from Supabase
        response = supabase.table("memory_items").delete().eq("id", memory_id).execute()
        
        # Verify deletion was successful
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory item not found"
            )
        
        logger.info(f"Memory item {memory_id} deleted successfully by user {current_user['user_id']}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting memory item {memory_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete memory item"
        )

@memory_router.get("/stats/summary", response_model=MemoryStatsResponse)
async def get_memory_statistics(
    user_id: str = Query(..., description="User ID to get statistics for"),
    project_id: Optional[str] = Query(None, description="Optional project ID filter"),
    days_back: int = Query(30, ge=1, le=365, description="Number of days to include in statistics"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get comprehensive memory usage statistics
    
    Provides analytics on memory usage patterns, storage consumption,
    and activity trends for the specified user and optional project.
    """
    try:
        # Verify user authorization
        if current_user["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: can only access your own statistics"
            )
        
        # Call Supabase function for statistics
        stats_response = supabase.rpc(
            "get_memory_stats",
            {
                "filter_user_id": user_id,
                "filter_project_id": project_id,
                "days_back": days_back
            }
        ).execute()
        
        if not stats_response.data:
            # Return empty stats if no data
            return MemoryStatsResponse(
                total_memories=0,
                memories_by_type={},
                memories_by_project={},
                recent_activity=[],
                storage_usage={"total_items": 0, "total_text_length": 0}
            )
        
        stats_data = stats_response.data
        
        return MemoryStatsResponse(
            total_memories=stats_data.get("total_memories", 0),
            memories_by_type=stats_data.get("memories_by_type", {}),
            memories_by_project=stats_data.get("memories_by_project", {}),
            recent_activity=stats_data.get("recent_activity", []),
            storage_usage=stats_data.get("storage_usage", {})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving memory statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve memory statistics"
        )

# Bulk Operations for Advanced Use Cases

@memory_router.post("/bulk-delete")
async def bulk_delete_memories(
    memory_ids: List[str] = Field(..., description="Array of memory IDs to delete"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete multiple memory items in a single operation
    
    Validates ownership for all items before deletion to ensure
    data security and prevent unauthorized access.
    """
    try:
        if not memory_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No memory IDs provided"
            )
        
        if len(memory_ids) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete more than 100 items at once"
            )
        
        # Validate all UUIDs
        for memory_id in memory_ids:
            try:
                uuid.UUID(memory_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid memory ID format: {memory_id}"
                )
        
        # Verify ownership for all items
        ownership_checks = await asyncio.gather(
            *[verify_memory_ownership(memory_id, current_user["user_id"]) for memory_id in memory_ids],
            return_exceptions=True
        )
        
        # Check if any ownership verification failed
        for i, check in enumerate(ownership_checks):
            if isinstance(check, Exception) or not check:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied for memory item: {memory_ids[i]}"
                )
        
        # Perform bulk deletion
        delete_response = supabase.table("memory_items").delete().in_("id", memory_ids).execute()
        
        deleted_count = len(delete_response.data) if delete_response.data else 0
        
        logger.info(f"Bulk deleted {deleted_count} memory items for user {current_user['user_id']}")
        
        return {
            "message": f"Successfully deleted {deleted_count} memory items",
            "deleted_count": deleted_count,
            "requested_count": len(memory_ids)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk delete operation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete memory items"
        )

# Health Check and System Status

@memory_router.get("/health")
async def memory_system_health():
    """
    Health check endpoint for memory system
    
    Verifies database connectivity and vector search functionality
    to ensure the memory system is operating correctly.
    """
    try:
        # Test database connectivity
        test_response = supabase.table("memory_items").select("count").limit(1).execute()
        
        # Test vector search function availability
        vector_test = supabase.rpc("search_memories", {
            "query_embedding": [0.0] * 1536,
            "match_threshold": 0.9,
            "match_count": 1,
            "filter_user_id": "00000000-0000-0000-0000-000000000000"
        }).execute()
        
        return {
            "status": "healthy",
            "database_connected": True,
            "vector_search_available": True,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0"
        }
        
    except Exception as e:
        logger.error(f"Memory system health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Memory system is not healthy"
        )

# Error Handlers

@memory_router.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle validation errors with user-friendly messages"""
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc)
    )

@memory_router.exception_handler(asyncpg.PostgresError)
async def postgres_error_handler(request, exc):
    """Handle PostgreSQL errors with appropriate HTTP status codes"""
    logger.error(f"PostgreSQL error: {exc}")
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Database operation failed"
    )

# Export router for integration with main FastAPI app
__all__ = ["memory_router"]
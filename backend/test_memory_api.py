"""
Comprehensive Test Suite for Custom Memory System API
Tests all endpoints with various scenarios including edge cases and error handling
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import json
import uuid
from datetime import datetime

# Import the main FastAPI app and memory router
from main import app
from memory_api import memory_router

# Test client for API testing
client = TestClient(app)

# Test Data Fixtures

@pytest.fixture
def sample_user_id():
    """Generate a sample user UUID for testing"""
    return str(uuid.uuid4())

@pytest.fixture
def sample_project_id():
    """Generate a sample project UUID for testing"""
    return str(uuid.uuid4())

@pytest.fixture
def sample_memory_id():
    """Generate a sample memory UUID for testing"""
    return str(uuid.uuid4())

@pytest.fixture
def sample_embedding():
    """Generate a sample 1536-dimensional embedding vector"""
    return [0.1] * 1536

@pytest.fixture
def sample_memory_data(sample_user_id, sample_project_id, sample_embedding):
    """Generate sample memory item data for testing"""
    return {
        "user_id": sample_user_id,
        "project_id": sample_project_id,
        "text": "This is a test memory item for React hooks implementation",
        "embedding": sample_embedding,
        "metadata": {
            "source": "chat",
            "type": "code",
            "importance": 3,
            "language": "javascript"
        },
        "tags": ["react", "hooks", "frontend"]
    }

@pytest.fixture
def auth_headers():
    """Generate mock authentication headers"""
    return {"Authorization": "Bearer mock-jwt-token"}

# Mock Supabase Client for Testing

@pytest.fixture
def mock_supabase():
    """Mock Supabase client for isolated testing"""
    with patch('memory_api.supabase') as mock_client:
        # Configure mock responses
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = Mock(
            data={"user_id": "test-user-id"}
        )
        yield mock_client

@pytest.fixture
def mock_auth():
    """Mock authentication for testing"""
    with patch('memory_api.get_current_user') as mock_auth:
        mock_auth.return_value = {
            "user_id": "test-user-id",
            "email": "test@example.com",
            "authenticated": True
        }
        yield mock_auth

# Test Cases for Memory Items API

class TestMemoryItemsAPI:
    """Test suite for memory items CRUD operations"""
    
    def test_get_memory_items_success(self, mock_supabase, mock_auth, sample_user_id, auth_headers):
        """Test successful retrieval of memory items"""
        # Mock successful response
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = Mock(
            data=[
                {
                    "id": str(uuid.uuid4()),
                    "user_id": sample_user_id,
                    "project_id": None,
                    "text": "Test memory",
                    "metadata": {"type": "note"},
                    "tags": ["test"],
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            ],
            count=1
        )
        
        response = client.get(
            f"/memory-items/?user_id={sample_user_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total_count" in data
        assert "page" in data
        assert data["total_count"] >= 0
    
    def test_get_memory_items_unauthorized(self, auth_headers):
        """Test unauthorized access to memory items"""
        different_user_id = str(uuid.uuid4())
        
        response = client.get(
            f"/memory-items/?user_id={different_user_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 403
        assert "Access denied" in response.json()["detail"]
    
    def test_get_memory_items_with_search(self, mock_supabase, mock_auth, sample_user_id, auth_headers):
        """Test memory items retrieval with search functionality"""
        # Mock search response
        mock_supabase.rpc.return_value.execute.return_value = Mock(
            data=[
                {
                    "id": str(uuid.uuid4()),
                    "user_id": sample_user_id,
                    "text": "React hooks implementation",
                    "similarity": 0.85,
                    "metadata": {"type": "code"},
                    "tags": ["react"],
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            ]
        )
        
        # Mock embeddings function
        mock_supabase.functions.invoke.return_value = {
            "data": {
                "data": [{"embedding": [0.1] * 1536}]
            }
        }
        
        response = client.get(
            f"/memory-items/?user_id={sample_user_id}&search=React hooks&search_type=vector",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0
        assert data["items"][0]["similarity"] is not None
    
    def test_create_memory_item_success(self, mock_supabase, mock_auth, sample_memory_data, auth_headers):
        """Test successful creation of memory item"""
        # Mock successful creation response
        created_item = {
            "id": str(uuid.uuid4()),
            **sample_memory_data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        mock_supabase.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value = Mock(
            data=created_item
        )
        
        response = client.post(
            "/memory-items/",
            json=sample_memory_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["text"] == sample_memory_data["text"]
        assert data["tags"] == sample_memory_data["tags"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_memory_item_validation_error(self, auth_headers):
        """Test memory item creation with invalid data"""
        invalid_data = {
            "user_id": "invalid-uuid",
            "text": "",  # Empty text should fail validation
            "embedding": [0.1] * 100  # Wrong embedding dimension
        }
        
        response = client.post(
            "/memory-items/",
            json=invalid_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_get_memory_item_by_id_success(self, mock_supabase, mock_auth, sample_memory_id, sample_user_id, auth_headers):
        """Test successful retrieval of specific memory item"""
        # Mock successful response
        memory_item = {
            "id": sample_memory_id,
            "user_id": sample_user_id,
            "project_id": None,
            "text": "Test memory item",
            "metadata": {"type": "note"},
            "tags": ["test"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = Mock(
            data=memory_item
        )
        
        response = client.get(
            f"/memory-items/{sample_memory_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_memory_id
        assert data["text"] == "Test memory item"
    
    def test_get_memory_item_not_found(self, mock_supabase, mock_auth, auth_headers):
        """Test retrieval of non-existent memory item"""
        # Mock not found response
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = Mock(
            data=None
        )
        
        non_existent_id = str(uuid.uuid4())
        response = client.get(
            f"/memory-items/{non_existent_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_update_memory_item_success(self, mock_supabase, mock_auth, sample_memory_id, auth_headers):
        """Test successful update of memory item"""
        # Mock ownership verification
        with patch('memory_api.verify_memory_ownership', return_value=True):
            # Mock successful update response
            updated_item = {
                "id": sample_memory_id,
                "user_id": "test-user-id",
                "project_id": None,
                "text": "Updated memory text",
                "metadata": {"type": "note", "updated": True},
                "tags": ["updated", "test"],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            mock_supabase.table.return_value.update.return_value.eq.return_value.select.return_value.single.return_value.execute.return_value = Mock(
                data=updated_item
            )
            
            update_data = {
                "text": "Updated memory text",
                "tags": ["updated", "test"]
            }
            
            response = client.put(
                f"/memory-items/{sample_memory_id}",
                json=update_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["text"] == "Updated memory text"
            assert "updated" in data["tags"]
    
    def test_update_memory_item_unauthorized(self, mock_auth, sample_memory_id, auth_headers):
        """Test unauthorized update attempt"""
        # Mock ownership verification failure
        with patch('memory_api.verify_memory_ownership', return_value=False):
            update_data = {"text": "Unauthorized update"}
            
            response = client.put(
                f"/memory-items/{sample_memory_id}",
                json=update_data,
                headers=auth_headers
            )
            
            assert response.status_code == 403
            assert "Access denied" in response.json()["detail"]
    
    def test_delete_memory_item_success(self, mock_supabase, mock_auth, sample_memory_id, auth_headers):
        """Test successful deletion of memory item"""
        # Mock ownership verification
        with patch('memory_api.verify_memory_ownership', return_value=True):
            # Mock successful deletion response
            mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = Mock(
                data=[{"id": sample_memory_id}]
            )
            
            response = client.delete(
                f"/memory-items/{sample_memory_id}",
                headers=auth_headers
            )
            
            assert response.status_code == 204
    
    def test_delete_memory_item_unauthorized(self, mock_auth, sample_memory_id, auth_headers):
        """Test unauthorized deletion attempt"""
        # Mock ownership verification failure
        with patch('memory_api.verify_memory_ownership', return_value=False):
            response = client.delete(
                f"/memory-items/{sample_memory_id}",
                headers=auth_headers
            )
            
            assert response.status_code == 403
            assert "Access denied" in response.json()["detail"]

class TestMemoryStatistics:
    """Test suite for memory statistics and analytics"""
    
    def test_get_memory_statistics_success(self, mock_supabase, mock_auth, sample_user_id, auth_headers):
        """Test successful retrieval of memory statistics"""
        # Mock statistics response
        mock_supabase.rpc.return_value.execute.return_value = Mock(
            data={
                "total_memories": 25,
                "memories_by_type": {"code": 10, "note": 8, "chat": 7},
                "memories_by_project": {"project-1": 15, "project-2": 10},
                "recent_activity": [
                    {"date": "2024-01-27", "count": 5},
                    {"date": "2024-01-26", "count": 3}
                ],
                "storage_usage": {"total_items": 25, "total_text_length": 12500}
            }
        )
        
        response = client.get(
            f"/memory-items/stats/summary?user_id={sample_user_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_memories"] == 25
        assert "memories_by_type" in data
        assert "storage_usage" in data
    
    def test_get_memory_statistics_unauthorized(self, auth_headers):
        """Test unauthorized access to statistics"""
        different_user_id = str(uuid.uuid4())
        
        response = client.get(
            f"/memory-items/stats/summary?user_id={different_user_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 403

class TestBulkOperations:
    """Test suite for bulk memory operations"""
    
    def test_bulk_delete_success(self, mock_supabase, mock_auth, auth_headers):
        """Test successful bulk deletion of memory items"""
        memory_ids = [str(uuid.uuid4()) for _ in range(3)]
        
        # Mock ownership verification for all items
        with patch('memory_api.verify_memory_ownership', return_value=True):
            # Mock successful bulk deletion
            mock_supabase.table.return_value.delete.return_value.in_.return_value.execute.return_value = Mock(
                data=[{"id": mid} for mid in memory_ids]
            )
            
            response = client.post(
                "/memory-items/bulk-delete",
                json=memory_ids,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["deleted_count"] == 3
            assert data["requested_count"] == 3
    
    def test_bulk_delete_too_many_items(self, auth_headers):
        """Test bulk deletion with too many items"""
        memory_ids = [str(uuid.uuid4()) for _ in range(101)]  # Exceed limit
        
        response = client.post(
            "/memory-items/bulk-delete",
            json=memory_ids,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Cannot delete more than 100" in response.json()["detail"]

class TestHealthCheck:
    """Test suite for system health monitoring"""
    
    def test_memory_system_health_success(self, mock_supabase):
        """Test successful health check"""
        # Mock successful database and vector search tests
        mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = Mock(data=[])
        mock_supabase.rpc.return_value.execute.return_value = Mock(data=[])
        
        response = client.get("/memory-items/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database_connected"] is True
        assert data["vector_search_available"] is True
    
    def test_memory_system_health_failure(self, mock_supabase):
        """Test health check failure"""
        # Mock database connection failure
        mock_supabase.table.side_effect = Exception("Database connection failed")
        
        response = client.get("/memory-items/health")
        
        assert response.status_code == 503
        assert "not healthy" in response.json()["detail"]

class TestValidation:
    """Test suite for input validation and error handling"""
    
    def test_invalid_uuid_format(self, auth_headers):
        """Test handling of invalid UUID formats"""
        response = client.get(
            "/memory-items/invalid-uuid",
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Invalid memory ID format" in response.json()["detail"]
    
    def test_embedding_dimension_validation(self, sample_user_id, auth_headers):
        """Test validation of embedding vector dimensions"""
        invalid_data = {
            "user_id": sample_user_id,
            "text": "Test memory",
            "embedding": [0.1] * 100,  # Wrong dimension
            "metadata": {},
            "tags": []
        }
        
        response = client.post(
            "/memory-items/",
            json=invalid_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_text_length_validation(self, sample_user_id, auth_headers):
        """Test validation of text content length"""
        invalid_data = {
            "user_id": sample_user_id,
            "text": "",  # Empty text
            "embedding": [0.1] * 1536,
            "metadata": {},
            "tags": []
        }
        
        response = client.post(
            "/memory-items/",
            json=invalid_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error

# Integration Tests

class TestMemoryIntegration:
    """Integration tests for complete memory workflows"""
    
    @pytest.mark.asyncio
    async def test_complete_memory_lifecycle(self, mock_supabase, mock_auth, sample_memory_data, auth_headers):
        """Test complete lifecycle: create, read, update, delete"""
        memory_id = str(uuid.uuid4())
        
        # Mock create
        created_item = {
            "id": memory_id,
            **sample_memory_data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        mock_supabase.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value = Mock(
            data=created_item
        )
        
        # Create memory item
        create_response = client.post(
            "/memory-items/",
            json=sample_memory_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        
        # Mock read
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = Mock(
            data=created_item
        )
        
        # Read memory item
        read_response = client.get(
            f"/memory-items/{memory_id}",
            headers=auth_headers
        )
        assert read_response.status_code == 200
        
        # Mock update
        with patch('memory_api.verify_memory_ownership', return_value=True):
            updated_item = {**created_item, "text": "Updated text"}
            mock_supabase.table.return_value.update.return_value.eq.return_value.select.return_value.single.return_value.execute.return_value = Mock(
                data=updated_item
            )
            
            # Update memory item
            update_response = client.put(
                f"/memory-items/{memory_id}",
                json={"text": "Updated text"},
                headers=auth_headers
            )
            assert update_response.status_code == 200
        
        # Mock delete
        with patch('memory_api.verify_memory_ownership', return_value=True):
            mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = Mock(
                data=[{"id": memory_id}]
            )
            
            # Delete memory item
            delete_response = client.delete(
                f"/memory-items/{memory_id}",
                headers=auth_headers
            )
            assert delete_response.status_code == 204

# Performance Tests

class TestMemoryPerformance:
    """Performance tests for memory system scalability"""
    
    def test_pagination_performance(self, mock_supabase, mock_auth, sample_user_id, auth_headers):
        """Test pagination with large datasets"""
        # Mock large dataset response
        large_dataset = [
            {
                "id": str(uuid.uuid4()),
                "user_id": sample_user_id,
                "text": f"Memory item {i}",
                "metadata": {"index": i},
                "tags": [f"tag{i}"],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            for i in range(100)
        ]
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = Mock(
            data=large_dataset[:20],  # First page
            count=100
        )
        
        response = client.get(
            f"/memory-items/?user_id={sample_user_id}&page=1&page_size=20",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 20
        assert data["total_count"] == 100
        assert data["has_next"] is True

# Run tests with pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
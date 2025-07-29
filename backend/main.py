"""
FastAPI Backend for agent.pulsespark.ai
Multi-provider AI code generation endpoint with secure API key handling
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
import httpx
import asyncio
import logging
import os
from datetime import datetime
from enum import Enum
import json
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PulseSpark AI Backend",
    description="Multi-provider AI code generation API",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        "https://agent.pulsespark.ai",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Enums and Models
class APIProvider(str, Enum):
    """Supported AI API providers"""
    OPENAI = "openai"
    CLAUDE = "claude"
    DEEPSEEK = "deepseek"
    GROK = "grok"
    MISTRAL = "mistral"

class ChatMessage(BaseModel):
    """Individual chat message structure"""
    role: str = Field(..., pattern="^(user|assistant|system)$")  # pattern instead of regex
    content: str = Field(..., min_length=1, max_length=50000)
    timestamp: Optional[str] = None

class GenerateRequest(BaseModel):
    """Request model for the /generate endpoint"""
    user_id: str = Field(..., description="User UUID")
    prompt: str = Field(..., min_length=1, max_length=10000, description="User's input prompt")
    conversation_history: List[ChatMessage] = Field(default=[], max_items=50)
    api_provider: APIProvider = Field(..., description="Selected AI provider")
    api_key: str = Field(..., min_length=10, max_length=500, description="User's API key")
    
    @validator('user_id')
    def validate_user_id(cls, v):
        """Validate UUID format"""
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError('Invalid UUID format')

class GenerateResponse(BaseModel):
    """Response model for successful generation"""
    response: str
    provider: str
    timestamp: str
    tokens_used: Optional[int] = None

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    error_code: str
    timestamp: str
    provider: Optional[str] = None

# System prompt for code generation
SYSTEM_PROMPT = """You are an AI software engineer assistant for PulseSpark AI. You help users build complete, production-ready applications.

When users request code or applications:
1. Provide complete, working code with proper file structure
2. Include all necessary dependencies and configuration files
3. Add clear setup and running instructions
4. Use modern best practices and clean code principles
5. Make the code production-ready with error handling
6. Include comments explaining key functionality

Format your response with clear file structures and explanations. Focus on delivering functional, well-organized code that users can immediately run and deploy."""

# Provider-specific configurations
PROVIDER_CONFIGS = {
    APIProvider.OPENAI: {
        "base_url": "https://api.openai.com/v1",
        "chat_endpoint": "/chat/completions",
        "default_model": "gpt-3.5-turbo",
        "max_tokens": 4000,
        "temperature": 0.7
    },
    APIProvider.CLAUDE: {
        "base_url": "https://api.anthropic.com/v1",
        "chat_endpoint": "/messages",
        "default_model": "claude-3-sonnet-20240229",
        "max_tokens": 4000,
        "temperature": 0.7
    },
    APIProvider.DEEPSEEK: {
        "base_url": "https://api.deepseek.com/v1",
        "chat_endpoint": "/chat/completions",
        "default_model": "deepseek-chat",
        "max_tokens": 4000,
        "temperature": 0.7
    },
    APIProvider.GROK: {
        "base_url": "https://api.x.ai/v1",
        "chat_endpoint": "/chat/completions",
        "default_model": "grok-beta",
        "max_tokens": 4000,
        "temperature": 0.7
    },
    APIProvider.MISTRAL: {
        "base_url": "https://api.mistral.ai/v1",
        "chat_endpoint": "/chat/completions",
        "default_model": "mistral-medium",
        "max_tokens": 4000,
        "temperature": 0.7
    }
}

class AIProviderClient:
    """Base class for AI provider clients with common functionality"""
    
    def __init__(self, api_key: str, provider: APIProvider):
        self.api_key = api_key
        self.provider = provider
        self.config = PROVIDER_CONFIGS[provider]
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def format_messages(self, conversation_history: List[ChatMessage], prompt: str) -> List[Dict[str, str]]:
        """Format messages for API call with system prompt"""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add conversation history (limit to last 10 messages for context)
        for msg in conversation_history[-10:]:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current user prompt
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        return messages
    
    async def generate_response(self, conversation_history: List[ChatMessage], prompt: str) -> Dict[str, Any]:
        """Generate response using the specific provider's API"""
        if self.provider == APIProvider.OPENAI:
            return await self._call_openai(conversation_history, prompt)
        elif self.provider == APIProvider.CLAUDE:
            return await self._call_claude(conversation_history, prompt)
        elif self.provider == APIProvider.DEEPSEEK:
            return await self._call_deepseek(conversation_history, prompt)
        elif self.provider == APIProvider.GROK:
            return await self._call_grok(conversation_history, prompt)
        elif self.provider == APIProvider.MISTRAL:
            return await self._call_mistral(conversation_history, prompt)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported provider: {self.provider}"
            )
    
    async def _call_openai(self, conversation_history: List[ChatMessage], prompt: str) -> Dict[str, Any]:
        """Call OpenAI API"""
        messages = self.format_messages(conversation_history, prompt)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.config["default_model"],
            "messages": messages,
            "max_tokens": self.config["max_tokens"],
            "temperature": self.config["temperature"]
        }
        
        try:
            response = await self.client.post(
                f"{self.config['base_url']}{self.config['chat_endpoint']}",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid OpenAI API key"
                )
            elif response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="OpenAI API rate limit exceeded"
                )
            elif response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"OpenAI API error: {error_data.get('error', {}).get('message', 'Unknown error')}"
                )
            
            data = response.json()
            return {
                "response": data["choices"][0]["message"]["content"],
                "tokens_used": data.get("usage", {}).get("total_tokens")
            }
            
        except httpx.RequestError as e:
            logger.error(f"OpenAI API request error: {e}")
            raise HTTPException(
                status_code=503,
                detail="Failed to connect to OpenAI API"
            )
    
    async def _call_claude(self, conversation_history: List[ChatMessage], prompt: str) -> Dict[str, Any]:
        """Call Anthropic Claude API"""
        messages = self.format_messages(conversation_history, prompt)
        
        # Claude API expects different format - remove system message and handle separately
        system_message = messages[0]["content"]
        user_messages = messages[1:]
        
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": self.config["default_model"],
            "max_tokens": self.config["max_tokens"],
            "system": system_message,
            "messages": user_messages
        }
        
        try:
            response = await self.client.post(
                f"{self.config['base_url']}{self.config['chat_endpoint']}",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid Claude API key"
                )
            elif response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="Claude API rate limit exceeded"
                )
            elif response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Claude API error: {error_data.get('error', {}).get('message', 'Unknown error')}"
                )
            
            data = response.json()
            return {
                "response": data["content"][0]["text"],
                "tokens_used": data.get("usage", {}).get("output_tokens")
            }
            
        except httpx.RequestError as e:
            logger.error(f"Claude API request error: {e}")
            raise HTTPException(
                status_code=503,
                detail="Failed to connect to Claude API"
            )
    
    async def _call_deepseek(self, conversation_history: List[ChatMessage], prompt: str) -> Dict[str, Any]:
        """Call DeepSeek API"""
        messages = self.format_messages(conversation_history, prompt)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.config["default_model"],
            "messages": messages,
            "max_tokens": self.config["max_tokens"],
            "temperature": self.config["temperature"]
        }
        
        try:
            response = await self.client.post(
                f"{self.config['base_url']}{self.config['chat_endpoint']}",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid DeepSeek API key"
                )
            elif response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="DeepSeek API rate limit exceeded"
                )
            elif response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"DeepSeek API error: {error_data.get('error', {}).get('message', 'Unknown error')}"
                )
            
            data = response.json()
            return {
                "response": data["choices"][0]["message"]["content"],
                "tokens_used": data.get("usage", {}).get("total_tokens")
            }
            
        except httpx.RequestError as e:
            logger.error(f"DeepSeek API request error: {e}")
            raise HTTPException(
                status_code=503,
                detail="Failed to connect to DeepSeek API"
            )
    
    async def _call_grok(self, conversation_history: List[ChatMessage], prompt: str) -> Dict[str, Any]:
        """Call Grok API (X.AI)"""
        messages = self.format_messages(conversation_history, prompt)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.config["default_model"],
            "messages": messages,
            "max_tokens": self.config["max_tokens"],
            "temperature": self.config["temperature"]
        }
        
        try:
            response = await self.client.post(
                f"{self.config['base_url']}{self.config['chat_endpoint']}",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid Grok API key"
                )
            elif response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="Grok API rate limit exceeded"
                )
            elif response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Grok API error: {error_data.get('error', {}).get('message', 'Unknown error')}"
                )
            
            data = response.json()
            return {
                "response": data["choices"][0]["message"]["content"],
                "tokens_used": data.get("usage", {}).get("total_tokens")
            }
            
        except httpx.RequestError as e:
            logger.error(f"Grok API request error: {e}")
            raise HTTPException(
                status_code=503,
                detail="Failed to connect to Grok API"
            )
    
    async def _call_mistral(self, conversation_history: List[ChatMessage], prompt: str) -> Dict[str, Any]:
        """Call Mistral API"""
        messages = self.format_messages(conversation_history, prompt)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.config["default_model"],
            "messages": messages,
            "max_tokens": self.config["max_tokens"],
            "temperature": self.config["temperature"]
        }
        
        try:
            response = await self.client.post(
                f"{self.config['base_url']}{self.config['chat_endpoint']}",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid Mistral API key"
                )
            elif response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="Mistral API rate limit exceeded"
                )
            elif response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Mistral API error: {error_data.get('error', {}).get('message', 'Unknown error')}"
                )
            
            data = response.json()
            return {
                "response": data["choices"][0]["message"]["content"],
                "tokens_used": data.get("usage", {}).get("total_tokens")
            }
            
        except httpx.RequestError as e:
            logger.error(f"Mistral API request error: {e}")
            raise HTTPException(
                status_code=503,
                detail="Failed to connect to Mistral API"
            )

# Dependency for authentication (placeholder - integrate with your auth system)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate user authentication token"""
    # TODO: Implement actual token validation with your auth system
    # For now, we'll accept any bearer token
    if not credentials.credentials:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )
    return {"user_id": "authenticated"}

# Main endpoint
@app.post("/generate", response_model=GenerateResponse)
async def generate_code(
    request: GenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate AI responses using the selected provider and user's API key.
    
    This endpoint:
    1. Validates the incoming request
    2. Routes to the appropriate AI provider
    3. Handles authentication with user's API key
    4. Returns the generated response or appropriate error
    """
    
    # Log request (without sensitive data)
    logger.info(f"Generate request from user {request.user_id} using {request.api_provider}")
    
    try:
        # Create provider client with user's API key
        async with AIProviderClient(request.api_key, request.api_provider) as client:
            
            # Generate response using the selected provider
            result = await client.generate_response(
                request.conversation_history,
                request.prompt
            )
            
            # Return successful response
            return GenerateResponse(
                response=result["response"],
                provider=request.api_provider.value,
                timestamp=datetime.utcnow().isoformat(),
                tokens_used=result.get("tokens_used")
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions (they're already properly formatted)
        raise
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in generate endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error occurred during generation"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# Provider status endpoint
@app.get("/providers")
async def get_providers():
    """Get list of supported providers and their status"""
    return {
        "providers": [
            {
                "name": provider.value,
                "display_name": provider.value.title(),
                "status": "available"
            }
            for provider in APIProvider
        ]
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return {
        "error": exc.detail,
        "error_code": f"HTTP_{exc.status_code}",
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
# PulseSpark AI Backend

FastAPI backend for agent.pulsespark.ai - Multi-provider AI code generation API.

## Features

- **Multi-Provider Support**: OpenAI, Claude, DeepSeek, Grok, Mistral
- **Custom Memory System**: Vector-based semantic search with pgvector
- **Secure API Key Handling**: User-provided API keys with no server-side storage
- **Async Architecture**: High-performance async HTTP handling
- **Comprehensive Error Handling**: Proper error codes and messages
- **Request Validation**: Pydantic models for type safety
- **CORS Support**: Frontend integration ready
- **Health Monitoring**: Built-in health check endpoints

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run Development Server

```bash
# Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python main.py
```

### 4. Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Endpoints

### POST /generate

Generate AI responses using selected provider.

### Memory System Endpoints

#### GET /memory-items
Retrieve paginated memory items with optional search functionality.

**Query Parameters:**
- `user_id` (required): User UUID
- `project_id` (optional): Project UUID filter
- `search` (optional): Search query for similarity or text search
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 20, max: 100)
- `search_type` (optional): "vector", "text", or "hybrid" (default: "hybrid")
- `similarity_threshold` (optional): Minimum similarity for vector search (default: 0.7)

#### POST /memory-items
Create a new memory item with vector embedding.

**Request Body:**
```json
{
  "user_id": "uuid-string",
  "project_id": "uuid-string",
  "text": "Memory content to store",
  "embedding": [1536-dimensional vector],
  "metadata": {
    "source": "chat",
    "type": "code",
    "importance": 3
  },
  "tags": ["react", "hooks", "frontend"]
}
```

#### GET /memory-items/{id}
Retrieve a specific memory item by ID.

#### PUT /memory-items/{id}
Update an existing memory item.

#### DELETE /memory-items/{id}
Delete a memory item by ID.

#### GET /memory-items/stats/summary
Get comprehensive memory usage statistics.

#### POST /memory-items/bulk-delete
Delete multiple memory items in a single operation.

#### GET /memory-items/health
Health check for memory system functionality.

**Request Body:**
```json
{
  "user_id": "uuid-string",
  "prompt": "Build a React todo app",
  "conversation_history": [
    {
      "role": "user",
      "content": "Previous message",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "api_provider": "openai",
  "api_key": "user-api-key"
}
```

**Response:**
```json
{
  "response": "Generated AI response",
  "provider": "openai",
  "timestamp": "2024-01-01T00:00:00Z",
  "tokens_used": 150
}
```

### GET /health

Health check endpoint.

### GET /providers

List supported AI providers.

## Supported Providers

| Provider | Status | Model |
|----------|--------|-------|
| OpenAI | ✅ Available | gpt-3.5-turbo |
| Claude | ✅ Available | claude-3-sonnet |
| DeepSeek | ✅ Available | deepseek-chat |
| Grok | ✅ Available | grok-beta |
| Mistral | ✅ Available | mistral-medium |

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Error description",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z",
  "provider": "openai"
}
```

### Common Error Codes

- `HTTP_401`: Invalid API key
- `HTTP_429`: Rate limit exceeded
- `HTTP_503`: Provider API unavailable
- `INTERNAL_ERROR`: Server error

## Security

- **API Key Security**: User API keys are never logged or stored
- **Input Validation**: All inputs validated with Pydantic
- **CORS Protection**: Configurable allowed origins
- **Rate Limiting**: Handled by upstream providers
- **Authentication**: Bearer token support (integrate with your auth system)

## Development

### Project Structure

```
backend/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── .env.example        # Environment template
└── README.md           # This file
```

### Adding New Providers

1. Add provider to `APIProvider` enum
2. Add configuration to `PROVIDER_CONFIGS`
3. Implement `_call_<provider>` method in `AIProviderClient`
4. Update documentation

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest

# Run with coverage
pytest --cov=main
```

### Code Quality

```bash
# Format code
black main.py

# Lint code
flake8 main.py
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Settings

- Set `DEBUG=False` in environment
- Use production ASGI server (Gunicorn + Uvicorn)
- Configure proper logging
- Set up monitoring and health checks
- Use environment variables for secrets

## Integration

This backend integrates with:

- **Frontend**: React + Supabase chat interface
- **Database**: Supabase for user management and chat history
- **AI Providers**: Direct API integration with user keys
- **Authentication**: Bearer token validation (customize as needed)

## License

MIT License - See LICENSE file for details.
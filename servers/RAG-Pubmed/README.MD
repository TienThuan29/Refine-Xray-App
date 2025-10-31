# Medical RAG API Documentation

REST API for Medical RAG System using PubMed and ChromaDB with Gemini embeddings.

## Base URL

```
http://localhost:8001
```

Default port: `8001` (configurable via `API_PORT` environment variable)

## Interactive Documentation

- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

## Endpoints

### 1. Root - API Information

**URL:** `GET /`

**Description:** Returns API information and available endpoints.

**Request:** No request body required

**Response:**
```json
{
  "name": "Medical RAG API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "index": "POST /crawl - Index articles from PubMed",
    "query": "POST /query - Query the knowledge base",
    "stats": "GET /stats - Get database statistics",
    "clear": "DELETE /clear - Clear all data from database"
  }
}
```

---

### 2. Health Check

**URL:** `GET /health`

**Description:** Check the health status of the API and RAG system.

**Request:** No request body required

**Response (Healthy):**
```json
{
  "status": "healthy",
  "rag_initialized": true,
  "total_articles": 150
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "rag_initialized": true,
  "error": "Error message"
}
```

**Error Codes:**
- `503`: RAG system not initialized

---

### 3. Index Articles from PubMed

**URL:** `POST /crawl`

**Description:** Search and index articles from PubMed based on a query topic.

**Request Body:**
```json
{
  "query": "diabetes treatment",
  "max_results": 50
}
```

**Request Fields:**
- `query` (string, required): Search query for PubMed (e.g., "diabetes treatment", "COVID-19 vaccine")
- `max_results` (integer, optional): Maximum number of articles to index (1-200, default: 50)

**Response (Success):**
```json
{
  "status": "success",
  "message": "Successfully indexed articles for query: 'diabetes treatment'",
  "total_articles": "75"
}
```

**Example Request (cURL):**
```bash
curl -X POST "http://localhost:8001/index" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "diabetes treatment",
    "max_results": 50
  }'
```

**Example Request (Python):**
```python
import requests

response = requests.post(
    "http://localhost:8001/index",
    json={
        "query": "diabetes treatment",
        "max_results": 50
    }
)
print(response.json())
```

**Error Codes:**
- `400`: Bad request (invalid parameters)
- `500`: Internal server error
- `503`: RAG system not initialized

---

### 4. Query Knowledge Base

**URL:** `POST /query`

**Description:** Query the knowledge base with a medical question. Returns relevant articles and answers based on indexed PubMed articles.

**Request Body:**
```json
{
  "question": "What are the latest treatments for diabetes?",
  "n_results": 3,
  "auto_fetch": true,
  "auto_fetch_count": 30
}
```

**Request Fields:**
- `question` (string, required): Question to ask the RAG system
- `n_results` (integer, optional): Number of relevant articles to return (1-10, default: 3)
- `auto_fetch` (boolean, optional): Automatically fetch data from PubMed if database is empty (default: true)
- `auto_fetch_count` (integer, optional): Number of articles to fetch automatically if database is empty (1-100, default: 30)

**Response:**
```json
{
  "answer": "Dựa trên các nghiên cứu y học, tôi tìm thấy:\n\n   Nguồn 1: Diabetes Treatment Update...\n   Tác giả: John Doe, Jane Smith\n   Journal: Journal of Medicine (2024)\n   Độ liên quan: 95.23%\n   Abstract text here...\n\nLưu ý: Đây là thông tin từ các nghiên cứu khoa học...",
  "sources_count": 3,
  "auto_fetched": false
}
```

**Response Fields:**
- `answer` (string): Formatted answer with sources and abstracts
- `sources_count` (integer): Number of source articles included
- `auto_fetched` (boolean): Whether articles were automatically fetched during this query

**Example Request (cURL):**
```bash
curl -X POST "http://localhost:8001/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the latest treatments for diabetes?",
    "n_results": 3
  }'
```

**Example Request (Python):**
```python
import requests

response = requests.post(
    "http://localhost:8001/query",
    json={
        "question": "What are the latest treatments for diabetes?",
        "n_results": 3,
        "auto_fetch": True
    }
)
data = response.json()
print(data["answer"])
```

**Error Codes:**
- `400`: Bad request (invalid parameters)
- `500`: Internal server error
- `503`: RAG system not initialized

---

### 5. Get Database Statistics

**URL:** `GET /stats`

**Description:** Get statistics about the indexed articles in the database.

**Request:** No request body required

**Response:**
```json
{
  "total_articles": 150,
  "collection_name": "pubmed_articles",
  "status": "success"
}
```

**Response Fields:**
- `total_articles` (integer): Total number of indexed articles
- `collection_name` (string): Name of the ChromaDB collection
- `status` (string): Status message (always "success" on success)

**Example Request (cURL):**
```bash
curl -X GET "http://localhost:8001/stats"
```

**Example Request (Python):**
```python
import requests

response = requests.get("http://localhost:8001/stats")
print(response.json())
```

**Error Codes:**
- `500`: Internal server error
- `503`: RAG system not initialized

---

### 6. Clear Database

**URL:** `DELETE /clear`

**Description:** Clear all indexed articles from the database. **Warning: This operation cannot be undone!**

**Request:** No request body required

**Response:**
```json
{
  "success": true,
  "message": "Successfully cleared 150 articles from collection 'pubmed_articles'",
  "deleted_count": 150
}
```

**Response Fields:**
- `success` (boolean): Whether the operation was successful
- `message` (string): Descriptive message about the operation
- `deleted_count` (integer): Number of articles deleted

**Example Request (cURL):**
```bash
curl -X DELETE "http://localhost:8001/clear"
```

**Example Request (Python):**
```python
import requests

response = requests.delete("http://localhost:8001/clear")
print(response.json())
```

**Error Codes:**
- `500`: Internal server error
- `503`: RAG system not initialized

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request - Invalid request parameters
- `500`: Internal Server Error - Server-side error occurred
- `503`: Service Unavailable - RAG system not initialized

---

## Setup and Installation

### Prerequisites

1. Python 3.8+
2. ChromaDB running (via Docker Compose recommended)
3. Google Gemini API key

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables (create `.env` file):
```env
GEMINI_API_KEY=your_gemini_api_key_here
PUBMED_EMAIL=your_email@example.com
CHROMA_HOST=localhost
CHROMA_PORT=7000
API_HOST=0.0.0.0
API_PORT=8001
```

3. Start ChromaDB (if using Docker Compose):
```bash
docker-compose up -d
```

4. Run the API:
```bash
python pubmed_rag_api.py
```

Or using uvicorn directly:
```bash
uvicorn pubmed_rag_api:app --host 0.0.0.0 --port 8001 --reload
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key (required) | - |
| `PUBMED_EMAIL` | Email for PubMed API | `nguyentienthuan9595@gmail.com` |
| `CHROMA_HOST` | ChromaDB server host | `localhost` |
| `CHROMA_PORT` | ChromaDB server port | `7000` |
| `API_HOST` | API server host | `0.0.0.0` |
| `API_PORT` | API server port | `8001` |

---

## Usage Examples

### Complete Workflow

```python
import requests

BASE_URL = "http://localhost:8001"

# 1. Check health
health = requests.get(f"{BASE_URL}/health")
print("Health:", health.json())

# 2. Index articles about diabetes
index_response = requests.post(
    f"{BASE_URL}/index",
    json={
        "query": "diabetes mellitus treatment",
        "max_results": 30
    }
)
print("Index:", index_response.json())

# 3. Check statistics
stats = requests.get(f"{BASE_URL}/stats")
print("Stats:", stats.json())

# 4. Query the knowledge base
query_response = requests.post(
    f"{BASE_URL}/query",
    json={
        "question": "What are the latest diabetes treatments?",
        "n_results": 5
    }
)
result = query_response.json()
print("Answer:", result["answer"])
print("Sources:", result["sources_count"])
```

---

## Notes

- The API uses Gemini embeddings for semantic search
- Articles are automatically fetched from PubMed when querying if the database is empty (if `auto_fetch` is enabled)
- All responses are in JSON format
- The API supports CORS for cross-origin requests
- Interactive API documentation is available at `/docs` endpoint

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import os
from dotenv import load_dotenv
import uvicorn
from pubmed_rag_system import MedicalRAG

load_dotenv()

app = FastAPI(
    title="Medical RAG API",
    description="REST API for Medical RAG System using PubMed and ChromaDB",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG system
email = os.getenv("PUBMED_EMAIL", "nguyentienthuan9595@gmail.com")
chroma_host = os.getenv("CHROMA_HOST", "localhost")
chroma_port = int(os.getenv("CHROMA_PORT", "7000"))

try:
    rag = MedicalRAG(
        email=email,
        chroma_host=chroma_host,
        chroma_port=chroma_port
    )
    print("Medical RAG System initialized successfully")
except Exception as e:
    print(f"Error initializing RAG system: {e}")
    rag = None


# Request/Response Models
class IndexRequest(BaseModel):
    query: str = Field(..., description="Search query for PubMed (e.g., 'diabetes treatment')")
    max_results: int = Field(default=50, ge=1, le=200, description="Maximum number of articles to index")


class QueryRequest(BaseModel):
    question: str = Field(..., description="Question to ask the RAG system")
    n_results: int = Field(default=3, ge=1, le=10, description="Number of relevant articles to return")
    auto_fetch: bool = Field(default=True, description="Automatically fetch data from PubMed if database is empty")
    auto_fetch_count: int = Field(default=30, ge=1, le=100, description="Number of articles to fetch automatically if database is empty")


class QueryResponse(BaseModel):
    answer: str
    sources_count: int
    auto_fetched: bool = False


class StatsResponse(BaseModel):
    total_articles: int
    collection_name: str
    status: str = "success"


class ClearResponse(BaseModel):
    success: bool
    message: str
    deleted_count: int


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Medical RAG API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "index": "POST /index - Index articles from PubMed",
            "query": "POST /query - Query the knowledge base",
            "stats": "GET /stats - Get database statistics",
            "clear": "DELETE /clear - Clear all data from database"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if rag is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        stats = rag.get_stats()
        return {
            "status": "healthy",
            "rag_initialized": True,
            "total_articles": stats["total_articles"]
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "rag_initialized": True,
            "error": str(e)
        }


@app.post("/crawl", response_model=Dict[str, str], responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def index_topic(request: IndexRequest):
    """
    Index articles from PubMed based on a search query
    
    - **query**: Search query for PubMed (e.g., "diabetes treatment")
    - **max_results**: Maximum number of articles to index (1-200)
    """
    if rag is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        rag.index_topic(request.query, max_results=request.max_results)
        
        # Get updated stats
        stats = rag.get_stats()
        
        return {
            "status": "success",
            "message": f"Successfully indexed articles for query: '{request.query}'",
            "total_articles": str(stats["total_articles"])
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error indexing topic: {str(e)}"
        )


@app.post("/query", response_model=QueryResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def query(request: QueryRequest):
    """
    Query the knowledge base with a question
    
    - **question**: Question to ask the RAG system
    - **n_results**: Number of relevant articles to return (1-10)
    - **auto_fetch**: Automatically fetch data from PubMed if database is empty
    - **auto_fetch_count**: Number of articles to fetch automatically if database is empty
    """
    if rag is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        # Check if database is empty before querying
        stats_before = rag.get_stats()
        db_count_before = stats_before["total_articles"]
        
        # Query the system
        answer = rag.query(
            question=request.question,
            n_results=request.n_results,
            auto_fetch=request.auto_fetch,
            auto_fetch_count=request.auto_fetch_count
        )
        
        # Check if auto-fetch happened
        stats_after = rag.get_stats()
        auto_fetched = stats_after["total_articles"] > db_count_before
        
        # Extract sources count from answer (count "Nguồn" occurrences)
        sources_count = answer.count("Nguồn")
        
        return QueryResponse(
            answer=answer,
            sources_count=sources_count,
            auto_fetched=auto_fetched
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error querying: {str(e)}"
        )


@app.get("/stats", response_model=StatsResponse, responses={500: {"model": ErrorResponse}})
async def get_stats():
    """Get database statistics"""
    if rag is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        stats = rag.get_stats()
        return StatsResponse(
            total_articles=stats["total_articles"],
            collection_name=stats["collection_name"],
            status="success"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting stats: {str(e)}"
        )


@app.delete("/clear", response_model=ClearResponse, responses={500: {"model": ErrorResponse}})
async def clear_database():
    """
    Clear all data from the database
    
    **Warning**: This operation cannot be undone!
    """
    if rag is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        # Get count before clearing
        stats_before = rag.get_stats()
        count_before = stats_before["total_articles"]
        collection_name = stats_before["collection_name"]
        
        # Clear the collection
        rag.vectordb.clear_collection()
        
        # Recreate empty collection
        rag.vectordb.collection = rag.vectordb.client.create_collection(
            name=collection_name,
            metadata={"description": "PubMed medical articles"}
        )
        
        return ClearResponse(
            success=True,
            message=f"Successfully cleared {count_before} articles from collection '{collection_name}'",
            deleted_count=count_before
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error clearing database: {str(e)}"
        )


if __name__ == "__main__":
    port = int(os.getenv("API_PORT", "8001"))
    host = os.getenv("API_HOST", "0.0.0.0")
    
    uvicorn.run(
        "pubmed_rag_api:app",
        host=host,
        port=port,
        reload=True
    )

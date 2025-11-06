from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import os
from dotenv import load_dotenv
import uvicorn
import google.generativeai as genai
from pubmed_rag_system import MedicalRAG

load_dotenv()

# Configure Gemini API for LLM generation
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    generation_model = genai.GenerativeModel('gemini-2.5-flash')
else:
    generation_model = None

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

# Initialize RAG system with retry logic
email = os.getenv("PUBMED_EMAIL", "nguyentienthuan9595@gmail.com")
chroma_host = os.getenv("CHROMA_HOST", "localhost")
chroma_port = int(os.getenv("CHROMA_PORT", "7000"))

rag = None
max_retries = 5
retry_delay = 5  # seconds

for attempt in range(max_retries):
    try:
        rag = MedicalRAG(
            email=email,
            chroma_host=chroma_host,
            chroma_port=chroma_port
        )
        print("Medical RAG System initialized successfully")
        break
    except Exception as e:
        if attempt < max_retries - 1:
            print(f"Error initializing RAG system (attempt {attempt + 1}/{max_retries}): {e}")
            print(f"Retrying in {retry_delay} seconds...")
            import time
            time.sleep(retry_delay)
        else:
            print(f"Error initializing RAG system after {max_retries} attempts: {e}")
            print(f"ChromaDB may not be ready. Please ensure ChromaDB container is running and healthy.")
            rag = None


# Request/Response Models
class IndexRequest(BaseModel):
    query: str = Field(..., description="Search query for PubMed (e.g., 'diabetes treatment')")
    max_results: int = Field(default=50, ge=1, le=200, description="Maximum number of articles to index")


class QueryRequest(BaseModel):
    question: str = Field(..., description="Question to ask the RAG system")
    n_results: int = Field(default=5, ge=1, le=10, description="Number of relevant articles to return")
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


def generate_answer_with_llm(question: str, context_sources: List[Dict], min_relevance: float = 30.0) -> str:
    # Filter sources by relevance threshold
    filtered_sources = [s for s in context_sources if s.get('relevance', 0) >= min_relevance]
    
    # If no sources meet threshold, use top source anyway (but warn in prompt)
    if not filtered_sources and context_sources:
        filtered_sources = [context_sources[0]]  # Use at least top result
        low_relevance_warning = True
    else:
        low_relevance_warning = len(filtered_sources) < len(context_sources)
    
    if generation_model is None:
        # Fallback if Gemini is not configured
        response = f"Based on medical research, I found the following information related to your question:\n\n"
        for source in filtered_sources:
            response += f"Source {source['number']}: {source['title']}\n"
            response += f"   Author: {source['authors']}\n"
            response += f"   Journal: {source['journal']} ({source['date']})\n"
            response += f"   Relevance: {source['relevance']:.1f}%\n"
            abstract = source['abstract']
            if len(abstract) > 400:
                abstract = abstract[:400] + "..."
            response += f"   {abstract}\n\n"
        response += "\nNote: This is information from medical research. "
        response += "Please consult with a doctor for the specific situation."
        return response
    
    # Calculate average relevance
    avg_relevance = sum(s.get('relevance', 0) for s in filtered_sources) / len(filtered_sources) if filtered_sources else 0
    
    # Prepare context text
    context_text = "Medical research related:\n\n"
    for source in filtered_sources:
        context_text += f"Source {source['number']}: {source['title']}\n"
        context_text += f"- Author: {source['authors']}\n"
        context_text += f"- Journal: {source['journal']} ({source['date']})\n"
        context_text += f"- Relevance: {source['relevance']:.1f}%\n"
        context_text += f"- Abstract: {source['abstract']}\n\n"
    
    # Build prompt with better instructions
    relevance_note = ""
    if low_relevance_warning or avg_relevance < 50:
        relevance_note = "\n\nLƯU Ý: Một số nguồn có độ liên quan thấp. Hãy cố gắng trả lời câu hỏi dựa trên bất kỳ thông tin liên quan nào bạn tìm thấy, ngay cả khi không hoàn toàn phù hợp. Nếu thông tin không đủ, hãy đề xuất người dùng tìm kiếm với từ khóa cụ thể hơn."
    
    prompt = f"""
You are a professional medical assistant, tasked with answering medical questions based on scientific research from PubMed. User Question: {question}
{context_text}
YOUR TASKS:
1. MUST answer the user's question in a useful and detailed way
2. Synthesize information from the above studies, prioritizing sources with higher relevance
3. Respond in Vietnamese naturally, like a doctor explaining to a patient
4. If the studies are partially related (e.g., same medical field but different topic), please:
- Answer based on the most relevant information you found
- Explain the connection between the information and the question
- Suggest the user to search with more specific keywords if needed
5. If there are different views, present them fully
6. DO NOT just say "no relevant information" - always try to provide value from what is available
7. Answer based on the language of the user's question

{relevance_note}

After answering, list the references in the format:
[Source X] Name Article - Author, Journal (Year)
Final Note: This is information from scientific studies. Please consult your doctor for specific situations.
Start answering in a helpful and detailed way:

"""
    
    try:
        response_obj = generation_model.generate_content(prompt)
        answer = response_obj.text.strip()

        answer += "\n\n---\n\nReferences:\n"
        for source in context_sources:
            answer += f"\n[{source['number']}] {source['title']}\n"
            answer += f"   Author: {source['authors']}\n"
            answer += f"   Journal: {source['journal']} ({source['date']})\n"
            answer += f"   Relevance: {source['relevance']:.1f}%\n"
        
        return answer
        
    except Exception as e:
        print(f"Error generating answer with LLM: {e}")
        import traceback
        traceback.print_exc()
        
        # fallback
        response = f"Based on medical research, I found the following information related to your question:\n\n"
        
        for source in context_sources:
            response += f"Source {source['number']}: {source['title']}\n"
            response += f"   Author: {source['authors']}\n"
            response += f"   Journal: {source['journal']} ({source['date']})\n"
            response += f"   Relevance: {source['relevance']:.1f}%\n"
            
            # extract abstract (limit length)
            abstract = source['abstract']
            if len(abstract) > 400:
                abstract = abstract[:400] + "..."
            response += f"   {abstract}\n\n"
        
        response += "\nNote: This is information from scientific studies. "
        response += "Please consult your doctor for the specific situation."
        
        return response


@app.post("/query", response_model=QueryResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def query(request: QueryRequest):
    if rag is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        # Check if database is empty before querying
        stats_before = rag.get_stats()
        db_count_before = stats_before["total_articles"]
        
        # Retrieve context from RAG system (without LLM generation)
        context_result = rag.retrieve_context(
            question=request.question,
            n_results=request.n_results,
            auto_fetch=request.auto_fetch,
            auto_fetch_count=request.auto_fetch_count
        )
        
        # Check if auto-fetch happened
        stats_after = rag.get_stats()
        auto_fetched = stats_after["total_articles"] > db_count_before
        
        if not context_result["success"]:
            # Return error message if no context found
            sources_count = 0
            answer = context_result["error_message"]
        else:
            # Generate answer using LLM at API layer
            context_sources = context_result["context_sources"]
            
            # Check if average relevance is too low - might need to fetch more data
            avg_relevance = sum(s.get('relevance', 0) for s in context_sources) / len(context_sources) if context_sources else 0
            
            # If average relevance is very low (< 40%) and auto_fetch is enabled, try fetching more specific data
            if avg_relevance < 40 and request.auto_fetch and not auto_fetched:
                # print(f"\nĐộ liên quan thấp ({avg_relevance:.1f}%). Đang thử crawl thêm dữ liệu với từ khóa cụ thể hơn...")
                try:
                    # Try to fetch more specific data
                    rag.index_topic(request.question, max_results=request.auto_fetch_count)
                    # Retrieve context again with new data
                    context_result = rag.retrieve_context(
                        question=request.question,
                        n_results=request.n_results,
                        auto_fetch=False,  # Don't auto-fetch again
                        auto_fetch_count=0
                    )
                    if context_result["success"]:
                        context_sources = context_result["context_sources"]
                        new_avg_relevance = sum(s.get('relevance', 0) for s in context_sources) / len(context_sources) if context_sources else 0
                        # print(f"Crawled more data. New relevance: {new_avg_relevance:.1f}%")
                        auto_fetched = True
                except Exception as e:
                    print(f"Cannot crawl more data: {e}")
            
            # Generate answer
            if avg_relevance < 40:
                answer = generate_answer_with_llm(request.question, context_sources, min_relevance=20.0)
            else:
                answer = generate_answer_with_llm(request.question, context_sources)
            
            sources_count = len(context_sources)
        
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
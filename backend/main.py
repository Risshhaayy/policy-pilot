"""
PolicyPilot Backend — FastAPI Application
Multi-agent AI system for Indian government welfare scheme discovery.
"""
import os
import json
import traceback
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

# ── Initialize RAG on startup ──
retriever = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global retriever
    from rag.retriever import SchemeRetriever
    from rag.ingest import ingest_pdfs, CHROMA_DIR
    
    # Check if already ingested
    chroma_path = Path(CHROMA_DIR)
    if not chroma_path.exists() or not any(chroma_path.iterdir()):
        print("📥 First run — ingesting PDFs into ChromaDB (local embeddings)...")
        ingest_pdfs()  # Uses default local embeddings
    
    retriever = SchemeRetriever()  # Uses default local embeddings
    count = retriever.get_collection_count()
    print(f"✅ RAG ready — {count} chunks indexed from {len(retriever.get_all_schemes())} schemes")
    
    yield
    print("👋 Shutting down PolicyPilot")

app = FastAPI(
    title="PolicyPilot API",
    description="Agentic AI system for Indian government welfare scheme discovery",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ──
class QueryRequest(BaseModel):
    query: str
    language: Optional[str] = "en"

class TranslateRequest(BaseModel):
    text: str
    language: str = "hi"

class FormRequest(BaseModel):
    scheme_name: str
    profile: dict

class RequiredDocsRequest(BaseModel):
    scheme_name: str
    form_fields: List[dict]

class FormSubmitRequest(BaseModel):
    scheme_name: str
    form_fields: List[dict]
    uploaded_documents: List[str]


# ── ROUTES ──

@app.get("/api/health")
async def health():
    count = retriever.get_collection_count() if retriever else 0
    return {
        "status": "healthy",
        "chunks_indexed": count,
        "llm_backend": "ollama (local)",
    }


@app.get("/api/schemes")
async def list_schemes():
    """List all indexed government schemes."""
    if not retriever:
        raise HTTPException(500, "RAG not initialized")
    schemes = retriever.get_all_schemes()
    return {"schemes": schemes, "count": len(schemes)}


@app.post("/api/query")
async def process_query(req: QueryRequest):
    """
    Main endpoint — process a citizen's natural language query.
    Runs the full multi-agent pipeline.
    """
    if not retriever:
        raise HTTPException(500, "RAG not initialized")
    

    try:
        from agents.orchestrator import run_full_pipeline
        result = run_full_pipeline(req.query, retriever, req.language)
        return JSONResponse(content=result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Pipeline error: {str(e)}")


@app.post("/api/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("aadhaar"),
):
    """Parse an uploaded document (Aadhaar, income cert, etc.)."""
    
    try:
        content = await file.read()
        
        # Extract text based on file type
        text = ""
        if file.filename.endswith(".pdf"):
            import fitz
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                text += page.get_text("text")
            doc.close()
        else:
            text = content.decode("utf-8", errors="ignore")
        
        if not text.strip():
            raise HTTPException(400, "Could not extract text from document")
        
        from agents.orchestrator import document_parsing_agent
        result = document_parsing_agent(text, doc_type)
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Document parsing error: {str(e)}")


@app.post("/api/form/generate")
async def generate_form(req: FormRequest):
    """Generate a pre-filled application form for a scheme."""
    
    try:
        from agents.orchestrator import form_filling_agent
        result = form_filling_agent(req.profile, req.scheme_name)
        
        # Validate result has required structure
        if not result.get("fields") or not isinstance(result["fields"], list):
            # Build a basic fallback form from profile
            profile = req.profile or {}
            fallback_fields = []
            field_map = {
                "name": "Full Name", "age": "Age", "gender": "Gender",
                "income_annual": "Annual Income (₹)", "occupation": "Occupation",
                "state": "State", "district": "District", "category": "Category (SC/ST/OBC/General)",
                "family_size": "Family Size", "housing_status": "Housing Status",
            }
            for key, label in field_map.items():
                val = profile.get(key)
                fallback_fields.append({
                    "field_name": key, "label": label,
                    "value": str(val) if val is not None else "",
                    "type": "text", "required": True,
                    "filled": val is not None, "confidence": 0.9 if val else 0.0
                })
            result = {
                "scheme_name": req.scheme_name,
                "form_title": f"Application Form — {req.scheme_name}",
                "fields": fallback_fields,
                "missing_fields": [label for key, label in field_map.items() if not profile.get(key)],
                "completion_percentage": int(sum(1 for k in field_map if profile.get(k)) / len(field_map) * 100),
            }
        
        return JSONResponse(content=result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Form generation error: {str(e)}")


@app.post("/api/form/required-docs")
async def get_required_docs(req: RequiredDocsRequest):
    """Check which documents are still needed to complete a form."""
    
    try:
        from agents.orchestrator import required_documents_for_form
        result = required_documents_for_form(req.scheme_name, req.form_fields)
        return JSONResponse(content=result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Required docs check error: {str(e)}")


@app.post("/api/form/submit")
async def submit_form(req: FormSubmitRequest):
    """Validate and submit a completed form to the scheme portal."""
    
    try:
        from agents.orchestrator import form_submission_agent
        result = form_submission_agent(req.scheme_name, req.form_fields, req.uploaded_documents)
        return JSONResponse(content=result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"Form submission error: {str(e)}")


@app.post("/api/translate")
async def translate(req: TranslateRequest):
    """Translate text into Hindi or regional language."""
    
    try:
        from agents.orchestrator import multilingual_agent
        translated = multilingual_agent(req.text, req.language)
        return {"original": req.text, "translated": translated, "language": req.language}
    except Exception as e:
        raise HTTPException(500, f"Translation error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

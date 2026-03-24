"""RAG Ingestion Pipeline — Chunk PDFs and store in ChromaDB."""
import os
import fitz  # PyMuPDF
import chromadb
from chromadb.utils import embedding_functions

PDF_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "pdfs")
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "chromadb")

def extract_text_from_pdf(pdf_path: str) -> list[dict]:
    """Extract text from PDF with page-level metadata."""
    doc = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text").strip()
        if text:
            pages.append({
                "text": text,
                "page": i + 1,
                "source": os.path.basename(pdf_path),
            })
    doc.close()
    return pages


def semantic_chunk(pages: list[dict], max_chunk_size: int = 800) -> list[dict]:
    """
    Semantic chunking: split by clauses/sections, keeping metadata.
    Each chunk preserves its source PDF and clause references.
    """
    chunks = []
    for page_data in pages:
        text = page_data["text"]
        source = page_data["source"]
        page_num = page_data["page"]
        
        # Split by clause markers
        lines = text.split("\n")
        current_chunk = []
        current_section = ""
        
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            
            # Detect section headers
            if stripped.startswith(("1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.")):
                if any(kw in stripped.upper() for kw in ["OBJECTIVE", "ELIGIBILITY", "CRITERIA", 
                    "EXCLUSION", "APPLICATION", "BENEFIT", "CONFLICT", "FUND", "DOCUMENT",
                    "EMPLOYMENT", "WAGES", "CONVERGENCE", "COVERAGE", "ENTITLEMENT",
                    "LEGAL", "JOB", "PROVISION"]):
                    # Save previous chunk
                    if current_chunk:
                        chunk_text = "\n".join(current_chunk)
                        if len(chunk_text) > 20:
                            chunks.append({
                                "text": chunk_text,
                                "source": source,
                                "page": page_num,
                                "section": current_section,
                            })
                    current_chunk = [stripped]
                    current_section = stripped
                    continue
            
            # Detect clause markers
            if stripped.startswith("Clause"):
                if current_chunk and len("\n".join(current_chunk)) > max_chunk_size:
                    chunk_text = "\n".join(current_chunk)
                    chunks.append({
                        "text": chunk_text,
                        "source": source,
                        "page": page_num,
                        "section": current_section,
                    })
                    current_chunk = []
            
            current_chunk.append(stripped)
        
        # Save remaining
        if current_chunk:
            chunk_text = "\n".join(current_chunk)
            if len(chunk_text) > 20:
                chunks.append({
                    "text": chunk_text,
                    "source": source,
                    "page": page_num,
                    "section": current_section,
                })
    
    return chunks


def get_scheme_name(filename: str) -> str:
    """Map filename to scheme name."""
    mapping = {
        "pm_kisan.pdf": "PM-KISAN",
        "pmay_gramin.pdf": "PMAY-G (Housing)",
        "ayushman_bharat.pdf": "Ayushman Bharat PM-JAY (Health)",
        "pm_ujjwala.pdf": "PM Ujjwala Yojana (LPG)",
        "mgnrega.pdf": "MGNREGA (Employment)",
        "nfsa.pdf": "NFSA (Food Security)",
    }
    return mapping.get(filename, filename.replace(".pdf", "").replace("_", " ").title())


def get_category(filename: str) -> str:
    """Categorize scheme."""
    mapping = {
        "pm_kisan.pdf": "agriculture",
        "pmay_gramin.pdf": "housing",
        "ayushman_bharat.pdf": "health",
        "pm_ujjwala.pdf": "fuel_subsidy",
        "mgnrega.pdf": "employment",
        "nfsa.pdf": "food_security",
    }
    return mapping.get(filename, "general")


def ingest_pdfs():
    """Main ingestion pipeline: PDF → chunks → ChromaDB."""
    os.makedirs(CHROMA_DIR, exist_ok=True)
    
    # Initialize ChromaDB with local embeddings
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    ef = embedding_functions.DefaultEmbeddingFunction()
    
    # Delete existing collection if present
    try:
        client.delete_collection("schemes")
    except Exception:
        pass
    
    collection = client.get_or_create_collection(
        name="schemes",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )
    
    # Process all PDFs
    all_chunks = []
    pdf_files = [f for f in os.listdir(PDF_DIR) if f.endswith(".pdf")]
    
    for pdf_file in pdf_files:
        pdf_path = os.path.join(PDF_DIR, pdf_file)
        print(f"📄 Processing: {pdf_file}")
        
        pages = extract_text_from_pdf(pdf_path)
        chunks = semantic_chunk(pages)
        
        scheme_name = get_scheme_name(pdf_file)
        category = get_category(pdf_file)
        
        for chunk in chunks:
            chunk["scheme"] = scheme_name
            chunk["category"] = category
        
        all_chunks.extend(chunks)
        print(f"   → {len(chunks)} chunks extracted")
    
    # Add to ChromaDB
    if all_chunks:
        ids = [f"chunk_{i}" for i in range(len(all_chunks))]
        documents = [c["text"] for c in all_chunks]
        metadatas = [{
            "source": c["source"],
            "page": c["page"],
            "section": c["section"],
            "scheme": c["scheme"],
            "category": c["category"],
        } for c in all_chunks]
        
        # Batch insert (ChromaDB limit is ~5000 per batch)
        batch_size = 100
        for i in range(0, len(ids), batch_size):
            collection.add(
                ids=ids[i:i+batch_size],
                documents=documents[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size],
            )
        
        print(f"\n✅ Ingested {len(all_chunks)} chunks from {len(pdf_files)} PDFs into ChromaDB")
    
    return len(all_chunks)


if __name__ == "__main__":
    ingest_pdfs()

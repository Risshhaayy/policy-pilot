"""
RAG Chain — ChromaDB retrieval with LangChain over real government PDFs.
Reuses the existing ChromaDB store from the backend.
"""
import os
import sys
from pathlib import Path

from chromadb.utils import embedding_functions
import chromadb

# ── Paths ──
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent / "backend"
CHROMA_DIR = str(BACKEND_DIR / "data" / "chromadb")
PDF_DIR = str(BACKEND_DIR / "data" / "pdfs")

# ── Default embedding (ChromaDB's built-in, same as ingest) ──
_chroma_ef = embedding_functions.DefaultEmbeddingFunction()


class PolicyRAG:
    """RAG retriever over government scheme PDFs stored in ChromaDB."""

    def __init__(self, ollama_model: str = "llama3.2"):
        self.client = chromadb.PersistentClient(path=CHROMA_DIR)
        self.collection = self.client.get_or_create_collection(
            name="schemes",
            embedding_function=_chroma_ef,
        )
        self.model = ollama_model

    # ── Low-level search ──
    def search(self, query: str, top_k: int = 10, scheme_filter: str = None) -> list[dict]:
        """Hybrid search: semantic similarity + optional scheme filter."""
        where = {"scheme": scheme_filter} if scheme_filter else None
        results = self.collection.query(
            query_texts=[query], n_results=top_k, where=where,
            include=["documents", "metadatas", "distances"],
        )
        chunks = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i] if results["metadatas"] else {}
                dist = results["distances"][0][i] if results["distances"] else 0
                chunks.append({
                    "text": doc,
                    "source": meta.get("source", ""),
                    "scheme": meta.get("scheme", ""),
                    "section": meta.get("section", ""),
                    "page": meta.get("page", 0),
                    "score": round(1 - dist, 4),
                })
        return chunks

    def get_all_schemes(self) -> list[str]:
        """Get all indexed scheme names."""
        data = self.collection.get(include=["metadatas"])
        schemes = set()
        if data and data["metadatas"]:
            for m in data["metadatas"]:
                if m.get("scheme"):
                    schemes.add(m["scheme"])
        return sorted(schemes)

    def get_chunk_count(self) -> int:
        return self.collection.count()

    # ── High-level QA ──
    def query_with_sources(self, question: str, top_k: int = 8) -> dict:
        """Search + format context with source citations."""
        chunks = self.search(question, top_k=top_k)
        if not chunks:
            return {"answer": "No relevant scheme information found.", "sources": []}

        context = "\n\n".join([
            f"[Source: {c['scheme']} — {c['source']}, Page {c['page']}, Section: {c['section']}]\n{c['text']}"
            for c in chunks
        ])

        sources = list(set(f"{c['scheme']} ({c['source']}, p.{c['page']})" for c in chunks))
        return {"context": context, "sources": sources, "chunks": chunks}


def ensure_ingested():
    """Check if ChromaDB has data, if not run ingestion."""
    chroma_path = Path(CHROMA_DIR)
    if not chroma_path.exists() or not any(chroma_path.iterdir()):
        print("📥 First run — ingesting PDFs into ChromaDB...")
        sys.path.insert(0, str(BACKEND_DIR))
        from rag.ingest import ingest_pdfs
        ingest_pdfs()
        print("✅ Ingestion complete")

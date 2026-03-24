"""RAG Retriever — Hybrid search over ChromaDB for scheme clauses."""
import os
import chromadb
from chromadb.utils import embedding_functions

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "chromadb")


class SchemeRetriever:
    """Hybrid retriever combining semantic + keyword search over scheme chunks."""
    
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_DIR)
        self.ef = embedding_functions.DefaultEmbeddingFunction()
        
        self.collection = self.client.get_or_create_collection(
            name="schemes",
            embedding_function=self.ef,
        )
    
    def search(self, query: str, top_k: int = 15, category_filter: str = None) -> list[dict]:
        """
        Hybrid search: semantic similarity + optional category filter.
        Returns ranked chunks with source citations.
        """
        where_filter = None
        if category_filter:
            where_filter = {"category": category_filter}
        
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )
        
        chunks = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 0
                chunks.append({
                    "text": doc,
                    "source": meta.get("source", "unknown"),
                    "page": meta.get("page", 0),
                    "section": meta.get("section", ""),
                    "scheme": meta.get("scheme", ""),
                    "category": meta.get("category", ""),
                    "relevance_score": round(1 - distance, 4),
                })
        
        return chunks
    
    def search_by_scheme(self, scheme_name: str, query: str = "", top_k: int = 20) -> list[dict]:
        """Search within a specific scheme."""
        results = self.collection.query(
            query_texts=[query or scheme_name],
            n_results=top_k,
            where={"scheme": scheme_name},
            include=["documents", "metadatas", "distances"],
        )
        
        chunks = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i]
                chunks.append({
                    "text": doc,
                    "source": meta.get("source", ""),
                    "scheme": meta.get("scheme", ""),
                    "section": meta.get("section", ""),
                })
        return chunks
    
    def get_all_schemes(self) -> list[str]:
        """Get list of all indexed schemes."""
        all_data = self.collection.get(include=["metadatas"])
        schemes = set()
        if all_data and all_data["metadatas"]:
            for meta in all_data["metadatas"]:
                if meta.get("scheme"):
                    schemes.add(meta["scheme"])
        return sorted(list(schemes))
    
    def get_collection_count(self) -> int:
        return self.collection.count()

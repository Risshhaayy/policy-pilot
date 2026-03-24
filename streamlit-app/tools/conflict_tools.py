"""
LangChain Tools — Conflict Detection between Central and State schemes.
"""
import sys
from pathlib import Path
from langchain.tools import tool

BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent / "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


@tool
def detect_conflicts(user_description: str) -> str:
    """Detect conflicts and contradictions between government schemes based on citizen profile.
    Compares Central vs State scheme rules and flags contradictions with citations.
    Input should describe the citizen's situation."""
    from agents.orchestrator import (
        query_understanding_agent, eligibility_agent,
        conflict_detection_agent
    )
    from chains.rag_chain import PolicyRAG
    
    profile = query_understanding_agent(user_description)
    rag = PolicyRAG()
    chunks = rag.search(user_description, top_k=15)
    eligibility = eligibility_agent(profile, chunks)
    result = conflict_detection_agent(eligibility, chunks)
    
    conflicts = result.get("conflicts", [])
    
    if not conflicts:
        return "✅ **No conflicts detected** between eligible schemes. All schemes are compatible."
    
    output = f"⚠️ **{len(conflicts)} Conflict(s) Detected:**\n\n"
    for i, c in enumerate(conflicts, 1):
        schemes = c.get("schemes", [])
        output += f"**Conflict {i}:** {' vs '.join(schemes)}\n"
        output += f"  Issue: {c.get('issue', 'N/A')}\n"
        if c.get("citations"):
            output += f"  📌 Citations: {', '.join(c['citations'])}\n"
        if c.get("resolution"):
            output += f"  💡 Resolution: {c['resolution']}\n"
        output += "\n"
    
    return output

"""
LangChain Tools — Scheme search, eligibility, conflicts, optimizer.
"""
import json
import sys
from pathlib import Path
from langchain.tools import tool

# Add backend to path for orchestrator reuse
BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent / "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


@tool
def search_schemes(query: str) -> str:
    """Search government scheme PDFs using RAG. Returns relevant clauses with source citations.
    Use this when the user asks about schemes, eligibility, benefits, or any policy question."""
    from chains.rag_chain import PolicyRAG
    rag = PolicyRAG()
    result = rag.query_with_sources(query, top_k=8)
    
    if not result.get("chunks"):
        return "No relevant scheme information found in the database."
    
    output = "📄 **Retrieved Scheme Clauses:**\n\n"
    for i, chunk in enumerate(result["chunks"][:6], 1):
        output += f"**{i}. {chunk['scheme']}** (Source: {chunk['source']}, Page {chunk['page']})\n"
        output += f"   Section: {chunk['section']}\n"
        output += f"   > {chunk['text'][:300]}...\n"
        output += f"   Relevance: {chunk['score']}\n\n"
    
    output += f"\n📚 Sources: {', '.join(result['sources'])}"
    return output


@tool
def check_eligibility(user_description: str) -> str:
    """Check which government schemes a citizen is eligible for based on their profile description.
    Input should be a natural language description like 'I am a 35 year old farmer in Gujarat with income 1.2 lakh'.
    Returns eligible and ineligible schemes with reasons."""
    from agents.orchestrator import query_understanding_agent, eligibility_agent
    from chains.rag_chain import PolicyRAG
    
    # Parse profile
    profile = query_understanding_agent(user_description)
    
    # Get RAG chunks
    rag = PolicyRAG()
    chunks = rag.search(user_description, top_k=15)
    
    # Run eligibility
    result = eligibility_agent(profile, chunks)
    
    eligible = [s for s in result.get("schemes", []) if s.get("eligible")]
    ineligible = [s for s in result.get("schemes", []) if not s.get("eligible")]
    
    output = f"👤 **Detected Profile:** {json.dumps(profile, indent=2)}\n\n"
    output += f"✅ **Eligible Schemes ({len(eligible)}):**\n"
    for s in eligible:
        output += f"  • **{s['name']}** — {s.get('benefit', 'N/A')}\n"
        output += f"    Reason: {s.get('reasoning', 'Meets criteria')}\n"
        if s.get("citations"):
            output += f"    📌 Citations: {', '.join(s['citations'][:2])}\n"
    
    if ineligible:
        output += f"\n❌ **Not Eligible ({len(ineligible)}):**\n"
        for s in ineligible:
            output += f"  • **{s['name']}** — {s.get('reasoning', 'Does not meet criteria')}\n"
            if s.get("how_to_fix"):
                output += f"    💡 How to qualify: {s['how_to_fix']}\n"
    
    return output


@tool
def optimize_schemes(user_description: str) -> str:
    """Find the best combination of schemes to maximize total annual benefit for a citizen.
    Input should describe the citizen's situation."""
    from agents.orchestrator import query_understanding_agent, eligibility_agent, scheme_optimizer_agent, conflict_detection_agent
    from chains.rag_chain import PolicyRAG
    
    profile = query_understanding_agent(user_description)
    rag = PolicyRAG()
    chunks = rag.search(user_description, top_k=15)
    eligibility = eligibility_agent(profile, chunks)
    conflicts = conflict_detection_agent(eligibility, chunks)
    result = scheme_optimizer_agent(eligibility, conflicts.get("conflicts", []))
    
    output = "💎 **Scheme Optimizer Results:**\n\n"
    if result.get("best_combination"):
        output += f"🏆 Best Combination: {', '.join(result['best_combination'])}\n"
        output += f"💰 Total Benefit: {result.get('total_benefit', 'N/A')}\n"
        output += f"📝 Reason: {result.get('reason', 'N/A')}\n"
    
    if result.get("all_combinations"):
        output += "\n**All Ranked Combinations:**\n"
        for i, combo in enumerate(result["all_combinations"][:3], 1):
            output += f"  {i}. {combo.get('schemes', 'N/A')} — {combo.get('total_benefit', 'N/A')}\n"
    
    return output

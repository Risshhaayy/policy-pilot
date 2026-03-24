"""
LangChain Tools — Life Journey Planner + Nearest Action Path.
"""
import sys
from pathlib import Path
from langchain.tools import tool

BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent / "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


@tool
def life_journey_planner(user_description: str) -> str:
    """Generate a 5-year roadmap of future government scheme eligibility based on life events.
    Predicts which schemes the user will qualify for in upcoming years based on marriage,
    child birth, retirement, etc. Input should describe the citizen's current situation."""
    from agents.orchestrator import query_understanding_agent, eligibility_agent, life_journey_agent
    from chains.rag_chain import PolicyRAG
    
    profile = query_understanding_agent(user_description)
    rag = PolicyRAG()
    chunks = rag.search(user_description, top_k=10)
    eligibility = eligibility_agent(profile, chunks)
    result = life_journey_agent(profile, eligibility)
    
    output = "🗓️ **Life Journey — 5-Year Scheme Roadmap**\n\n"
    
    timeline = result.get("timeline", [])
    for entry in timeline:
        year = entry.get("year", "")
        scheme = entry.get("scheme", "")
        event = entry.get("life_event", "")
        benefit = entry.get("benefit", "")
        output += f"**{year}:** {scheme}\n"
        if event:
            output += f"  Life Event: {event}\n"
        if benefit:
            output += f"  Benefit: {benefit}\n"
        output += "\n"
    
    if result.get("recommendations"):
        output += "💡 **Recommendations:**\n"
        for r in result["recommendations"]:
            output += f"  • {r}\n"
    
    return output if timeline else output + "No future timeline generated. Try providing more details about your situation."


@tool
def nearest_action_path(user_description: str) -> str:
    """Find the nearest government offices and step-by-step physical journey to apply for schemes.
    Returns office locations, departments, room numbers, working hours, and required documents.
    Input should describe the citizen's situation and location."""
    from agents.orchestrator import query_understanding_agent, eligibility_agent, nearest_action_path_agent
    from chains.rag_chain import PolicyRAG
    
    profile = query_understanding_agent(user_description)
    rag = PolicyRAG()
    chunks = rag.search(user_description, top_k=10)
    eligibility = eligibility_agent(profile, chunks)
    result = nearest_action_path_agent(profile, eligibility)
    
    output = "📍 **Nearest Action Paths:**\n\n"
    
    paths = result.get("action_paths", result)
    if isinstance(paths, dict):
        for scheme, path_info in paths.items():
            output += f"**🏛️ {scheme}:**\n"
            if isinstance(path_info, dict):
                for key, val in path_info.items():
                    if val:
                        output += f"  • {key.replace('_', ' ').title()}: {val}\n"
            elif isinstance(path_info, str):
                output += f"  {path_info}\n"
            output += "\n"
    elif isinstance(paths, list):
        for p in paths:
            output += f"  • {p}\n"
    
    return output

"""
LangChain Agent — AgentExecutor with all PolicyPilot tools.
Uses Ollama (local) as LLM with ConversationBufferMemory.
Optional LangSmith tracing via environment variables.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Add paths
BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent / "backend")
APP_DIR = str(Path(__file__).resolve().parent.parent)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

from langchain_ollama import ChatOllama
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferWindowMemory

# ── Import all tools ──
from tools.scheme_tools import search_schemes, check_eligibility, optimize_schemes
from tools.conflict_tools import detect_conflicts
from tools.form_tools import generate_application_form, parse_uploaded_document
from tools.journey_tools import life_journey_planner, nearest_action_path
from tools.translate_tools import translate_text

# ── LangSmith (optional) ──
if os.getenv("LANGCHAIN_API_KEY"):
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT", "PolicyPilot")
    print("📊 LangSmith tracing enabled")

# All available tools
ALL_TOOLS = [
    search_schemes,
    check_eligibility,
    optimize_schemes,
    detect_conflicts,
    generate_application_form,
    parse_uploaded_document,
    life_journey_planner,
    nearest_action_path,
    translate_text,
]

SYSTEM_PROMPT = """You are PolicyPilot — an AI assistant that helps Indian citizens discover, understand, and apply for government welfare schemes.

You have access to the following tools:
1. **search_schemes** — Search government PDF documents using RAG for scheme information
2. **check_eligibility** — Check which schemes a citizen qualifies for
3. **optimize_schemes** — Find the best scheme combination for maximum benefit
4. **detect_conflicts** — Find contradictions between Central and State scheme rules
5. **generate_application_form** — Generate auto-filled application forms
6. **parse_uploaded_document** — Extract data from uploaded documents
7. **life_journey_planner** — Create a 5-year scheme eligibility roadmap
8. **nearest_action_path** — Find nearest offices and step-by-step directions
9. **translate_text** — Translate text to Indian languages (Hindi, Tamil, etc.)

RULES:
- When a user describes their situation, ALWAYS use check_eligibility first
- Then offer to show conflicts, action paths, forms, and life journey
- Cite sources from PDFs when available
- Be conversational but thorough
- Use markdown formatting for readability
- If the user asks about a specific scheme, use search_schemes
- If the user wants forms, use generate_application_form
- When translating, always specify the language code

You are speaking with an Indian citizen who needs help navigating government schemes. Be empathetic, clear, and action-oriented."""


def create_agent(model: str = "llama3.2", temperature: float = 0.1):
    """Create a LangChain agent with all PolicyPilot tools."""
    
    llm = ChatOllama(
        model=model,
        temperature=temperature,
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])
    
    # Create the agent
    agent = create_tool_calling_agent(llm, ALL_TOOLS, prompt)
    
    # Wrap in executor
    executor = AgentExecutor(
        agent=agent,
        tools=ALL_TOOLS,
        verbose=True,
        max_iterations=8,
        handle_parsing_errors=True,
        return_intermediate_steps=True,
    )
    
    return executor


def create_simple_chain(model: str = "llama3.2"):
    """Fallback: simple LLM chain without tool-calling (for models that don't support it)."""
    from langchain_ollama import ChatOllama
    from langchain.prompts import ChatPromptTemplate
    from langchain.schema.runnable import RunnablePassthrough
    
    llm = ChatOllama(
        model=model,
        temperature=0.1,
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    )
    
    return llm

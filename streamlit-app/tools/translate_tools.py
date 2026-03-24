"""
LangChain Tools — Multilingual translation.
"""
import sys
from pathlib import Path
from langchain.tools import tool

BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent / "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


@tool
def translate_text(text_and_language: str) -> str:
    """Translate text into an Indian language.
    Input format: 'target_language | text to translate'
    Supported languages: hi (Hindi), ta (Tamil), te (Telugu), bn (Bengali), mr (Marathi), gu (Gujarati), kn (Kannada)
    Example: 'hi | You are eligible for PM-KISAN scheme'"""
    from agents.orchestrator import multilingual_agent
    
    parts = text_and_language.split("|", 1)
    lang = parts[0].strip() if len(parts) > 1 else "hi"
    text = parts[1].strip() if len(parts) > 1 else parts[0].strip()
    
    translated = multilingual_agent(text, lang)
    
    lang_names = {
        "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali",
        "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada", "en": "English"
    }
    
    return f"🌐 **Translation ({lang_names.get(lang, lang)}):**\n\n{translated}"

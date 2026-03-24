"""
LangChain Tools — Form auto-fill and document parsing.
"""
import sys
from pathlib import Path
from langchain.tools import tool

BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent / "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


@tool
def generate_application_form(scheme_name_and_profile: str) -> str:
    """Generate a pre-filled application form for a government scheme.
    Input format: 'scheme_name | profile description'
    Example: 'PM-KISAN | I am a farmer, age 35, income 1.2 lakh, Gujarat, SC category'
    Returns form fields with auto-filled values."""
    from agents.orchestrator import query_understanding_agent, form_filling_agent
    
    parts = scheme_name_and_profile.split("|", 1)
    scheme_name = parts[0].strip()
    profile_desc = parts[1].strip() if len(parts) > 1 else scheme_name
    
    profile = query_understanding_agent(profile_desc)
    result = form_filling_agent(profile, scheme_name)
    
    output = f"📝 **Application Form — {scheme_name}**\n\n"
    fields = result.get("fields", [])
    filled = sum(1 for f in fields if f.get("filled"))
    total = len(fields)
    pct = int(filled / total * 100) if total else 0
    
    output += f"📊 Completion: **{pct}%** ({filled}/{total} fields filled)\n\n"
    
    for f in fields:
        status = "✅" if f.get("filled") else "⬜"
        val = f.get("value", "")
        label = f.get("label", f.get("field_name", ""))
        conf = f.get("confidence", 0)
        
        if f.get("filled"):
            output += f"{status} **{label}:** {val} (confidence: {int(conf*100)}%)\n"
        else:
            output += f"{status} **{label}:** _[needs input]_\n"
    
    missing = result.get("missing_fields", [])
    if missing:
        output += f"\n⚠️ **Missing fields:** {', '.join(missing)}\n"
        output += "💡 Upload your documents (Aadhaar, income cert) to auto-fill these."
    
    return output


@tool
def parse_uploaded_document(document_text: str) -> str:
    """Extract structured data (name, age, income, address, category) from a document's text content.
    Input should be the raw text extracted from an Aadhaar card, income certificate, or caste certificate.
    Returns extracted fields that can auto-fill application forms."""
    from agents.orchestrator import document_parsing_agent
    
    result = document_parsing_agent(document_text, "general")
    
    output = "📄 **Extracted Document Data:**\n\n"
    fields = result.get("extracted_fields", result)
    
    if isinstance(fields, dict):
        for key, val in fields.items():
            if val and key != "raw_text":
                output += f"  • **{key.replace('_', ' ').title()}:** {val}\n"
    
    output += "\n✅ These fields can be used to auto-fill application forms."
    return output

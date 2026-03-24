"""
PolicyPilot Orchestrator — The central multi-agent engine.
Coordinates all agents to process a user query end-to-end.
"""
import os
import json
from openai import OpenAI
from typing import Optional

from rag.retriever import SchemeRetriever

# ─── LLM Client (Ollama via OpenAI-compatible API) ───
def get_llm_client():
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
    return OpenAI(base_url=base_url, api_key="ollama")

def llm_call(system_prompt: str, user_prompt: str, json_mode: bool = True) -> str:
    """Make a single LLM call with structured output."""
    client = get_llm_client()
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    
    # Add JSON instruction to system prompt for Ollama (since it may not support response_format)
    if json_mode:
        messages[0]["content"] += "\n\nIMPORTANT: You MUST respond with ONLY valid JSON. No markdown, no explanation, no code fences. Just the raw JSON object."
    
    kwargs = {
        "model": os.environ.get("LLM_MODEL", "llama3"),
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 4096,
    }
    
    # Only use response_format if not Ollama (Ollama may not support it)
    # We rely on prompt engineering for JSON output with Ollama
    
    response = client.chat.completions.create(**kwargs)
    content = response.choices[0].message.content
    
    # Clean response — strip markdown code fences if Ollama adds them
    if content and json_mode:
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
    
    return content


# ═══════════════════════════════════════════════════
# AGENT 1: QUERY UNDERSTANDING
# ═══════════════════════════════════════════════════
def query_understanding_agent(user_input: str) -> dict:
    """Parse natural language into structured citizen profile."""
    system = """You are a Query Understanding Agent for an Indian government welfare scheme system.
Extract a structured citizen profile from the user's natural language input.
Return ONLY valid JSON with these fields (use null for unknown):
{
  "name": "string or null",
  "age": "integer or null",
  "gender": "male/female/other or null",
  "income_annual": "integer (in rupees) or null",
  "occupation": "string or null",
  "state": "string (Indian state) or null",
  "district": "string or null",
  "category": "General/SC/ST/OBC or null",
  "is_bpl": "boolean or null",
  "land_ownership_acres": "float or null",
  "has_aadhaar": "boolean, default true",
  "family_size": "integer or null",
  "has_bank_account": "boolean, default true",
  "housing_status": "pucca/kutcha/homeless or null",
  "is_farmer": "boolean or null",
  "is_rural": "boolean or null",
  "has_lpg_connection": "boolean or null",
  "special_conditions": ["list of strings"],
  "query_intent": "string - what the user is looking for"
}"""
    
    result = llm_call(system, user_input)
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {"query_intent": user_input, "error": "Could not parse profile"}


# ═══════════════════════════════════════════════════
# AGENT 2: SCHEME RETRIEVAL (RAG)
# ═══════════════════════════════════════════════════
def scheme_retrieval_agent(profile: dict, retriever: SchemeRetriever) -> list[dict]:
    """Retrieve relevant scheme clauses using RAG."""
    # Build search queries from profile
    queries = []
    
    intent = profile.get("query_intent", "")
    if intent:
        queries.append(intent)
    
    # Add profile-specific queries
    if profile.get("is_farmer"):
        queries.append("farmer agriculture land subsidy income support eligibility")
    if profile.get("income_annual") and profile["income_annual"] < 300000:
        queries.append("BPL below poverty line low income eligibility criteria")
    if profile.get("housing_status") in ("kutcha", "homeless"):
        queries.append("housing pucca house construction eligibility rural")
    if profile.get("is_rural"):
        queries.append("rural employment wage guarantee eligibility")
    
    queries.append("eligibility criteria documents required application process")
    queries.append("exclusion criteria conflict convergence with other schemes")
    
    # Retrieve chunks for all queries
    all_chunks = []
    seen_texts = set()
    
    for query in queries:
        chunks = retriever.search(query, top_k=10)
        for chunk in chunks:
            text_key = chunk["text"][:100]
            if text_key not in seen_texts:
                seen_texts.add(text_key)
                all_chunks.append(chunk)
    
    # Sort by relevance
    all_chunks.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    return all_chunks[:30]  # Top 30 most relevant chunks


# ═══════════════════════════════════════════════════
# AGENT 3: ELIGIBILITY REASONING + "WHY NOT" ENGINE
# Uses RULE-BASED eligibility as backbone + LLM for
# reasoning enhancement. Guarantees results always.
# ═══════════════════════════════════════════════════

# ─── Hardcoded scheme eligibility rules (from actual PDFs) ───
SCHEME_RULES = {
    "PM-KISAN": {
        "full_name": "Pradhan Mantri Kisan Samman Nidhi",
        "benefit": "₹6,000/year (₹2,000 every 4 months)",
        "criteria": {
            "is_farmer": True,
            "max_land_acres": 5.0,
        },
        "exclusion": ["institutional_land_holder", "income_tax_payer", "government_employee"],
        "required_documents": ["Aadhaar Card", "Land Records / Khasra-Khatauni", "Bank Account with IFSC"],
        "application_steps": [
            "Visit pmkisan.gov.in or nearest CSC center",
            "Register with Aadhaar, land records, and bank details",
            "Get verification from local Patwari/Revenue officer",
            "Approval by State Nodal Officer",
            "Receive ₹2,000 directly in bank account every 4 months"
        ],
        "checklist": ["Aadhaar linked to bank account", "Land records updated", "Mobile number registered"],
        "nearest_office": "Block/Taluka Agriculture Office or Common Service Centre (CSC)",
        "source": "pm_kisan.pdf",
    },
    "PMAY-G (Housing)": {
        "full_name": "Pradhan Mantri Awas Yojana – Gramin",
        "benefit": "₹1,20,000 (plains) / ₹1,30,000 (hilly areas) for house construction",
        "criteria": {
            "housing_status_in": ["kutcha", "homeless"],
            "is_bpl_or_low_income": True,
            "max_income": 300000,
        },
        "exclusion": ["owns_pucca_house", "income_tax_payer", "government_employee"],
        "required_documents": ["Aadhaar Card", "BPL Certificate / Income Certificate", "SECC-2011 data verification", "Bank Account", "Photograph"],
        "application_steps": [
            "Ensure name is in SECC-2011 / Awas+ list",
            "Apply online at pmayg.nic.in or through Gram Panchayat",
            "Gram Sabha verification of eligibility",
            "Geo-tagging of house construction site",
            "Receive funds in 3 installments via DBT"
        ],
        "checklist": ["Name in SECC/BPL list", "No existing pucca house", "Aadhaar linked to bank"],
        "nearest_office": "Gram Panchayat / Block Development Office (BDO)",
        "source": "pmay_gramin.pdf",
    },
    "Ayushman Bharat PM-JAY (Health)": {
        "full_name": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana",
        "benefit": "₹5,00,000/year health insurance per family",
        "criteria": {
            "is_bpl_or_low_income": True,
            "max_income": 500000,
        },
        "exclusion": ["income_tax_payer", "government_employee"],
        "required_documents": ["Aadhaar Card", "Ration Card / BPL Certificate", "SECC-2011 verification", "Family photo"],
        "application_steps": [
            "Check eligibility at mera.pmjay.gov.in using Aadhaar/ration card",
            "Visit nearest Ayushman Bharat Arogya Mitra at empaneled hospital",
            "Get e-card generated (free of cost)",
            "Use e-card for cashless treatment at any empaneled hospital"
        ],
        "checklist": ["Name in SECC-2011 list", "Aadhaar number", "Family details"],
        "nearest_office": "Nearest empaneled hospital / Ayushman Bharat Kendra / CSC",
        "source": "ayushman_bharat.pdf",
    },
    "PM Ujjwala Yojana (LPG)": {
        "full_name": "Pradhan Mantri Ujjwala Yojana",
        "benefit": "Free LPG connection + first refill + stove (₹1,600 subsidy)",
        "criteria": {
            "is_bpl_or_low_income": True,
            "has_no_lpg": True,
            "gender": "female",
            "min_age": 18,
        },
        "exclusion": ["already_has_lpg", "income_tax_payer"],
        "required_documents": ["Aadhaar Card", "BPL Certificate / Ration Card", "Bank Account", "Passport-size photo", "Address proof"],
        "application_steps": [
            "Visit nearest LPG distributor (HP/Bharat/Indane)",
            "Submit KYC form with BPL certificate and Aadhaar",
            "Get free LPG connection in the name of adult woman of household",
            "Receive first refill cylinder and stove free"
        ],
        "checklist": ["No existing LPG in family", "BPL/low income proof", "Woman applicant only"],
        "nearest_office": "Nearest HP/Bharat/Indane LPG Distributor",
        "source": "pm_ujjwala.pdf",
    },
    "MGNREGA (Employment)": {
        "full_name": "Mahatma Gandhi National Rural Employment Guarantee Act",
        "benefit": "100 days guaranteed employment at ₹250-350/day (state-wise)",
        "criteria": {
            "is_rural": True,
            "min_age": 18,
            "willing_to_do_manual_work": True,
        },
        "exclusion": [],
        "required_documents": ["Aadhaar Card", "Photograph", "Bank Account / Post Office Account"],
        "application_steps": [
            "Apply at Gram Panchayat for Job Card",
            "Receive Job Card within 15 days (free of cost)",
            "Apply for work in writing or orally to Gram Panchayat",
            "Work must be provided within 15 days of application",
            "Wages paid within 15 days directly to bank account"
        ],
        "checklist": ["Rural resident", "Adult household member", "Willing for manual/unskilled work"],
        "nearest_office": "Gram Panchayat Office",
        "source": "mgnrega.pdf",
    },
    "NFSA (Food Security)": {
        "full_name": "National Food Security Act",
        "benefit": "Rice at ₹3/kg, Wheat at ₹2/kg, Coarse grains at ₹1/kg (5kg per person/month)",
        "criteria": {
            "is_bpl_or_low_income": True,
            "max_income": 300000,
        },
        "exclusion": ["income_tax_payer"],
        "required_documents": ["Ration Card (AAY/PHH)", "Aadhaar Card", "Family details"],
        "application_steps": [
            "Apply for Ration Card at Taluka Supply Office / Block office",
            "Submit income certificate, family details, Aadhaar",
            "Field verification by supply inspector",
            "Receive Priority Household (PHH) or AAY ration card",
            "Collect monthly grain from nearest Fair Price Shop (FPS)"
        ],
        "checklist": ["Income certificate", "Aadhaar for all family members", "No existing ration card"],
        "nearest_office": "Taluka Supply Office / Fair Price Shop (FPS)",
        "source": "nfsa.pdf",
    },
}


def _check_rule_eligibility(profile: dict, scheme_key: str, rules: dict) -> dict:
    """Check eligibility using hardcoded rules. Returns structured result."""
    criteria = rules.get("criteria", {})
    exclusion = rules.get("exclusion", [])
    
    eligible = True
    missing = []
    reasons_yes = []
    reasons_no = []
    
    income = profile.get("income_annual") or 0
    age = profile.get("age") or 25
    
    # ── Check positive criteria ──
    if "is_farmer" in criteria and criteria["is_farmer"]:
        is_farmer = profile.get("is_farmer") or (profile.get("occupation", "").lower() in ["farmer", "agriculture", "farming", "kisan"])
        if is_farmer:
            reasons_yes.append("Citizen is a farmer")
        else:
            eligible = False
            missing.append("Must be a farmer / agriculture worker")
            reasons_no.append("Citizen is not a farmer")
    
    if "max_land_acres" in criteria:
        land = profile.get("land_ownership_acres")
        if land is not None and land > criteria["max_land_acres"]:
            eligible = False
            missing.append(f"Land must be ≤ {criteria['max_land_acres']} acres")
            reasons_no.append(f"Land ({land} acres) exceeds limit of {criteria['max_land_acres']} acres")
        elif land is not None:
            reasons_yes.append(f"Land ({land} acres) within limit")
    
    if "max_income" in criteria:
        max_inc = criteria["max_income"]
        if income and income > max_inc:
            eligible = False
            missing.append(f"Annual income must be ≤ ₹{max_inc:,}")
            reasons_no.append(f"Income ₹{income:,} exceeds limit of ₹{max_inc:,}")
        else:
            reasons_yes.append(f"Income ₹{income:,} is within the limit of ₹{max_inc:,}")
    
    if "is_bpl_or_low_income" in criteria:
        is_bpl = profile.get("is_bpl", False)
        low_income = income <= 300000 if income else True
        if is_bpl or low_income:
            reasons_yes.append("BPL / low-income household")
        else:
            eligible = False
            missing.append("Must be BPL or low-income household")
    
    if "housing_status_in" in criteria:
        housing = (profile.get("housing_status") or "").lower()
        allowed = criteria["housing_status_in"]
        if housing in allowed or housing == "":
            reasons_yes.append(f"Housing status ({housing or 'not specified'}) qualifies")
        else:
            eligible = False
            missing.append(f"Housing must be: {', '.join(allowed)} (current: {housing})")
            reasons_no.append(f"Has {housing} house — scheme requires {' or '.join(allowed)}")
    
    if "has_no_lpg" in criteria:
        has_lpg = profile.get("has_lpg_connection", False)
        if has_lpg:
            eligible = False
            missing.append("Must not have existing LPG connection")
            reasons_no.append("Already has LPG connection")
        else:
            reasons_yes.append("Does not have LPG connection")
    
    if "gender" in criteria:
        gender = (profile.get("gender") or "").lower()
        if gender and gender != criteria["gender"]:
            # Ujjwala: female applicant preferred but male households can apply through female member
            if criteria["gender"] == "female" and gender == "male":
                reasons_yes.append("Male HH — can apply through adult female family member")
            else:
                eligible = False
                missing.append(f"Applicant should be {criteria['gender']}")
    
    if "min_age" in criteria:
        if age < criteria["min_age"]:
            eligible = False
            missing.append(f"Must be at least {criteria['min_age']} years old")
        else:
            reasons_yes.append(f"Age {age} meets minimum requirement of {criteria['min_age']}")
    
    if "is_rural" in criteria and criteria.get("is_rural"):
        is_rural = profile.get("is_rural")
        if is_rural is False:
            eligible = False
            missing.append("Must be a rural resident")
            reasons_no.append("Citizen is urban — MGNREGA is for rural areas")
        else:
            reasons_yes.append("Rural resident (or not specified — assumed rural)")
    
    # ── Check exclusion criteria ──
    for excl in exclusion:
        if excl == "income_tax_payer" and income and income > 500000:
            eligible = False
            missing.append("Income tax payers are excluded")
            reasons_no.append("Likely income tax payer (income > ₹5L)")
        if excl == "government_employee":
            occ = (profile.get("occupation") or "").lower()
            if "government" in occ or "govt" in occ:
                eligible = False
                missing.append("Government employees are excluded")
        if excl == "owns_pucca_house":
            if (profile.get("housing_status") or "").lower() == "pucca":
                eligible = False
                missing.append("Already owns a pucca house")
                reasons_no.append("Already has pucca house — cannot get housing scheme")
    
    # ── Check basic universal criteria ──
    has_aadhaar = profile.get("has_aadhaar", True)
    has_bank = profile.get("has_bank_account", True)
    if has_aadhaar:
        reasons_yes.append("Has Aadhaar card")
    if has_bank:
        reasons_yes.append("Has bank account")
    
    # ── Build result ──
    reasoning = "ELIGIBLE: " if eligible else "NOT ELIGIBLE: "
    if eligible:
        reasoning += "Citizen meets all eligibility criteria. " + "; ".join(reasons_yes) + "."
    else:
        reasoning += "; ".join(reasons_no) + ". Missing: " + "; ".join(missing) + "."
    
    confidence = 0.9 if eligible else 0.85
    
    return {
        "name": scheme_key,
        "eligible": eligible,
        "confidence": confidence,
        "reasoning": reasoning,
        "citations": [f"Source: {rules['source']}, Eligibility Criteria section"],
        "benefit_amount": rules["benefit"],
        "why_not_eligible": "; ".join(reasons_no + missing) if not eligible else None,
        "missing_criteria": missing if not eligible else [],
        "how_to_become_eligible": "Address the missing criteria: " + "; ".join(missing) if not eligible and missing else None,
        "required_documents": rules["required_documents"],
        "application_steps": rules["application_steps"],
        "checklist": rules["checklist"],
        "nearest_office": rules["nearest_office"],
    }


def eligibility_agent(profile: dict, chunks: list[dict]) -> dict:
    """
    HYBRID eligibility engine:
    1. Rule-based checking (ALWAYS works)
    2. LLM enhancement per scheme (best-effort)
    """
    
    # Group chunks by scheme for potential LLM enhancement
    chunks_by_scheme = {}
    for chunk in chunks:
        scheme = chunk.get("scheme", "Unknown")
        if scheme not in chunks_by_scheme:
            chunks_by_scheme[scheme] = []
        chunks_by_scheme[scheme].append(chunk)
    
    # Step 1: Rule-based eligibility for all schemes
    results = []
    for scheme_key, rules in SCHEME_RULES.items():
        result = _check_rule_eligibility(profile, scheme_key, rules)
        
        # Step 2: Try LLM enhancement with focused context (best-effort, non-blocking)
        if scheme_key in chunks_by_scheme:
            try:
                scheme_chunks = chunks_by_scheme[scheme_key][:3]  # Only top 3 chunks
                context = "\n".join([f"[{c['source']}, {c['section']}]: {c['text'][:300]}" for c in scheme_chunks])
                
                enhance_prompt = f"""For scheme "{scheme_key}", citizen profile: age={profile.get('age')}, income=₹{profile.get('income_annual', 'unknown')}, occupation={profile.get('occupation', 'unknown')}, category={profile.get('category', 'unknown')}, state={profile.get('state', 'unknown')}.

Relevant document excerpts:
{context}

The rule-based check says: {"ELIGIBLE" if result['eligible'] else "NOT ELIGIBLE"}.

Provide a 2-sentence reasoning citing the source document clause. Return JSON:
{{"reasoning": "...", "citations": ["Clause X of {rules['source']}: ..."]}}"""
                
                enhanced = llm_call(
                    "You return brief JSON with reasoning and citations for a scheme eligibility check. Be concise.",
                    enhance_prompt
                )
                enhanced_data = json.loads(enhanced)
                if enhanced_data.get("reasoning"):
                    result["reasoning"] = enhanced_data["reasoning"]
                if enhanced_data.get("citations"):
                    result["citations"] = enhanced_data["citations"]
            except Exception:
                pass  # Keep rule-based result if LLM fails
        
        results.append(result)
    
    return {"schemes": results}


# ═══════════════════════════════════════════════════
# AGENT 4: CONFLICT DETECTION
# ═══════════════════════════════════════════════════
def conflict_detection_agent(eligibility_result: dict, chunks: list[dict]) -> list[dict]:
    """Detect conflicts between schemes using document clauses."""
    
    # Get conflict-related chunks
    conflict_chunks = [c for c in chunks if any(kw in c.get("section", "").upper() 
                       for kw in ["CONFLICT", "CONVERGENCE", "EXCLUSION"])]
    
    if not conflict_chunks:
        conflict_chunks = [c for c in chunks if "conflict" in c["text"].lower() 
                          or "cannot simultaneously" in c["text"].lower()
                          or "convergence" in c["text"].lower()]
    
    context = "\n\n".join([
        f"[{c['scheme']} — {c['source']}, {c['section']}]\n{c['text']}" 
        for c in conflict_chunks
    ])
    
    schemes_list = [s["name"] for s in eligibility_result.get("schemes", []) if s.get("eligible")]
    
    system = """You are a Conflict Detection Agent. Analyze scheme documents to find conflicts between schemes.

CRITICAL: Every conflict MUST be supported by exact clause citations from source documents.

Return ONLY valid JSON:
{
  "conflicts": [
    {
      "schemes": ["Scheme A", "Scheme B"],
      "type": "full_conflict/partial_conflict/convergence_possible",
      "issue": "detailed description of the conflict",
      "citations": ["Clause X.Y of source.pdf: exact text"],
      "resolution": "how to resolve or work around the conflict",
      "impact": "what the citizen loses if they ignore this"
    }
  ]
}"""
    
    user_prompt = f"""Eligible schemes: {json.dumps(schemes_list)}

Conflict-related clauses from scheme documents:
{context}

Detect ALL conflicts, contradictions, or incompatibilities between the eligible schemes. Only report conflicts that are explicitly stated in the source documents."""
    
    result = llm_call(system, user_prompt)
    try:
        return json.loads(result).get("conflicts", [])
    except json.JSONDecodeError:
        return []


# ═══════════════════════════════════════════════════
# AGENT 5: NEAREST ACTION PATH (REAL-WORLD BRIDGE)
# ═══════════════════════════════════════════════════
def nearest_action_path_agent(profile: dict, eligibility_result: dict) -> dict:
    """Generate real-world action paths: nearest offices, directions, hours, officers."""

    eligible = [s for s in eligibility_result.get("schemes", []) if s.get("eligible")]
    state = profile.get("state", "Unknown")
    district = profile.get("district", "Unknown")
    is_rural = profile.get("is_rural", True)

    system = """You are a Nearest Action Path Agent for Indian government welfare schemes.
Your job is to bridge the DIGITAL to PHYSICAL world — tell the citizen EXACTLY where to go,
who to meet, and what to carry.

For each eligible scheme, generate a detailed real-world action path based on the citizen's
state, district, and rural/urban status.

CRITICAL: Be specific and realistic for Indian government office structures.

Return ONLY valid JSON:
{
  "action_paths": [
    {
      "scheme": "scheme name",
      "primary_office": {
        "name": "e.g., Taluka Development Office / Block Development Office",
        "department": "e.g., Revenue Department, Agriculture Department",
        "address_hint": "e.g., Taluka headquarters, near collectorate",
        "estimated_distance": "e.g., 2-5 km from village center",
        "working_hours": "e.g., Monday–Friday, 10:00 AM – 5:00 PM",
        "contact": "toll-free helpline or office type",
        "required_desk_or_officer": "e.g., Talathi / Gram Sevak / BDO"
      },
      "alternative_channels": [
        {
          "type": "online/CSC/mobile",
          "name": "e.g., Common Service Centre (CSC) / pmkisan.gov.in",
          "details": "how to access"
        }
      ],
      "physical_journey_steps": [
        "Step 1: Collect required documents (Aadhaar, land records, income cert)",
        "Step 2: Visit Gram Panchayat office for verification letter",
        "Step 3: Go to Taluka/Block office with documents",
        "Step 4: Submit application at the designated counter",
        "Step 5: Collect acknowledgment receipt"
      ],
      "estimated_processing_time": "e.g., 15-30 working days",
      "tips": ["Carry original + 2 photocopies of all documents", "Visit early morning to avoid queues"]
    }
  ],
  "general_tips": ["tips applicable to all schemes"]
}"""

    user_prompt = f"""Citizen Location:
- State: {state}
- District: {district}
- Rural/Urban: {'Rural' if is_rural else 'Urban'}

Eligible Schemes:
{json.dumps([{'name': s['name'], 'nearest_office': s.get('nearest_office', '')} for s in eligible], indent=2)}

Generate detailed, realistic action paths for the citizen's state/district."""

    result = llm_call(system, user_prompt)
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {"action_paths": [], "general_tips": []}


# ═══════════════════════════════════════════════════
# AGENT 6: SCHEME OPTIMIZER
# ═══════════════════════════════════════════════════
def scheme_optimizer_agent(eligibility_result: dict, conflicts: list[dict]) -> dict:
    """Find optimal combination of schemes for maximum benefit."""
    
    eligible = [s for s in eligibility_result.get("schemes", []) if s.get("eligible")]
    
    system = """You are a Scheme Optimization Agent. Your job is to find the BEST combination of government schemes for maximum benefit.

Consider:
1. Total monetary benefit
2. Conflicts between schemes (avoid conflicting ones)
3. Ease of application
4. Complementary benefits

Return ONLY valid JSON:
{
  "best_combination": ["scheme names"],
  "total_estimated_benefit": "amount in rupees per year",
  "reasoning": "why this combination is optimal",
  "excluded_schemes": [{"name": "", "reason": "why excluded from optimal set"}],
  "benefit_breakdown": [{"scheme": "", "benefit": "", "type": "monetary/service/in-kind"}]
}"""
    
    user_prompt = f"""Eligible schemes:
{json.dumps(eligible, indent=2, default=str)}

Known conflicts:
{json.dumps(conflicts, indent=2, default=str)}

Find the optimal combination maximizing total benefit while avoiding conflicts."""
    
    result = llm_call(system, user_prompt)
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {"best_combination": [s["name"] for s in eligible]}


# ═══════════════════════════════════════════════════
# AGENT 6: FORM FILLING
# ═══════════════════════════════════════════════════
def form_filling_agent(profile: dict, scheme_name: str) -> dict:
    """Generate pre-filled application form for a scheme."""
    
    system = """You are a Form Filling Agent. Based on the citizen profile, generate a pre-filled application form for the specified government scheme.

Return ONLY valid JSON:
{
  "scheme_name": "",
  "form_title": "Official form title",
  "fields": [
    {
      "field_name": "",
      "label": "Display label",
      "value": "pre-filled value or empty string",
      "type": "text/number/date/select/checkbox",
      "required": true/false,
      "filled": true/false,
      "confidence": 0.0-1.0,
      "options": ["for select type only"]
    }
  ],
  "missing_fields": ["fields that couldn't be filled"],
  "completion_percentage": 0-100,
  "declaration_text": "standard declaration text"
}"""
    
    user_prompt = f"""Citizen Profile:
{json.dumps(profile, indent=2, default=str)}

Generate a pre-filled application form for: {scheme_name}"""
    
    result = llm_call(system, user_prompt)
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {"scheme_name": scheme_name, "fields": [], "error": "Form generation failed"}


# ═══════════════════════════════════════════════════
# AGENT 7: LIFE JOURNEY PLANNER
# ═══════════════════════════════════════════════════
def life_journey_agent(profile: dict, eligibility_result: dict) -> dict:
    """Generate a multi-year scheme timeline based on life events."""
    
    system = """You are a Life Journey Planning Agent. Based on the citizen's current profile, predict future government scheme eligibility over the next 5-10 years.

Consider life events: aging, children's education, retirement, land changes, income changes, etc.

Return ONLY valid JSON:
{
  "timeline": [
    {
      "year": "2025",
      "age": 35,
      "life_event": "Current situation",
      "eligible_schemes": ["scheme names"],
      "action_required": "what to do now",
      "estimated_benefit": "amount"
    }
  ],
  "total_lifetime_benefit": "estimated total",
  "key_milestones": ["important dates/ages to watch for"]
}"""
    
    user_prompt = f"""Citizen Profile:
{json.dumps(profile, indent=2, default=str)}

Current Eligibility:
{json.dumps(eligibility_result, indent=2, default=str)}

Generate a 5-year life journey plan with scheme recommendations."""
    
    result = llm_call(system, user_prompt)
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {"timeline": [], "error": "Journey planning failed"}


# ═══════════════════════════════════════════════════
# AGENT 8: MULTILINGUAL OUTPUT
# ═══════════════════════════════════════════════════
def multilingual_agent(text: str, target_language: str = "hi") -> str:
    """Translate output to Hindi or regional language."""
    lang_map = {
        "hi": "Hindi (हिंदी)",
        "ta": "Tamil (தமிழ்)",
        "te": "Telugu (తెలుగు)",
        "bn": "Bengali (বাংলা)",
        "mr": "Marathi (मराठी)",
        "gu": "Gujarati (ગુજરાતી)",
        "kn": "Kannada (ಕನ್ನಡ)",
        "ml": "Malayalam (മലയാളം)",
        "pa": "Punjabi (ਪੰਜਾਬੀ)",
        "or": "Odia (ଓଡ଼ିଆ)",
    }
    
    lang_name = lang_map.get(target_language, "Hindi (हिंदी)")
    
    system = f"""You are a translation agent. Translate the following text into {lang_name}.
Maintain the structure, formatting, and technical terms. Government scheme names should remain in English.
Return ONLY the translated text, nothing else."""
    
    result = llm_call(system, text, json_mode=False)
    return result


# ═══════════════════════════════════════════════════
# DOCUMENT PARSING AGENT
# ═══════════════════════════════════════════════════
def document_parsing_agent(text: str, doc_type: str = "aadhaar") -> dict:
    """Extract structured data from document text."""
    
    system = f"""You are a Document Parsing Agent. Extract structured information from the provided {doc_type} document text.

Return ONLY valid JSON:
{{
  "document_type": "{doc_type}",
  "extracted_fields": {{
    "name": "",
    "date_of_birth": "",
    "age": null,
    "gender": "",
    "address": "",
    "aadhaar_number": "",
    "income": null,
    "category": "",
    "state": "",
    "district": ""
  }},
  "confidence": 0.0-1.0,
  "warnings": ["any issues with the document"]
}}"""
    
    result = llm_call(system, f"Document text:\n{text}")
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {"document_type": doc_type, "extracted_fields": {}}


# ═══════════════════════════════════════════════════
# SCHEME PORTALS (official application URLs)
# ═══════════════════════════════════════════════════
SCHEME_PORTALS = {
    "PM-KISAN": {
        "portal_name": "PM-KISAN Portal",
        "url": "https://pmkisan.gov.in/RegistrationForm.aspx",
        "department": "Ministry of Agriculture & Farmers Welfare",
    },
    "PMAY-G (Housing)": {
        "portal_name": "PMAY-G Awaas+",
        "url": "https://pmayg.nic.in/netiayHome/home.aspx",
        "department": "Ministry of Rural Development",
    },
    "Ayushman Bharat PM-JAY (Health)": {
        "portal_name": "Ayushman Bharat PM-JAY",
        "url": "https://beneficiary.nha.gov.in/",
        "department": "National Health Authority",
    },
    "PM Ujjwala Yojana (LPG)": {
        "portal_name": "PM Ujjwala Yojana",
        "url": "https://www.pmuy.gov.in/index.aspx",
        "department": "Ministry of Petroleum & Natural Gas",
    },
    "MGNREGA (Employment)": {
        "portal_name": "NREGA Job Card Portal",
        "url": "https://nrega.nic.in/Netnrega/stHome.aspx",
        "department": "Ministry of Rural Development",
    },
    "NFSA (Food Security)": {
        "portal_name": "National Food Security Portal",
        "url": "https://nfsa.gov.in/",
        "department": "Department of Food & Public Distribution",
    },
}


# ═══════════════════════════════════════════════════
# REQUIRED DOCUMENTS AGENT
# Given a form's current state, determine which
# documents the user still needs to upload.
# ═══════════════════════════════════════════════════
def required_documents_for_form(scheme_name: str, form_fields: list[dict]) -> dict:
    """Determine which documents are still needed based on unfilled form fields."""
    
    # Map document types to the fields they can fill
    DOCUMENT_FIELD_MAP = {
        "Aadhaar Card": ["name", "age", "date_of_birth", "gender", "address", "aadhaar_number", "aadhaar"],
        "Income Certificate": ["income", "income_annual", "annual_income", "is_bpl", "category"],
        "Land Records / Khasra-Khatauni": ["land_ownership_acres", "land_area", "land_details", "survey_number"],
        "Bank Passbook / Cancelled Cheque": ["bank_account", "bank_name", "ifsc_code", "account_number"],
        "Ration Card": ["ration_card_number", "family_size", "family_members", "is_bpl"],
        "BPL Certificate": ["is_bpl", "category", "income", "income_annual"],
        "Caste Certificate": ["category", "caste", "sub_caste"],
        "Photograph": ["photograph", "photo"],
        "Address Proof": ["address", "state", "district", "village", "pin_code"],
        "Voter ID": ["name", "age", "address", "voter_id"],
    }
    
    # Get scheme-specific required documents
    scheme_rules = SCHEME_RULES.get(scheme_name, {})
    scheme_required_docs = scheme_rules.get("required_documents", [])
    
    # Find unfilled/missing fields
    missing_fields = []
    filled_fields = []
    for field in form_fields:
        field_name = field.get("field_name", "").lower()
        if not field.get("filled") or not field.get("value"):
            missing_fields.append(field_name)
        else:
            filled_fields.append(field_name)
    
    # Determine which documents can fill the missing fields
    needed_docs = []
    helpful_docs = []
    
    for doc_name in scheme_required_docs:
        # Check if this document can fill any missing fields
        fillable_fields = DOCUMENT_FIELD_MAP.get(doc_name, [])
        can_fill = [f for f in fillable_fields if f in missing_fields]
        
        if can_fill:
            needed_docs.append({
                "document_name": doc_name,
                "status": "required",
                "fills_fields": can_fill,
                "reason": f"Required to fill: {', '.join(can_fill)}",
            })
        else:
            helpful_docs.append({
                "document_name": doc_name,
                "status": "already_covered",
                "fills_fields": [],
                "reason": "Fields already filled from previous uploads",
            })
    
    all_filled = len(missing_fields) == 0
    
    return {
        "scheme_name": scheme_name,
        "total_fields": len(form_fields),
        "filled_fields": len(filled_fields),
        "missing_fields_count": len(missing_fields),
        "missing_field_names": missing_fields,
        "needed_documents": needed_docs,
        "already_covered_documents": helpful_docs,
        "all_documents_submitted": len(needed_docs) == 0,
        "ready_to_submit": all_filled,
        "message": "All fields are filled! You can submit the form now." if all_filled
                   else f"Please upload {len(needed_docs)} more document(s) to complete the form.",
    }


# ═══════════════════════════════════════════════════
# FORM SUBMISSION AGENT
# Validates a completed form and generates a
# simulated submission receipt.
# ═══════════════════════════════════════════════════
def form_submission_agent(scheme_name: str, form_fields: list[dict], uploaded_documents: list[str]) -> dict:
    """Validate and submit a completed form to the scheme portal."""
    import uuid
    from datetime import datetime
    
    # Check for missing required fields
    missing_required = []
    for field in form_fields:
        if field.get("required") and (not field.get("value") or str(field.get("value", "")).strip() == ""):
            missing_required.append(field.get("label", field.get("field_name", "Unknown")))
    
    if missing_required:
        return {
            "success": False,
            "error": "incomplete_form",
            "message": f"Cannot submit: {len(missing_required)} required field(s) are still empty.",
            "missing_fields": missing_required,
        }
    
    # Check if required documents are uploaded
    scheme_rules = SCHEME_RULES.get(scheme_name, {})
    required_docs = scheme_rules.get("required_documents", [])
    missing_docs = [doc for doc in required_docs if doc not in uploaded_documents]
    
    if missing_docs:
        return {
            "success": False,
            "error": "missing_documents",
            "message": f"Cannot submit: {len(missing_docs)} required document(s) not uploaded.",
            "missing_documents": missing_docs,
        }
    
    # Get portal info
    portal_info = SCHEME_PORTALS.get(scheme_name, {
        "portal_name": f"{scheme_name} Portal",
        "url": "#",
        "department": "Government of India",
    })
    
    # Generate submission receipt
    receipt_id = f"PP-{scheme_name.replace(' ', '').replace('(', '').replace(')', '')[:8].upper()}-{uuid.uuid4().hex[:8].upper()}"
    submission_time = datetime.now().strftime("%d %B %Y, %I:%M %p IST")
    
    # Build submitted data summary
    submitted_data = {}
    for field in form_fields:
        if field.get("value"):
            submitted_data[field.get("label", field.get("field_name", ""))] = field["value"]
    
    return {
        "success": True,
        "message": "Application submitted successfully!",
        "receipt": {
            "receipt_id": receipt_id,
            "scheme_name": scheme_name,
            "submission_time": submission_time,
            "portal": portal_info,
            "status": "Submitted — Pending Verification",
            "estimated_processing": "15-30 working days",
            "documents_attached": uploaded_documents,
            "fields_submitted": len(submitted_data),
            "submitted_data_summary": submitted_data,
        },
        "next_steps": [
            f"Your application has been submitted to {portal_info['portal_name']}",
            f"Receipt ID: {receipt_id} — Save this for tracking",
            f"Visit {portal_info['url']} to track your application status",
            "You will receive SMS/email updates on your registered contact",
            "If required, visit your nearest office for physical verification",
        ],
    }


# ═══════════════════════════════════════════════════
# MASTER ORCHESTRATOR
# ═══════════════════════════════════════════════════
def run_full_pipeline(user_input: str, retriever: SchemeRetriever, language: str = "en") -> dict:
    """
    Run the complete PolicyPilot pipeline:
    1. Parse input → profile
    2. RAG retrieval
    3. Eligibility analysis
    4. Conflict detection
    5. Nearest action paths
    6. Scheme optimization
    7. Life journey planning
    """
    
    # Step 1: Query Understanding
    profile = query_understanding_agent(user_input)
    
    # Step 2: RAG Retrieval
    chunks = scheme_retrieval_agent(profile, retriever)
    
    # Step 3: Eligibility Analysis (includes Why NOT)
    eligibility = eligibility_agent(profile, chunks)
    
    # Step 4: Conflict Detection
    conflicts = conflict_detection_agent(eligibility, chunks)
    
    # Step 5: Nearest Action Paths
    action_paths = nearest_action_path_agent(profile, eligibility)
    
    # Step 6: Scheme Optimization
    optimization = scheme_optimizer_agent(eligibility, conflicts)
    
    # Step 7: Life Journey
    life_journey = life_journey_agent(profile, eligibility)
    
    # Build summary
    eligible_schemes = [s for s in eligibility.get("schemes", []) if s.get("eligible")]
    not_eligible = [s for s in eligibility.get("schemes", []) if not s.get("eligible")]
    
    summary = f"Found {len(eligible_schemes)} eligible scheme(s) and {len(not_eligible)} ineligible scheme(s)."
    if eligible_schemes:
        summary += f" Best combination: {', '.join(optimization.get('best_combination', []))}"
        summary += f" with estimated annual benefit of {optimization.get('total_estimated_benefit', 'N/A')}."
    if conflicts:
        summary += f" ⚠️ {len(conflicts)} conflict(s) detected between schemes."
    
    result = {
        "profile": profile,
        "schemes": eligibility.get("schemes", []),
        "conflicts": conflicts,
        "action_paths": action_paths,
        "optimization": optimization,
        "life_journey": life_journey,
        "summary": summary,
        "sources_used": list(set(c["source"] for c in chunks)),
        "total_chunks_retrieved": len(chunks),
    }
    
    # Translate if needed
    if language != "en":
        result["translated_summary"] = multilingual_agent(summary, language)
    
    return result

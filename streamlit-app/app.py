"""
PolicyPilot — Streamlit App (v3 — Direct Pipeline, No Agent)
Calls orchestrator.run_full_pipeline() directly for reliable output.
Voice → text via speech_recognition. Explore Schemes flow. PDF download.
"""
import streamlit as st
import streamlit.components.v1 as components
import sys, os, json, io, time, traceback
from pathlib import Path
from datetime import datetime

# ── Path setup ──
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent / "backend"
sys.path.insert(0, str(APP_DIR))
sys.path.insert(0, str(BACKEND_DIR))

# ── Page config ──
st.set_page_config(
    page_title="PolicyPilot — AI Scheme Navigator",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ═══════════════════════════════════════════════════════
# MULTILINGUAL UI STRINGS
# ═══════════════════════════════════════════════════════
UI = {
    "en": {
        "title": "🛡️ PolicyPilot", "subtitle": "Your AI Guide to Government Schemes",
        "welcome": "Tell us about yourself — we'll find every scheme you qualify for",
        "placeholder": "Example: I am a 35-year-old farmer in Gujarat. My income is ₹1.2 lakh per year. I have 2 children and a kutcha house. I belong to SC category.",
        "send": "🔍 Find My Schemes", "voice_btn": "🎤 Speak",
        "explore": "🔍 Explore Schemes", "language": "🌐 Language",
        "upload_docs": "📄 Upload Documents", "clear": "🗑️ Clear",
        "download": "📥 Download PDF", "settings": "⚙️ Settings",
        "processing": "Finding your schemes...",
        "sec_profile": "👤 Your Profile", "sec_eligible": "✅ Eligible Schemes",
        "sec_not_eligible": "❌ Not Eligible", "sec_conflicts": "⚠️ Conflicts Detected",
        "sec_action": "📍 Action Path — How to Apply",
        "sec_optimizer": "💎 Best Scheme Combination",
        "sec_journey": "🗓️ Life Journey — 5-Year Roadmap",
        "sec_sources": "📚 Sources (from PDFs)",
        "select_scheme": "Select a scheme to explore",
        "scheme_intro": "📋 About This Scheme",
        "scheme_docs": "📄 Required Documents",
        "scheme_elig": "✅ Your Eligibility",
        "scheme_form": "📝 Application Form (Auto-Filled)",
        "scheme_office": "🏛️ Office Guide — Where to Go",
    },
    "hi": {
        "title": "🛡️ PolicyPilot", "subtitle": "सरकारी योजनाओं के लिए AI गाइड",
        "welcome": "अपने बारे में बताएं — हम आपके लिए सभी योजनाएं खोजेंगे",
        "placeholder": "उदाहरण: मैं गुजरात में 35 वर्ष का किसान हूं। आय ₹1.2 लाख। 2 बच्चे। कच्चा मकान। SC वर्ग।",
        "send": "🔍 योजनाएं खोजें", "voice_btn": "🎤 बोलें",
        "explore": "🔍 योजनाएं देखें", "language": "🌐 भाषा",
        "upload_docs": "📄 दस्तावेज़ अपलोड", "clear": "🗑️ मिटाएं",
        "download": "📥 PDF डाउनलोड", "settings": "⚙️ सेटिंग्स",
        "processing": "योजनाएं खोज रहे हैं...",
        "sec_profile": "👤 आपकी प्रोफ़ाइल", "sec_eligible": "✅ पात्र योजनाएं",
        "sec_not_eligible": "❌ अपात्र", "sec_conflicts": "⚠️ विरोधाभास",
        "sec_action": "📍 कार्य मार्ग — कैसे आवेदन करें",
        "sec_optimizer": "💎 सर्वोत्तम योजना संयोजन",
        "sec_journey": "🗓️ जीवन यात्रा — 5 वर्ष का रोडमैप",
        "sec_sources": "📚 स्रोत (PDFs से)",
        "select_scheme": "योजना चुनें", "scheme_intro": "📋 योजना के बारे में",
        "scheme_docs": "📄 आवश्यक दस्तावेज़", "scheme_elig": "✅ पात्रता",
        "scheme_form": "📝 आवेदन फॉर्म", "scheme_office": "🏛️ कार्यालय मार्गदर्शन",
    },
}
for lc in ["ta", "te", "bn", "mr", "gu", "kn"]:
    UI[lc] = UI["en"].copy()

LANG_MAP = {
    "English": "en", "हिंदी (Hindi)": "hi", "தமிழ் (Tamil)": "ta",
    "తెలుగు (Telugu)": "te", "বাংলা (Bengali)": "bn",
    "मराठी (Marathi)": "mr", "ગુજરાતી (Gujarati)": "gu",
}
VOICE_LANG = {"en":"en-IN","hi":"hi-IN","ta":"ta-IN","te":"te-IN","bn":"bn-IN","mr":"mr-IN","gu":"gu-IN"}

ALL_SCHEMES = {
    "PM-KISAN": {"icon":"🌾","cat":"Agriculture","benefit":"₹6,000/year","desc":"Direct income support to farmer families"},
    "PM Fasal Bima Yojana": {"icon":"🌧️","cat":"Agriculture","benefit":"Crop insurance","desc":"Insurance for crop losses from natural calamities"},
    "Kisan Credit Card": {"icon":"💳","cat":"Agriculture","benefit":"Credit up to ₹3L","desc":"Easy credit at subsidized interest rates"},
    "Soil Health Card": {"icon":"🌱","cat":"Agriculture","benefit":"Free soil testing","desc":"Free soil health cards with nutrient recommendations"},
    "PMAY-G (Housing)": {"icon":"🏠","cat":"Housing","benefit":"₹1,20,000","desc":"Financial help to build pucca houses"},
    "PMAY-U (Urban Housing)": {"icon":"🏢","cat":"Housing","benefit":"₹2.67L subsidy","desc":"Interest subsidy for urban poor"},
    "Ayushman Bharat PM-JAY": {"icon":"🏥","cat":"Health","benefit":"₹5L cover","desc":"₹5 lakh health insurance per family per year"},
    "Jan Aushadhi Yojana": {"icon":"💊","cat":"Health","benefit":"Affordable meds","desc":"Quality generic medicines at low prices"},
    "PM Suraksha Bima": {"icon":"🛡️","cat":"Health","benefit":"₹2L accident","desc":"Accident insurance ₹2L at ₹20/year"},
    "PM Jeevan Jyoti Bima": {"icon":"❤️","cat":"Health","benefit":"₹2L life","desc":"Life insurance ₹2L at ₹436/year"},
    "PM Ujjwala Yojana (LPG)": {"icon":"🔥","cat":"Energy","benefit":"Free LPG","desc":"Free LPG connections for BPL women"},
    "PM Surya Ghar": {"icon":"☀️","cat":"Energy","benefit":"Free solar","desc":"Free rooftop solar panels"},
    "Saubhagya Yojana": {"icon":"💡","cat":"Energy","benefit":"Free electricity","desc":"Free electricity connections"},
    "MGNREGA (Employment)": {"icon":"👷","cat":"Employment","benefit":"100 days work","desc":"100 days guaranteed employment per year"},
    "PM Mudra Yojana": {"icon":"💼","cat":"Employment","benefit":"Loan ₹10L","desc":"Collateral-free loans for small business"},
    "PM SVANidhi": {"icon":"🛒","cat":"Employment","benefit":"Loan ₹50K","desc":"Micro-credit for street vendors"},
    "Startup India": {"icon":"🚀","cat":"Employment","benefit":"Tax + funding","desc":"Tax exemptions and funding for startups"},
    "PMEGP": {"icon":"🏭","cat":"Employment","benefit":"35% subsidy","desc":"Subsidy for micro enterprises"},
    "NFSA (Food Security)": {"icon":"🍚","cat":"Food","benefit":"₹1-3/kg grains","desc":"Subsidized rice ₹3/kg, wheat ₹2/kg"},
    "Mid-Day Meal": {"icon":"🍽️","cat":"Food","benefit":"Free meals","desc":"Free meals for government school children"},
    "Sukanya Samriddhi": {"icon":"👧","cat":"Financial","benefit":"8.2% interest","desc":"Savings scheme for girl child"},
    "Jan Dhan Yojana": {"icon":"🏦","cat":"Financial","benefit":"Zero-balance a/c","desc":"Free bank account + insurance"},
    "Atal Pension Yojana": {"icon":"👴","cat":"Financial","benefit":"₹1-5K/month","desc":"Pension after age 60"},
    "NSAP Old Age Pension": {"icon":"👵","cat":"Social","benefit":"₹200-500/month","desc":"Monthly pension for BPL seniors"},
    "PM Kaushal Vikas": {"icon":"📚","cat":"Education","benefit":"Free training","desc":"Free skill training with certification"},
    "Beti Bachao Beti Padhao": {"icon":"👩‍🎓","cat":"Education","benefit":"Girl education","desc":"Education support for girl child"},
    "National Scholarship": {"icon":"🎓","cat":"Education","benefit":"Up to ₹50K","desc":"Scholarships for SC/ST/OBC/minority"},
    "Samagra Shiksha": {"icon":"🏫","cat":"Education","benefit":"Free school","desc":"Free education up to Class 12"},
    "PM Matru Vandana": {"icon":"🤱","cat":"Health","benefit":"₹5,000","desc":"Cash support for pregnant mothers"},
    "Stand-Up India": {"icon":"🧑‍💼","cat":"Employment","benefit":"Loan ₹10L-1Cr","desc":"Loans for SC/ST/Women entrepreneurs"},
    "PM Awas (Rural)": {"icon":"🏡","cat":"Housing","benefit":"₹1.3L + toilet","desc":"House + toilet in hilly areas"},
    "PM Vaya Vandana": {"icon":"🧓","cat":"Financial","benefit":"7.4% return","desc":"Guaranteed return for seniors"},
}
CATEGORIES = sorted(set(s["cat"] for s in ALL_SCHEMES.values()))


# ═══════════════════════════════════════════════════════
# CSS
# ═══════════════════════════════════════════════════════
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    .stApp { font-family: 'Inter', sans-serif; background: #f8fafc; }
    section[data-testid="stSidebar"] { background: linear-gradient(180deg, #0f172a, #1e293b); color: #e2e8f0; }
    section[data-testid="stSidebar"] h1,section[data-testid="stSidebar"] h2,
    section[data-testid="stSidebar"] h3 { color: #f8fafc !important; }
    section[data-testid="stSidebar"] p, section[data-testid="stSidebar"] label { color: #cbd5e1 !important; }
    .welcome-card { background: linear-gradient(135deg,#1e1b4b,#4338ca); border-radius:20px; padding:32px;
        text-align:center; color:white; margin-bottom:20px; box-shadow:0 8px 32px rgba(99,102,241,0.2); }
    .welcome-card h1 { font-size:32px; font-weight:800; margin:0 0 6px; }
    .welcome-card p { font-size:15px; opacity:0.85; margin:0; }
    .section-card { background:white; border-radius:14px; padding:20px 24px; margin:12px 0;
        box-shadow:0 2px 8px rgba(0,0,0,0.05); }
    .section-card h3 { margin:0 0 12px; font-size:18px; }
    .scheme-pill { background:linear-gradient(135deg,#1e293b,#334155); border-radius:10px; padding:10px 14px;
        margin:4px 0; border-left:3px solid #818cf8; }
    .scheme-pill .name { font-size:13px; font-weight:600; color:#f1f5f9; }
    .scheme-pill .meta { font-size:10px; color:#94a3b8; }
    .scheme-pill .benefit { font-size:11px; color:#34d399; margin-top:2px; }
    .stat-box { background:linear-gradient(135deg,#312e81,#4338ca); border-radius:12px; padding:12px;
        text-align:center; color:white; }
    .stat-box .num { font-size:20px; font-weight:800; }
    .stat-box .lbl { font-size:10px; opacity:0.7; }
    #MainMenu, footer { visibility: hidden; }
</style>
""", unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════
# SESSION STATE
# ═══════════════════════════════════════════════════════
defaults = {"messages":[], "lang":"en", "result":None, "page":"home", "selected_scheme":None}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v

def T(key):
    return UI.get(st.session_state.lang, UI["en"]).get(key, UI["en"].get(key, key))

# ═══════════════════════════════════════════════════════
# INIT RAG
# ═══════════════════════════════════════════════════════
@st.cache_resource
def init_rag():
    from chains.rag_chain import PolicyRAG, ensure_ingested
    ensure_ingested()
    return PolicyRAG()

rag = init_rag()


# ═══════════════════════════════════════════════════════
# PDF GENERATION
# ═══════════════════════════════════════════════════════
def make_pdf(result: dict) -> io.BytesIO:
    """Generate a downloadable PDF from pipeline results."""
    buf = io.BytesIO()
    text_lines = []
    text_lines.append("=" * 60)
    text_lines.append("    PolicyPilot — Your Scheme Results")
    text_lines.append(f"    Generated: {datetime.now().strftime('%d %B %Y, %I:%M %p')}")
    text_lines.append("=" * 60)

    # Profile
    profile = result.get("profile", {})
    text_lines.append("\n👤 YOUR PROFILE")
    text_lines.append("-" * 40)
    for k, v in profile.items():
        if v:
            text_lines.append(f"  {k.replace('_',' ').title()}: {v}")

    # Eligible
    schemes = result.get("schemes", [])
    eligible = [s for s in schemes if s.get("eligible")]
    not_elig = [s for s in schemes if not s.get("eligible")]

    text_lines.append(f"\n✅ ELIGIBLE SCHEMES ({len(eligible)})")
    text_lines.append("-" * 40)
    for s in eligible:
        text_lines.append(f"  • {s.get('name', 'Unknown')}")
        text_lines.append(f"    Benefit: {s.get('benefit', 'N/A')}")
        text_lines.append(f"    Reason: {s.get('reasoning', '')}")
        if s.get("how_to_fix"):
            text_lines.append(f"    How to qualify: {s['how_to_fix']}")
        text_lines.append("")

    text_lines.append(f"\n❌ NOT ELIGIBLE ({len(not_elig)})")
    text_lines.append("-" * 40)
    for s in not_elig:
        text_lines.append(f"  • {s.get('name', 'Unknown')} — {s.get('reasoning', '')}")
        if s.get("how_to_fix"):
            text_lines.append(f"    How to qualify: {s['how_to_fix']}")

    # Conflicts
    conflicts = result.get("conflicts", [])
    if conflicts:
        text_lines.append(f"\n⚠️ CONFLICTS ({len(conflicts)})")
        text_lines.append("-" * 40)
        for c in conflicts:
            text_lines.append(f"  • {' vs '.join(c.get('schemes', []))}: {c.get('issue', '')}")
            if c.get("resolution"):
                text_lines.append(f"    Resolution: {c['resolution']}")

    # Action paths
    action = result.get("action_paths", {})
    text_lines.append("\n📍 ACTION PATH")
    text_lines.append("-" * 40)
    if isinstance(action, dict):
        for scheme, info in action.items():
            text_lines.append(f"  {scheme}:")
            if isinstance(info, dict):
                for k2, v2 in info.items():
                    if v2:
                        text_lines.append(f"    {k2.replace('_',' ').title()}: {v2}")
            elif isinstance(info, str):
                text_lines.append(f"    {info}")
            text_lines.append("")

    # Optimization
    opt = result.get("optimization", {})
    text_lines.append("\n💎 BEST COMBINATION")
    text_lines.append("-" * 40)
    text_lines.append(f"  Schemes: {', '.join(opt.get('best_combination', []))}")
    text_lines.append(f"  Total Benefit: {opt.get('total_estimated_benefit', 'N/A')}")

    # Life Journey
    journey = result.get("life_journey", {})
    timeline = journey.get("timeline", [])
    if timeline:
        text_lines.append("\n🗓️ LIFE JOURNEY — 5-YEAR ROADMAP")
        text_lines.append("-" * 40)
        for e in timeline:
            text_lines.append(f"  {e.get('year', '')}: {e.get('scheme', '')} — {e.get('life_event', '')}")

    text_lines.append("\n" + "=" * 60)
    text_lines.append("Generated by PolicyPilot — AI-Powered Scheme Navigator")

    buf.write("\n".join(text_lines).encode("utf-8"))
    buf.seek(0)
    return buf


# ═══════════════════════════════════════════════════════
# VOICE INPUT (Web Speech API — works in Chrome)
# ═══════════════════════════════════════════════════════
def render_voice_widget(lang_code):
    vl = VOICE_LANG.get(lang_code, "en-IN")
    html = f"""
    <div style="display:flex;gap:10px;align-items:center;justify-content:center;padding:8px 0;">
        <button id="vbtn" onclick="toggleVoice()" style="
            padding:14px 28px; border-radius:14px; border:2px solid #6366f1; cursor:pointer;
            background:linear-gradient(135deg,#6366f1,#4f46e5); color:white;
            font-size:17px; font-weight:700; display:flex; align-items:center; gap:10px;
            box-shadow:0 4px 16px rgba(99,102,241,0.3); transition:all 0.3s;
        ">🎤 {T('voice_btn')}</button>
        <span id="vstat" style="color:#64748b;font-size:14px;font-weight:500;"></span>
    </div>
    <div id="vtranscript" style="display:none;padding:8px 12px;background:#f1f5f9;border-radius:10px;
        margin:6px auto;max-width:600px;color:#334155;font-size:14px;text-align:center;"></div>
    <script>
    var rec=null, isRec=false;
    function toggleVoice(){{
        if(!('webkitSpeechRecognition' in window)&&!('SpeechRecognition' in window)){{
            document.getElementById('vstat').innerText='❌ Voice not supported — use Chrome';return;}}
        var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
        if(isRec){{rec.stop();return;}}
        rec=new SR();rec.lang='{vl}';rec.interimResults=true;rec.continuous=true;
        var btn=document.getElementById('vbtn'),stat=document.getElementById('vstat'),
            tbox=document.getElementById('vtranscript');
        isRec=true;btn.innerHTML='⏹️ Stop';btn.style.background='linear-gradient(135deg,#ef4444,#dc2626)';
        stat.innerText='🎧 Listening...';tbox.style.display='block';
        var fullText='';
        rec.onresult=function(e){{
            var t='';for(var i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;
            tbox.innerText='📝 '+t;fullText=t;
            // Put text in Streamlit input
            var inp=window.parent.document.querySelector('input[data-testid="stTextInput"]');
            if(!inp) inp=window.parent.document.querySelector('textarea');
            if(inp){{
                var setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value');
                if(!setter)setter=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value');
                if(setter){{setter.set.call(inp,fullText);inp.dispatchEvent(new Event('input',{{bubbles:true}}));}}
            }}
        }};
        rec.onend=function(){{btn.innerHTML='🎤 {T("voice_btn")}';
            btn.style.background='linear-gradient(135deg,#6366f1,#4f46e5)';
            stat.innerText=fullText?'✅ Done':'';isRec=false;}};
        rec.onerror=function(e){{stat.innerText='❌ '+e.error;isRec=false;
            btn.innerHTML='🎤 {T("voice_btn")}';btn.style.background='linear-gradient(135deg,#6366f1,#4f46e5)';}};
        rec.start();
    }}
    </script>
    """
    return html


# ═══════════════════════════════════════════════════════
# RENDER PIPELINE RESULTS
# ═══════════════════════════════════════════════════════
def render_results(result: dict):
    """Render the full pipeline output in beautifully formatted sections."""
    if not result:
        st.warning(T("processing"))
        return

    # ── Profile ──
    with st.expander(T("sec_profile"), expanded=True):
        profile = result.get("profile", {})
        cols = st.columns(4)
        fields = [("name","👤 Name"),("age","🎂 Age"),("occupation","💼 Occupation"),("income_annual","💰 Income"),
                  ("state","📍 State"),("district","🏘️ District"),("category","🏷️ Category"),("family_size","👨‍👩‍👧‍👦 Family")]
        for i, (k, label) in enumerate(fields):
            v = profile.get(k)
            if v:
                with cols[i % 4]:
                    st.metric(label, str(v))

    # ── Eligible Schemes ──
    schemes = result.get("schemes", [])
    eligible = [s for s in schemes if s.get("eligible")]
    not_elig = [s for s in schemes if not s.get("eligible")]

    with st.expander(f"{T('sec_eligible')} ({len(eligible)})", expanded=True):
        if eligible:
            for s in eligible:
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.markdown(f"### ✅ {s.get('name', 'Unknown')}")
                    st.markdown(f"**Benefit:** {s.get('benefit', 'N/A')}")
                    st.markdown(f"**Why eligible:** {s.get('reasoning', 'Meets criteria')}")
                    if s.get("citations"):
                        st.caption(f"📌 Sources: {', '.join(s['citations'][:3])}")
                with col2:
                    st.success(f"💰 {s.get('benefit', '')}")
                st.divider()
        else:
            st.info("No eligible schemes found. Try providing more details.")

    # ── Not Eligible ──
    if not_elig:
        with st.expander(f"{T('sec_not_eligible')} ({len(not_elig)})", expanded=False):
            for s in not_elig:
                st.markdown(f"**❌ {s.get('name', '')}** — {s.get('reasoning', '')}")
                if s.get("how_to_fix"):
                    st.info(f"💡 How to qualify: {s['how_to_fix']}")

    # ── Conflicts ──
    conflicts = result.get("conflicts", [])
    with st.expander(f"{T('sec_conflicts')} ({len(conflicts) if conflicts else 0})", expanded=bool(conflicts)):
        if conflicts:
            for c in conflicts:
                snames = c.get("schemes", [])
                st.warning(f"**{' vs '.join(snames)}**: {c.get('issue', 'Conflict detected')}")
                if c.get("citations"):
                    st.caption(f"📌 {', '.join(c['citations'])}")
                if c.get("resolution"):
                    st.success(f"💡 Resolution: {c['resolution']}")
        else:
            st.success("✅ No conflicts — all eligible schemes are compatible!")

    # ── Action Path ──
    with st.expander(T("sec_action"), expanded=True):
        action = result.get("action_paths", {})
        if isinstance(action, dict):
            for scheme_name, info in action.items():
                st.markdown(f"### 🏛️ {scheme_name}")
                if isinstance(info, dict):
                    for key, val in info.items():
                        if val:
                            icon = {"office":"🏢","address":"📍","hours":"🕐","documents":"📄",
                                    "officer":"👤","steps":"📋","phone":"📞"}.get(key.lower(),"➡️")
                            st.markdown(f"{icon} **{key.replace('_',' ').title()}:** {val}")
                elif isinstance(info, str):
                    st.markdown(info)
                st.divider()
        elif isinstance(action, str):
            st.markdown(action)
        else:
            st.info("Action path information not available")

    # ── Optimizer ──
    with st.expander(T("sec_optimizer"), expanded=True):
        opt = result.get("optimization", {})
        best = opt.get("best_combination", [])
        if best:
            st.markdown(f"### 🏆 Best Combination: **{', '.join(best)}**")
            st.markdown(f"💰 **Total Annual Benefit:** {opt.get('total_estimated_benefit', 'N/A')}")
            if opt.get("reason"):
                st.markdown(f"📝 {opt['reason']}")
            if opt.get("all_combinations"):
                st.markdown("**All Ranked Options:**")
                for i, combo in enumerate(opt["all_combinations"][:5], 1):
                    st.markdown(f"{i}. {combo.get('schemes', 'N/A')} — {combo.get('total_benefit', 'N/A')}")
        else:
            st.info("Optimization data not available")

    # ── Life Journey ──
    with st.expander(T("sec_journey"), expanded=True):
        journey = result.get("life_journey", {})
        timeline = journey.get("timeline", [])
        if timeline:
            for entry in timeline:
                col1, col2 = st.columns([1, 3])
                with col1:
                    st.markdown(f"### 📅 {entry.get('year', '')}")
                with col2:
                    st.markdown(f"**{entry.get('scheme', '')}**")
                    if entry.get("life_event"):
                        st.markdown(f"Life Event: {entry['life_event']}")
                    if entry.get("benefit"):
                        st.markdown(f"Benefit: {entry['benefit']}")
                st.divider()
        else:
            st.info("Life journey data not available")

        if journey.get("recommendations"):
            st.markdown("**💡 Recommendations:**")
            for r in journey["recommendations"]:
                st.markdown(f"• {r}")

    # ── Sources ──
    with st.expander(T("sec_sources"), expanded=False):
        sources = result.get("sources_used", [])
        chunks = result.get("total_chunks_retrieved", 0)
        st.markdown(f"📊 **{chunks} document chunks** retrieved from:")
        for src in sources:
            st.markdown(f"• 📄 {src}")

    # ── Summary ──
    st.success(f"📊 **Summary:** {result.get('summary', '')}")
    if result.get("translated_summary"):
        st.info(f"🌐 **Translation:** {result['translated_summary']}")


# ═══════════════════════════════════════════════════════
# EXPLORE SCHEME FLOW
# ═══════════════════════════════════════════════════════
def render_scheme_explore(scheme_name):
    """Full explore flow: intro → eligibility → docs → form → office."""
    st.markdown(f"## {scheme_name}")

    info = ALL_SCHEMES.get(scheme_name, {})
    st.markdown(f"""
    <div class="section-card">
        <h3>{info.get('icon','')} {T('scheme_intro')}</h3>
        <p><b>Category:</b> {info.get('cat','')}</p>
        <p><b>Benefit:</b> {info.get('benefit','')}</p>
        <p>{info.get('desc','')}</p>
    </div>
    """, unsafe_allow_html=True)

    # RAG context for this scheme
    with st.spinner(f"Loading details for {scheme_name}..."):
        chunks = rag.search(scheme_name, top_k=10, scheme_filter=None)
        if chunks:
            with st.expander("📄 Scheme Details from PDFs", expanded=True):
                for c in chunks[:5]:
                    st.markdown(f"**{c['section']}** (Source: {c['source']}, Page {c['page']})")
                    st.markdown(f"> {c['text'][:400]}")
                    st.divider()

    # Upload docs
    st.markdown(f"### {T('scheme_docs')}")
    st.info("Upload your documents (Aadhaar, income certificate, caste certificate) to check eligibility and auto-fill the form.")

    doc_file = st.file_uploader(f"Upload for {scheme_name}", type=["pdf","txt"], key=f"doc_{scheme_name}")
    doc_text = ""
    if doc_file:
        if doc_file.name.endswith(".pdf"):
            try:
                import fitz
                d = fitz.open(stream=doc_file.read(), filetype="pdf")
                doc_text = "\n".join(p.get_text() for p in d)
                d.close()
            except:
                doc_text = ""
        else:
            doc_text = doc_file.read().decode("utf-8", errors="ignore")

        if doc_text:
            st.success(f"✅ Extracted {len(doc_text)} characters from document")

    # Check eligibility
    user_desc = st.text_area(
        "Describe yourself (or upload a document above)",
        placeholder="I am a 35-year-old farmer in Gujarat, SC category, income ₹1.2 lakh...",
        key=f"desc_{scheme_name}"
    )

    if st.button(f"✅ Check Eligibility & Fill Form for {scheme_name}", use_container_width=True, type="primary"):
        combined_input = user_desc or ""
        if doc_text:
            combined_input += f"\n\nExtracted from document: {doc_text[:2000]}"

        if not combined_input.strip():
            st.error("Please describe yourself or upload a document first.")
            return

        with st.spinner("Running eligibility check + form generation..."):
            try:
                from agents.orchestrator import (
                    query_understanding_agent, eligibility_agent,
                    form_filling_agent, nearest_action_path_agent
                )
                from chains.rag_chain import PolicyRAG

                # Parse profile
                profile = query_understanding_agent(combined_input)
                st.markdown(f"**👤 Detected Profile:** {json.dumps(profile, indent=2, ensure_ascii=False)}")

                # RAG retrieval
                r = PolicyRAG()
                chunks_data = r.search(f"{scheme_name} eligibility", top_k=10)

                # Eligibility
                elig = eligibility_agent(profile, chunks_data)
                scheme_result = None
                for s in elig.get("schemes", []):
                    if scheme_name.lower() in s.get("name", "").lower():
                        scheme_result = s
                        break

                if scheme_result and scheme_result.get("eligible"):
                    st.success(f"✅ **You are eligible for {scheme_name}!**")
                    st.markdown(f"**Reason:** {scheme_result.get('reasoning', '')}")
                    st.markdown(f"**Benefit:** {scheme_result.get('benefit', '')}")

                    # Generate form
                    st.markdown(f"### {T('scheme_form')}")
                    form = form_filling_agent(profile, scheme_name)
                    fields = form.get("fields", [])
                    filled = sum(1 for f in fields if f.get("filled"))
                    pct = int(filled / len(fields) * 100) if fields else 0
                    st.progress(pct / 100, f"Form {pct}% complete ({filled}/{len(fields)} fields)")
                    for f in fields:
                        icon = "✅" if f.get("filled") else "⬜"
                        val = f.get("value", "")
                        st.markdown(f"{icon} **{f.get('label', f.get('field_name', ''))}:** {val}")

                    # Action path
                    st.markdown(f"### {T('scheme_office')}")
                    action = nearest_action_path_agent(profile, elig)
                    if isinstance(action, dict):
                        for sn, info in action.items():
                            if isinstance(info, dict):
                                for k, v in info.items():
                                    if v:
                                        st.markdown(f"• **{k.replace('_',' ').title()}:** {v}")
                            elif isinstance(info, str):
                                st.markdown(f"• {info}")
                    st.success("📋 **Take these to the office:** Aadhaar, income certificate, bank passbook, filled form, passport photos")

                elif scheme_result:
                    st.error(f"❌ Not eligible for {scheme_name}")
                    st.markdown(f"**Reason:** {scheme_result.get('reasoning', '')}")
                    if scheme_result.get("how_to_fix"):
                        st.info(f"💡 How to qualify: {scheme_result['how_to_fix']}")
                else:
                    st.warning(f"Could not determine eligibility for {scheme_name} specifically. Showing all results:")
                    for s in elig.get("schemes", []):
                        status = "✅" if s.get("eligible") else "❌"
                        st.markdown(f"{status} **{s.get('name', '')}** — {s.get('reasoning', '')}")

            except Exception as e:
                st.error(f"Error: {str(e)}\n\nMake sure Ollama is running: `ollama serve`")
                traceback.print_exc()

    if st.button("← Back to Home", key="back_home"):
        st.session_state.page = "home"
        st.session_state.selected_scheme = None
        st.rerun()


# ═══════════════════════════════════════════════════════
# SIDEBAR
# ═══════════════════════════════════════════════════════
with st.sidebar:
    # Language
    st.markdown(f"### {T('language')}")
    sel_lang = st.selectbox("Language", list(LANG_MAP.keys()),
        index=list(LANG_MAP.values()).index(st.session_state.lang) if st.session_state.lang in LANG_MAP.values() else 0,
        label_visibility="collapsed")
    if LANG_MAP[sel_lang] != st.session_state.lang:
        st.session_state.lang = LANG_MAP[sel_lang]
        st.rerun()

    st.divider()

    # Stats
    cols = st.columns(3)
    with cols[0]:
        st.markdown(f'<div class="stat-box"><div class="num">{len(ALL_SCHEMES)}</div><div class="lbl">Schemes</div></div>', unsafe_allow_html=True)
    with cols[1]:
        st.markdown(f'<div class="stat-box"><div class="num">{rag.get_chunk_count()}</div><div class="lbl">RAG</div></div>', unsafe_allow_html=True)
    with cols[2]:
        st.markdown(f'<div class="stat-box"><div class="num">7</div><div class="lbl">Agents</div></div>', unsafe_allow_html=True)

    # Settings
    with st.expander(T("settings")):
        model = st.selectbox("Ollama Model", ["llama3.2", "llama3.1", "mistral", "gemma2"], index=0)
        langsmith_key = st.text_input("LangSmith API Key", type="password")
        if langsmith_key:
            os.environ["LANGCHAIN_API_KEY"] = langsmith_key
            os.environ["LANGCHAIN_TRACING_V2"] = "true"
            os.environ["LANGCHAIN_PROJECT"] = "PolicyPilot"
            st.success("✅ LangSmith tracing on")

    st.divider()

    # Explore Schemes
    st.markdown(f"### {T('explore')}")
    cat_filter = st.selectbox("Filter", ["All"] + CATEGORIES, label_visibility="collapsed")
    search_q = st.text_input("🔎", placeholder="Search schemes...", label_visibility="collapsed")

    filtered = {k: v for k, v in ALL_SCHEMES.items()
                if (cat_filter == "All" or v["cat"] == cat_filter)
                and (not search_q or search_q.lower() in k.lower() or search_q.lower() in v["desc"].lower())}

    for name, info in filtered.items():
        st.markdown(f"""<div class="scheme-pill">
            <div class="meta">{info['cat']}</div>
            <div class="name">{info['icon']} {name}</div>
            <div class="benefit">💰 {info['benefit']}</div>
        </div>""", unsafe_allow_html=True)
        if st.button(f"Explore → {name}", key=f"e_{name}", use_container_width=True):
            st.session_state.page = "explore"
            st.session_state.selected_scheme = name
            st.rerun()

    st.divider()

    # Download + Clear
    if st.session_state.result:
        pdf = make_pdf(st.session_state.result)
        st.download_button(T("download"), data=pdf, file_name=f"PolicyPilot_{datetime.now().strftime('%Y%m%d')}.txt",
                          mime="text/plain", use_container_width=True)
    if st.button(T("clear"), use_container_width=True):
        st.session_state.messages = []
        st.session_state.result = None
        st.session_state.page = "home"
        st.rerun()


# ═══════════════════════════════════════════════════════
# MAIN CONTENT
# ═══════════════════════════════════════════════════════

if st.session_state.page == "explore" and st.session_state.selected_scheme:
    render_scheme_explore(st.session_state.selected_scheme)

else:
    # ── Welcome ──
    st.markdown(f"""
    <div class="welcome-card">
        <h1>{T('title')}</h1>
        <p>{T('subtitle')}</p>
    </div>
    """, unsafe_allow_html=True)

    # ── Voice Input ──
    components.html(render_voice_widget(st.session_state.lang), height=80)

    # ── Text Input ──
    user_input = st.text_area(
        T("welcome"),
        placeholder=T("placeholder"),
        height=100,
        key="main_input"
    )

    # ── Submit Button ──
    if st.button(T("send"), use_container_width=True, type="primary"):
        if not user_input or not user_input.strip():
            st.warning("Please describe your situation first.")
        else:
            st.session_state.messages.append({"role": "user", "content": user_input})

            # Run FULL pipeline
            with st.spinner(T("processing")):
                try:
                    from rag.retriever import SchemeRetriever
                    from agents.orchestrator import run_full_pipeline

                    retriever = SchemeRetriever()
                    lang_code = st.session_state.lang
                    result = run_full_pipeline(user_input, retriever, lang_code)

                    st.session_state.result = result
                    st.session_state.messages.append({"role": "assistant", "content": result.get("summary", "")})

                except Exception as e:
                    st.error(f"❌ Error: {str(e)}\n\n**Make sure Ollama is running:**\n```\nollama serve\nollama pull llama3.2\n```")
                    traceback.print_exc()
                    result = None

    # ── Show Results ──
    if st.session_state.result:
        st.divider()
        render_results(st.session_state.result)

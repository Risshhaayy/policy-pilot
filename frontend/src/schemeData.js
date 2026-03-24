/**
 * PolicyPilot — Complete Scheme Database
 * Pre-cached scheme data for offline eligibility, explore page, and form generation.
 */

const SCHEME_DATA = {
    "Mukhyamantri Amrutam Yojana": {
        full_name: "Mukhyamantri Amrutam (MA) Yojana",
        category: "Health",
        icon: "🏥",
        state: "Gujarat",
        description: "Health insurance scheme for BPL families in Gujarat providing secondary and tertiary care.",
        who_can_apply: "BPL families residing in Gujarat",
        benefit: "Up to ₹5,00,000/year health coverage",
        deadline: "Open throughout the year",
        criteria: { state: "Gujarat", is_bpl_or_low_income: true },
        exclusion: ["income_tax_payer"],
        required_documents: ["Aadhaar Card", "BPL Certificate", "Income Certificate", "Ration Card"],
        eligibility_questions: [
            { id: "state", label: "Which state do you live in?", type: "select", options: ["Gujarat", "Other"] },
            { id: "is_bpl", label: "Do you have a BPL card?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "district", label: "District (Gujarat)", type: "text", required: true },
        ],
        portal_url: "https://magujarat.com/",
    },

    "MJPJAY (Health)": {
        full_name: "Mahatma Jyotirao Phule Jan Arogya Yojana",
        category: "Health",
        icon: "🏥",
        state: "Maharashtra",
        description: "Cashless medical facilities for farmers and BPL families in Maharashtra.",
        who_can_apply: "Farmers from distress districts and BPL cardholders in Maharashtra",
        benefit: "Up to ₹1,50,000/year health coverage",
        deadline: "Open throughout the year",
        criteria: { state: "Maharashtra" },
        exclusion: ["income_tax_payer"],
        required_documents: ["Aadhaar Card", "Ration Card (Yellow/Orange)", "Domicile Certificate"],
        eligibility_questions: [
            { id: "state", label: "Which state do you live in?", type: "select", options: ["Maharashtra", "Other"] },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
        ],
        portal_url: "https://www.jeevandayee.gov.in/",
    },

    "PM-KISAN": {
        full_name: "Pradhan Mantri Kisan Samman Nidhi",
        category: "Agriculture",
        icon: "🌾",
        description: "Direct income support of ₹6,000 per year to all landholding farmer families, paid in three equal installments every four months.",
        who_can_apply: "Small & marginal farmers with cultivable land up to 2 hectares (5 acres)",
        benefit: "₹6,000/year (₹2,000 every 4 months)",
        deadline: "Open throughout the year",
        criteria: { is_farmer: true, max_land_acres: 5.0 },
        exclusion: ["income_tax_payer", "government_employee"],
        required_documents: ["Aadhaar Card", "Land Records / Khasra-Khatauni", "Bank Account with IFSC"],
        eligibility_questions: [
            { id: "is_farmer", label: "Are you a farmer?", type: "boolean" },
            { id: "land_ownership_acres", label: "How many acres of cultivable land do you own?", type: "number" },
            { id: "is_income_tax_payer", label: "Do you pay income tax?", type: "boolean" },
            { id: "is_govt_employee", label: "Are you a government employee?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "gender", label: "Gender", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "address", label: "Address", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
            { field_name: "district", label: "District", type: "text", required: true },
            { field_name: "land_ownership_acres", label: "Land Area (acres)", type: "number", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
            { field_name: "ifsc_code", label: "IFSC Code", type: "text", required: true },
            { field_name: "occupation", label: "Occupation", type: "text", required: false },
        ],
        portal_url: "https://pmkisan.gov.in/RegistrationForm.aspx",
    },

    "PMAY-G (Housing)": {
        full_name: "Pradhan Mantri Awas Yojana — Gramin",
        category: "Housing",
        icon: "🏠",
        description: "Financial assistance to homeless and those living in kutcha houses to build pucca houses with basic amenities.",
        who_can_apply: "BPL families without a pucca house, living in kutcha/dilapidated housing",
        benefit: "₹1,20,000 (plains) / ₹1,30,000 (hilly areas)",
        deadline: "Open throughout the year via Gram Panchayat",
        criteria: { housing_status_in: ["kutcha", "homeless"], is_bpl_or_low_income: true, max_income: 300000 },
        exclusion: ["owns_pucca_house", "income_tax_payer", "government_employee"],
        required_documents: ["Aadhaar Card", "BPL Certificate / Income Certificate", "SECC-2011 data verification", "Bank Account", "Photograph"],
        eligibility_questions: [
            { id: "housing_status", label: "What is your current housing status?", type: "select", options: ["Kutcha house", "Homeless", "Pucca house", "Semi-pucca"] },
            { id: "income_annual", label: "What is your annual family income (₹)?", type: "number" },
            { id: "is_bpl", label: "Do you have a BPL card?", type: "boolean" },
            { id: "is_income_tax_payer", label: "Do you pay income tax?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "gender", label: "Gender", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "income_annual", label: "Annual Income (₹)", type: "number", required: true },
            { field_name: "housing_status", label: "Current Housing Status", type: "text", required: true },
            { field_name: "address", label: "Address", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
            { field_name: "district", label: "District", type: "text", required: true },
            { field_name: "category", label: "Category (SC/ST/OBC/General)", type: "text", required: true },
            { field_name: "family_size", label: "Family Size", type: "number", required: false },
        ],
        portal_url: "https://pmayg.nic.in/netiayHome/home.aspx",
    },

    "Ayushman Bharat PM-JAY (Health)": {
        full_name: "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana",
        category: "Health",
        icon: "🏥",
        description: "World's largest health insurance scheme providing ₹5 lakh coverage per family per year for secondary and tertiary hospitalizations.",
        who_can_apply: "BPL families, identified through SECC-2011 database",
        benefit: "₹5,00,000/year health insurance per family",
        deadline: "Open — check eligibility on mera.pmjay.gov.in",
        criteria: { is_bpl_or_low_income: true, max_income: 500000 },
        exclusion: ["income_tax_payer", "government_employee"],
        required_documents: ["Aadhaar Card", "Ration Card / BPL Certificate", "SECC-2011 verification", "Family photo"],
        eligibility_questions: [
            { id: "income_annual", label: "What is your annual family income (₹)?", type: "number" },
            { id: "is_bpl", label: "Do you have a BPL / Ration Card?", type: "boolean" },
            { id: "family_size", label: "How many members in your family?", type: "number" },
            { id: "is_income_tax_payer", label: "Do you pay income tax?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "gender", label: "Gender", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "income_annual", label: "Annual Income (₹)", type: "number", required: true },
            { field_name: "category", label: "Category", type: "text", required: true },
            { field_name: "family_size", label: "Family Size", type: "number", required: true },
            { field_name: "address", label: "Address", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
        ],
        portal_url: "https://beneficiary.nha.gov.in/",
    },

    "PM Ujjwala Yojana (LPG)": {
        full_name: "Pradhan Mantri Ujjwala Yojana",
        category: "Energy",
        icon: "🔥",
        description: "Free LPG connections to women from BPL households to replace unclean cooking fuels like wood, coal, and dung cakes.",
        who_can_apply: "Adult women (18+) from BPL families without an existing LPG connection",
        benefit: "Free LPG connection + first refill + stove (₹1,600 subsidy)",
        deadline: "Open throughout the year",
        criteria: { is_bpl_or_low_income: true, has_no_lpg: true, gender: "female", min_age: 18 },
        exclusion: ["already_has_lpg", "income_tax_payer"],
        required_documents: ["Aadhaar Card", "BPL Certificate / Ration Card", "Bank Account", "Passport-size photo", "Address proof"],
        eligibility_questions: [
            { id: "gender", label: "Gender of applicant?", type: "select", options: ["Female", "Male"] },
            { id: "age", label: "Age of applicant?", type: "number" },
            { id: "has_lpg", label: "Does your household already have an LPG connection?", type: "boolean" },
            { id: "is_bpl", label: "Do you have a BPL card?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name (Adult Woman)", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "gender", label: "Gender", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "income_annual", label: "Annual Income (₹)", type: "number", required: true },
            { field_name: "address", label: "Address", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://www.pmuy.gov.in/index.aspx",
    },

    "MGNREGA (Employment)": {
        full_name: "Mahatma Gandhi National Rural Employment Guarantee Act",
        category: "Employment",
        icon: "👷",
        description: "Guarantees 100 days of wage employment per year to every rural household whose adult members volunteer to do unskilled manual work.",
        who_can_apply: "Any rural adult (18+) willing to do unskilled manual work",
        benefit: "100 days guaranteed employment at ₹250-350/day",
        deadline: "Apply at Gram Panchayat anytime",
        criteria: { is_rural: true, min_age: 18 },
        exclusion: [],
        required_documents: ["Aadhaar Card", "Photograph", "Bank Account / Post Office Account"],
        eligibility_questions: [
            { id: "is_rural", label: "Do you live in a rural area?", type: "boolean" },
            { id: "age", label: "Your age?", type: "number" },
            { id: "willing_manual_work", label: "Are you willing to do manual unskilled work?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "gender", label: "Gender", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "address", label: "Village/Gram Panchayat", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
            { field_name: "district", label: "District", type: "text", required: true },
            { field_name: "bank_account", label: "Bank/Post Office Account", type: "text", required: true },
            { field_name: "occupation", label: "Occupation", type: "text", required: false },
        ],
        portal_url: "https://nrega.nic.in/Netnrega/stHome.aspx",
    },

    "NFSA (Food Security)": {
        full_name: "National Food Security Act",
        category: "Food",
        icon: "🍚",
        description: "Subsidized food grains to approximately two-thirds of India's population — rice at ₹3/kg, wheat at ₹2/kg, and coarse grains at ₹1/kg.",
        who_can_apply: "BPL families under AAY or PHH categories with ration card",
        benefit: "Rice ₹3/kg, Wheat ₹2/kg, Coarse grains ₹1/kg (5kg/person/month)",
        deadline: "Apply at local PDS office",
        criteria: { is_bpl_or_low_income: true, max_income: 300000 },
        exclusion: ["income_tax_payer"],
        required_documents: ["Ration Card (AAY/PHH)", "Aadhaar Card", "Family details"],
        eligibility_questions: [
            { id: "income_annual", label: "What is your annual family income (₹)?", type: "number" },
            { id: "has_ration_card", label: "Do you have a Ration Card (AAY/PHH)?", type: "boolean" },
            { id: "family_size", label: "Number of family members?", type: "number" },
        ],
        form_template: [
            { field_name: "name", label: "Head of Household", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "income_annual", label: "Annual Income (₹)", type: "number", required: true },
            { field_name: "family_size", label: "Number of Family Members", type: "number", required: true },
            { field_name: "address", label: "Address", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
            { field_name: "district", label: "District", type: "text", required: true },
            { field_name: "category", label: "Category (AAY/PHH)", type: "text", required: true },
        ],
        portal_url: "https://nfsa.gov.in/",
    },

    "PM SVANidhi (Street Vendors)": {
        full_name: "Prime Minister Street Vendor's AtmaNirbhar Nidhi",
        category: "Financial",
        icon: "🏪",
        description: "Micro-credit facility providing affordable loans up to ₹50,000 to street vendors to restart their livelihoods post-COVID.",
        who_can_apply: "Street vendors with a vending certificate or letter of recommendation from ULB",
        benefit: "Loan up to ₹50,000 (₹10K → ₹20K → ₹50K in 3 tranches), 7% interest subsidy",
        deadline: "Open throughout the year",
        criteria: { is_street_vendor: true, min_age: 18 },
        exclusion: [],
        required_documents: ["Aadhaar Card", "Vending Certificate / Letter of Recommendation", "Bank Account", "Photograph"],
        eligibility_questions: [
            { id: "is_street_vendor", label: "Are you a street vendor / hawker?", type: "boolean" },
            { id: "has_vending_cert", label: "Do you have a vending certificate or ULB recommendation?", type: "boolean" },
            { id: "age", label: "Your age?", type: "number" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "gender", label: "Gender", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "vending_certificate", label: "Vending Certificate Number", type: "text", required: true },
            { field_name: "address", label: "Vending Location", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
            { field_name: "ifsc_code", label: "IFSC Code", type: "text", required: true },
        ],
        portal_url: "https://pmsvanidhi.mohua.gov.in/",
    },

    "Sukanya Samriddhi Yojana": {
        full_name: "Sukanya Samriddhi Yojana",
        category: "Financial",
        icon: "👧",
        description: "Government-backed savings scheme for the girl child with high interest rate (8.2%) and tax benefits under Section 80C.",
        who_can_apply: "Parents/guardians of a girl child below 10 years of age",
        benefit: "8.2% interest rate, tax-free maturity, min ₹250/year deposit",
        deadline: "Open — account at any Post Office or authorized bank",
        criteria: { has_girl_child: true, girl_child_age_max: 10 },
        exclusion: ["girl_child_above_10"],
        required_documents: ["Girl child's birth certificate", "Parent/Guardian Aadhaar", "Address proof", "Photograph"],
        eligibility_questions: [
            { id: "has_girl_child", label: "Do you have a girl child?", type: "boolean" },
            { id: "girl_child_age", label: "Age of the girl child (years)?", type: "number" },
            { id: "existing_account", label: "Does she already have a Sukanya Samriddhi account?", type: "boolean" },
        ],
        form_template: [
            { field_name: "guardian_name", label: "Guardian's Full Name", type: "text", required: true },
            { field_name: "girl_child_name", label: "Girl Child's Name", type: "text", required: true },
            { field_name: "girl_child_dob", label: "Girl Child's Date of Birth", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Guardian's Aadhaar Number", type: "text", required: true },
            { field_name: "address", label: "Address", type: "text", required: true },
            { field_name: "bank_name", label: "Bank / Post Office Name", type: "text", required: true },
            { field_name: "initial_deposit", label: "Initial Deposit Amount (₹)", type: "number", required: true },
        ],
        portal_url: "https://www.indiapost.gov.in/Financial/Pages/Content/Sukanya-Samriddhi-Account.aspx",
    },

    "NSAP — Old Age Pension": {
        full_name: "National Social Assistance Programme — Indira Gandhi National Old Age Pension Scheme",
        category: "Social Security",
        icon: "🧓",
        description: "Monthly pension of ₹200-500 for senior citizens (60+) from BPL families to ensure minimum financial security.",
        who_can_apply: "Senior citizens aged 60+ from Below Poverty Line families",
        benefit: "₹200/month (60-79 yrs) / ₹500/month (80+ yrs) + state top-up",
        deadline: "Apply at Block/District office anytime",
        criteria: { min_age: 60, is_bpl_or_low_income: true },
        exclusion: ["government_pensioner"],
        required_documents: ["Aadhaar Card", "Age proof (voter ID / birth cert)", "BPL Certificate", "Bank Account"],
        eligibility_questions: [
            { id: "age", label: "Your age?", type: "number" },
            { id: "is_bpl", label: "Are you from a BPL family?", type: "boolean" },
            { id: "has_other_pension", label: "Do you receive any other government pension?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "gender", label: "Gender", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "address", label: "Address", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
            { field_name: "district", label: "District / Block", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://nsap.nic.in/",
    },

    "PM Scholarship Scheme": {
        full_name: "Prime Minister's Scholarship Scheme",
        category: "Education",
        icon: "🎓",
        description: "Scholarship for dependent children and wards of ex-servicemen and ex-Coast Guard personnel for professional and technical education.",
        who_can_apply: "Children of ex-servicemen/ex-Coast Guard for professional degree courses",
        benefit: "₹3,000/month (boys), ₹3,600/month (girls) for course duration",
        deadline: "August - October each year (academic cycle)",
        criteria: { is_ward_of_ex_serviceman: true, min_marks_12th: 60 },
        exclusion: ["already_receiving_other_scholarship"],
        required_documents: ["Aadhaar Card", "12th Class Marksheet", "Ex-serviceman Discharge Certificate", "College Admission Letter", "Bank Account"],
        eligibility_questions: [
            { id: "is_ward_of_ex_serviceman", label: "Are you a child/ward of an ex-serviceman or ex-Coast Guard?", type: "boolean" },
            { id: "marks_12th", label: "Your 12th class percentage?", type: "number" },
            { id: "course_type", label: "Are you joining a professional/technical degree course?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Student's Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "gender", label: "Gender", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "father_name", label: "Father's/Guardian's Name", type: "text", required: true },
            { field_name: "service_number", label: "Ex-Serviceman Service Number", type: "text", required: true },
            { field_name: "college_name", label: "College/Institute Name", type: "text", required: true },
            { field_name: "course_name", label: "Course Name", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://scholarships.gov.in/",
    },

    "Atal Pension Yojana": {
        full_name: "Atal Pension Yojana",
        category: "Financial",
        icon: "🧓",
        description: "Government-backed pension scheme for workers in unorganised sector guaranteeing fixed monthly pension of ₹1,000–₹5,000 after age 60.",
        who_can_apply: "Indian citizens aged 18–40 working in unorganised sector with a savings bank account",
        benefit: "₹1,000–₹5,000/month pension after age 60",
        deadline: "Open throughout the year",
        criteria: { min_age: 18, max_income: 500000 },
        exclusion: ["income_tax_payer", "government_employee"],
        required_documents: ["Aadhaar Card", "Bank Account Passbook", "Mobile Number"],
        eligibility_questions: [
            { id: "age", label: "Your age?", type: "number" },
            { id: "has_bank_account", label: "Do you have a savings bank account?", type: "boolean" },
            { id: "is_income_tax_payer", label: "Do you pay income tax?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
            { field_name: "pension_amount", label: "Desired Monthly Pension (₹1000–₹5000)", type: "number", required: true },
        ],
        portal_url: "https://www.npscra.nsdl.co.in/scheme-details.php",
    },

    "PM Suraksha Bima Yojana": {
        full_name: "Pradhan Mantri Suraksha Bima Yojana",
        category: "Financial",
        icon: "🛡️",
        description: "Accident insurance scheme offering ₹2 lakh cover for accidental death or permanent disability at just ₹20/year premium.",
        who_can_apply: "Indian citizens aged 18–70 with a bank account",
        benefit: "₹2,00,000 cover for accidental death/disability (₹20/year premium)",
        deadline: "Open throughout the year",
        criteria: { min_age: 18 },
        exclusion: [],
        required_documents: ["Aadhaar Card", "Bank Account Passbook"],
        eligibility_questions: [
            { id: "age", label: "Your age?", type: "number" },
            { id: "has_bank_account", label: "Do you have a bank account?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://www.jansuraksha.gov.in/",
    },

    "PM Jeevan Jyoti Bima Yojana": {
        full_name: "Pradhan Mantri Jeevan Jyoti Bima Yojana",
        category: "Financial",
        icon: "🧿",
        description: "Life insurance scheme offering ₹2 lakh term life cover at ₹436/year for citizens aged 18–50.",
        who_can_apply: "Indian citizens aged 18–50 with a bank account",
        benefit: "₹2,00,000 life insurance cover (₹436/year premium)",
        deadline: "Open throughout the year",
        criteria: { min_age: 18 },
        exclusion: [],
        required_documents: ["Aadhaar Card", "Bank Account Passbook"],
        eligibility_questions: [
            { id: "age", label: "Your age?", type: "number" },
            { id: "has_bank_account", label: "Do you have a bank account?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
            { field_name: "nominee_name", label: "Nominee Name", type: "text", required: true },
        ],
        portal_url: "https://www.jansuraksha.gov.in/",
    },

    "Kisan Credit Card": {
        full_name: "Kisan Credit Card Scheme",
        category: "Agriculture",
        icon: "🌱",
        description: "Short-term credit facility for farmers to meet agricultural and allied activity needs at subsidised interest rates.",
        who_can_apply: "Farmers, sharecroppers, tenant farmers and self-help groups engaged in crop production",
        benefit: "Credit up to ₹3 lakh at 4% interest rate (after subvention)",
        deadline: "Open throughout the year",
        criteria: { is_farmer: true },
        exclusion: [],
        required_documents: ["Aadhaar Card", "Land Records", "Bank Account", "Passport Photo"],
        eligibility_questions: [
            { id: "is_farmer", label: "Are you a farmer or engaged in agriculture?", type: "boolean" },
            { id: "land_ownership_acres", label: "Land area (acres)?", type: "number" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "land_ownership_acres", label: "Land Area (acres)", type: "number", required: true },
            { field_name: "crop_type", label: "Main Crop Type", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://pmkisan.gov.in/",
    },

    "PM Fasal Bima Yojana": {
        full_name: "Pradhan Mantri Fasal Bima Yojana",
        category: "Agriculture",
        icon: "🌾",
        description: "Crop insurance scheme to provide financial support to farmers suffering crop loss/damage due to unforeseen calamities.",
        who_can_apply: "All farmers growing notified crops in notified areas",
        benefit: "Full sum insured for crop losses — premium as low as 1.5% (Rabi)/2% (Kharif)",
        deadline: "Before sowing: Kharif (July), Rabi (December)",
        criteria: { is_farmer: true },
        exclusion: [],
        required_documents: ["Aadhaar Card", "Land Records / Khasra-Khatauni", "Bank Account", "Sowing Certificate"],
        eligibility_questions: [
            { id: "is_farmer", label: "Are you a farmer?", type: "boolean" },
            { id: "land_ownership_acres", label: "Land area (acres)?", type: "number" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "land_ownership_acres", label: "Land Area (acres)", type: "number", required: true },
            { field_name: "crop_type", label: "Crop Type", type: "text", required: true },
            { field_name: "sowing_date", label: "Sowing Date", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://pmfby.gov.in/",
    },

    "Stand Up India": {
        full_name: "Stand Up India Scheme",
        category: "Financial",
        icon: "💼",
        description: "Facilitates bank loans between ₹10 lakh to ₹1 crore to at least one SC or ST borrower and one woman borrower per bank branch.",
        who_can_apply: "SC/ST entrepreneurs and women for greenfield enterprises",
        benefit: "Loan of ₹10 lakh to ₹1 crore for greenfield enterprise",
        deadline: "Open throughout the year",
        criteria: { min_age: 18 },
        exclusion: [],
        required_documents: ["Aadhaar Card", "Business Plan", "Caste Certificate (SC/ST)", "Income Certificate", "Bank Account"],
        eligibility_questions: [
            { id: "age", label: "Your age?", type: "number" },
            { id: "category", label: "Do you belong to SC/ST or are you a woman entrepreneur?", type: "boolean" },
            { id: "has_business_plan", label: "Do you have a business plan?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "category", label: "Category (SC/ST/Woman)", type: "text", required: true },
            { field_name: "business_type", label: "Business Type", type: "text", required: true },
            { field_name: "loan_amount", label: "Loan Amount Required (₹)", type: "number", required: true },
        ],
        portal_url: "https://www.standupmitra.in/",
    },

    "PM Kaushal Vikas Yojana": {
        full_name: "Pradhan Mantri Kaushal Vikas Yojana",
        category: "Employment",
        icon: "🔧",
        description: "Skill development initiative to provide industry-relevant skill training to youth to help secure jobs and self-employment.",
        who_can_apply: "Indian youth (10th/12th dropout or pass), unemployed, seeking skill training",
        benefit: "Free skill training + certification + ₹8,000 reward on completion",
        deadline: "Open throughout the year",
        criteria: { min_age: 15 },
        exclusion: [],
        required_documents: ["Aadhaar Card", "Educational Certificates", "Bank Account"],
        eligibility_questions: [
            { id: "age", label: "Your age?", type: "number" },
            { id: "employment_status", label: "Are you currently unemployed?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "education_level", label: "Highest Education Level", type: "text", required: true },
            { field_name: "preferred_trade", label: "Preferred Trade/Skill", type: "text", required: false },
        ],
        portal_url: "https://www.pmkvyofficial.org/",
    },

    "PM Jan Dhan Yojana": {
        full_name: "Pradhan Mantri Jan Dhan Yojana",
        category: "Financial",
        icon: "🏦",
        description: "National financial inclusion mission ensuring access to financial services — basic savings bank account, remittance, credit, insurance, and pension.",
        who_can_apply: "Any Indian citizen without a bank account, or with an inactive/basic account",
        benefit: "Zero-balance bank account + ₹2 lakh accident insurance + ₹30,000 life cover",
        deadline: "Open throughout the year",
        criteria: {},
        exclusion: [],
        required_documents: ["Aadhaar Card or any valid ID proof"],
        eligibility_questions: [
            { id: "has_bank_account", label: "Do you already have a bank account?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "address", label: "Address", type: "text", required: true },
            { field_name: "mobile", label: "Mobile Number", type: "text", required: true },
        ],
        portal_url: "https://pmjdy.gov.in/",
    },

    "PM Matru Vandana Yojana": {
        full_name: "Pradhan Mantri Matru Vandana Yojana",
        category: "Social",
        icon: "🤱",
        description: "Maternity benefit programme providing cash incentives of ₹5,000 in installments for first live birth to improve health and nutrition of pregnant women.",
        who_can_apply: "Pregnant women and lactating mothers for their first live birth (aged 19+)",
        benefit: "₹5,000 in 3 installments for first pregnancy",
        deadline: "Open — register within 730 days of LMP",
        criteria: { min_age: 19, gender: "female" },
        exclusion: ["government_employee"],
        required_documents: ["Aadhaar Card", "Bank Account", "MCP Card", "Ration Card"],
        eligibility_questions: [
            { id: "age", label: "Your age?", type: "number" },
            { id: "gender", label: "Gender?", type: "select", options: ["Female", "Male", "Other"] },
            { id: "is_first_pregnancy", label: "Is this your first pregnancy?", type: "boolean" },
            { id: "is_govt_employee", label: "Are you a government employee?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "lmp_date", label: "Last Menstrual Period (LMP) Date", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://pmmvy.wcd.gov.in/",
    },

    "Beti Bachao Beti Padhao": {
        full_name: "Beti Bachao Beti Padhao Scheme",
        category: "Education",
        icon: "👧",
        description: "Scheme to address declining child sex ratio and promote welfare and education of the girl child across India.",
        who_can_apply: "Parents of girl children, particularly in districts with low sex ratio",
        benefit: "Educational support, cash incentives for schooling, awareness support",
        deadline: "Open throughout the year",
        criteria: { has_girl_child: true },
        exclusion: [],
        required_documents: ["Girl Child's Birth Certificate", "Aadhaar Card of Parents", "School Enrollment Proof"],
        eligibility_questions: [
            { id: "has_girl_child", label: "Do you have a girl child?", type: "boolean" },
            { id: "girl_child_age", label: "Age of girl child?", type: "number" },
        ],
        form_template: [
            { field_name: "parent_name", label: "Parent/Guardian Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "girl_child_name", label: "Girl Child's Name", type: "text", required: true },
            { field_name: "girl_child_age", label: "Girl Child's Age", type: "number", required: true },
            { field_name: "district", label: "District", type: "text", required: true },
        ],
        portal_url: "https://wcd.nic.in/bbbp-schemes",
    },

    "National Scholarship Portal": {
        full_name: "National Scholarship Portal — Central Sector Schemes",
        category: "Education",
        icon: "📚",
        description: "One-stop platform for students to access various central government scholarships for pre-matric, post-matric and top-class education.",
        who_can_apply: "Students from Class 1 to PhD level belonging to SC/ST/OBC/minority communities",
        benefit: "₹500–₹20,000/month depending on scheme and level",
        deadline: "September–November every academic year",
        criteria: { min_age: 5 },
        exclusion: [],
        required_documents: ["Aadhaar Card", "Income Certificate", "Caste Certificate", "Marksheet", "Bank Account", "Bonafide Certificate"],
        eligibility_questions: [
            { id: "education_level", label: "Current education level?", type: "select", options: ["Class 1-10", "Class 11-12", "College/University", "Post-Graduate"] },
            { id: "category", label: "Category?", type: "select", options: ["SC", "ST", "OBC", "Minority", "General"] },
            { id: "income_annual", label: "Annual family income (₹)?", type: "number" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "education_level", label: "Education Level", type: "text", required: true },
            { field_name: "institution_name", label: "School/College Name", type: "text", required: true },
            { field_name: "income_annual", label: "Annual Family Income (₹)", type: "number", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://scholarships.gov.in/",
    },

    "PM Surya Ghar Yojana": {
        full_name: "PM Surya Ghar: Muft Bijli Yojana",
        category: "Energy",
        icon: "☀️",
        description: "Scheme to install rooftop solar panels on residential homes to provide 300 units free electricity per month and reduce power bills.",
        who_can_apply: "Indian households with own rooftop and electricity connection",
        benefit: "300 units free electricity/month + 40% subsidy on solar installation",
        deadline: "Open — 1 crore homes target",
        criteria: {},
        exclusion: [],
        required_documents: ["Aadhaar Card", "Electricity Bill", "Bank Account", "Roof Ownership Proof"],
        eligibility_questions: [
            { id: "has_electricity_connection", label: "Do you have a home electricity connection?", type: "boolean" },
            { id: "owns_house", label: "Do you own the house with a rooftop?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "electricity_consumer_number", label: "Electricity Consumer Number", type: "text", required: true },
            { field_name: "address", label: "Address", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://pmsuryaghar.gov.in/",
    },

    "Soil Health Card Scheme": {
        full_name: "Soil Health Card Scheme",
        category: "Agriculture",
        icon: "🌍",
        description: "Government issues Soil Health Cards to farmers which carry crop-wise recommendations of nutrients and fertilizers for farmers' farms.",
        who_can_apply: "All Indian farmers",
        benefit: "Free soil testing + nutrient report + fertilizer recommendations",
        deadline: "Open throughout the year",
        criteria: { is_farmer: true },
        exclusion: [],
        required_documents: ["Aadhaar Card", "Land Records"],
        eligibility_questions: [
            { id: "is_farmer", label: "Are you a farmer?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "land_ownership_acres", label: "Land Area (acres)", type: "number", required: true },
            { field_name: "district", label: "District", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
        ],
        portal_url: "https://soilhealth.dac.gov.in/",
    },

    "PMAY-U (Urban Housing)": {
        full_name: "Pradhan Mantri Awas Yojana — Urban",
        category: "Housing",
        icon: "🏙️",
        description: "Affordable housing scheme for urban poor providing interest subsidy on home loans under Credit Linked Subsidy Scheme (CLSS).",
        who_can_apply: "EWS/LIG/MIG urban households without pucca house in their name",
        benefit: "Interest subsidy up to ₹2.67 lakh on home loan",
        deadline: "Check current phase on official portal",
        criteria: { max_income: 1800000 },
        exclusion: ["owns_pucca_house"],
        required_documents: ["Aadhaar Card", "Income Certificate", "Property Documents", "Bank Account"],
        eligibility_questions: [
            { id: "income_annual", label: "Annual household income (₹)?", type: "number" },
            { id: "owns_pucca_house", label: "Do you already own a pucca house?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "income_annual", label: "Annual Income (₹)", type: "number", required: true },
            { field_name: "city", label: "City / Urban Area", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://pmaymis.gov.in/",
    },

    "PM Mudra Yojana": {
        full_name: "Pradhan Mantri MUDRA Yojana",
        category: "Financial",
        icon: "💰",
        description: "Provides loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises under three categories: Shishu, Kishore, and Tarun.",
        who_can_apply: "Small business owners, entrepreneurs, traders, artisans needing credit for business",
        benefit: "Shishu: up to ₹50K | Kishore: ₹50K–₹5L | Tarun: ₹5L–₹10L",
        deadline: "Open throughout the year",
        criteria: { min_age: 18 },
        exclusion: [],
        required_documents: ["Aadhaar Card", "PAN Card", "Business Proof", "Bank Account", "Photographs"],
        eligibility_questions: [
            { id: "age", label: "Your age?", type: "number" },
            { id: "business_type", label: "Type of business?", type: "select", options: ["Manufacturing", "Trading", "Service", "Agriculture Allied"] },
        ],
        form_template: [
            { field_name: "name", label: "Full Name / Business Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "business_type", label: "Business Type", type: "text", required: true },
            { field_name: "loan_amount", label: "Loan Amount Required (₹)", type: "number", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
        ],
        portal_url: "https://www.mudra.org.in/",
    },

    "Startup India Scheme": {
        full_name: "Startup India Initiative",
        category: "Financial",
        icon: "🚀",
        description: "Government initiative to build a strong ecosystem for nurturing innovation and startups, providing tax benefits, funding, and ease of compliance.",
        who_can_apply: "Startups incorporated less than 10 years ago with annual turnover not exceeding ₹100 crore and working towards innovation",
        benefit: "Tax exemption (3 years), easier compliance, ₹10K crore Fund of Funds, IPR fee rebate",
        deadline: "Open throughout the year",
        criteria: { min_age: 18 },
        exclusion: [],
        required_documents: ["Company Incorporation Certificate", "PAN Card", "Aadhaar Card", "Business Plan / Innovation Description"],
        eligibility_questions: [
            { id: "is_incorporated", label: "Is your startup registered with MCA?", type: "boolean" },
            { id: "years_since_incorporation", label: "Years since incorporation?", type: "number" },
        ],
        form_template: [
            { field_name: "startup_name", label: "Startup Name", type: "text", required: true },
            { field_name: "incorporation_date", label: "Incorporation Date", type: "text", required: true },
            { field_name: "sector", label: "Sector / Industry", type: "text", required: true },
            { field_name: "pan_number", label: "PAN Number", type: "text", required: true },
            { field_name: "annual_turnover", label: "Annual Turnover (₹)", type: "number", required: false },
        ],
        portal_url: "https://www.startupindia.gov.in/",
    },

    "Saubhagya Yojana": {
        full_name: "Pradhan Mantri Sahaj Bijli Har Ghar Yojana — Saubhagya",
        category: "Energy",
        icon: "💡",
        description: "Universal household electrification scheme to provide electricity connections to all un-electrified households in rural and urban areas.",
        who_can_apply: "Households without electricity connection in rural and urban India",
        benefit: "Free electricity connection for BPL households; ₹500 charge for others (EMI option)",
        deadline: "Open — apply at nearest electricity office or village camp",
        criteria: {},
        exclusion: [],
        required_documents: ["Aadhaar Card", "Ration Card / Proof of Residence"],
        eligibility_questions: [
            { id: "has_electricity_connection", label: "Do you have an electricity connection at home?", type: "boolean" },
            { id: "is_bpl", label: "Do you have a BPL card?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "address", label: "Address", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
            { field_name: "district", label: "District", type: "text", required: true },
        ],
        portal_url: "https://saubhagya.gov.in/",
    },

    "PM Vishwakarma Yojana": {
        full_name: "PM Vishwakarma Scheme",
        category: "Employment",
        icon: "🔨",
        description: "Support scheme for traditional artisans and craftspeople (Vishwakarmas) providing skill training, toolkits, and collateral-free credit.",
        who_can_apply: "Traditional artisans/craftspeople in 18 trades (carpenter, blacksmith, potter, weaver etc.) aged 18+",
        benefit: "₹15,000 toolkit incentive + ₹1–2 lakh credit at 5% interest + free training stipend",
        deadline: "Open throughout the year",
        criteria: { min_age: 18 },
        exclusion: ["government_employee"],
        required_documents: ["Aadhaar Card", "Caste Certificate (if applicable)", "Bank Account", "Trade/Work Proof"],
        eligibility_questions: [
            { id: "age", label: "Your age?", type: "number" },
            { id: "trade_type", label: "Which traditional trade do you practice?", type: "select", options: ["Carpenter", "Blacksmith", "Potter", "Weaver", "Goldsmith", "Tailor", "Mason", "Other"] },
            { id: "is_govt_employee", label: "Are you a government employee?", type: "boolean" },
        ],
        form_template: [
            { field_name: "name", label: "Full Name", type: "text", required: true },
            { field_name: "age", label: "Age", type: "number", required: true },
            { field_name: "aadhaar_number", label: "Aadhaar Number", type: "text", required: true },
            { field_name: "trade_type", label: "Trade / Craft", type: "text", required: true },
            { field_name: "bank_account", label: "Bank Account Number", type: "text", required: true },
            { field_name: "state", label: "State", type: "text", required: true },
        ],
        portal_url: "https://pmvishwakarma.gov.in/",
    },
};

// ── All categories for filtering ──
export const SCHEME_CATEGORIES = [...new Set(Object.values(SCHEME_DATA).map(s => s.category))];

/**
 * Offline eligibility check using cached rules.
 */
export function offlineEligibilityCheck(profile) {
    const results = [];

    for (const [key, scheme] of Object.entries(SCHEME_DATA)) {
        let eligible = true;
        const reasons_yes = [];
        const reasons_no = [];
        const missing = [];
        const criteria = scheme.criteria;
        const income = profile.income_annual || 0;
        const age = profile.age || 25;

        if (criteria.is_farmer) {
            const isFarmer = profile.is_farmer || ['farmer', 'agriculture', 'farming'].includes((profile.occupation || '').toLowerCase());
            if (isFarmer) reasons_yes.push('Is a farmer');
            else { eligible = false; missing.push('Must be a farmer'); reasons_no.push('Not a farmer'); }
        }
        if (criteria.max_land_acres && profile.land_ownership_acres > criteria.max_land_acres) {
            eligible = false; missing.push(`Land must be ≤ ${criteria.max_land_acres} acres`);
        }
        if (criteria.max_income && income > criteria.max_income) {
            eligible = false; missing.push(`Income must be ≤ ₹${criteria.max_income.toLocaleString()}`);
            reasons_no.push(`Income ₹${income.toLocaleString()} exceeds limit`);
        }
        if (criteria.is_bpl_or_low_income) {
            if (profile.is_bpl || income <= 300000) reasons_yes.push('BPL/low-income');
            else { eligible = false; missing.push('Must be BPL or low-income'); }
        }
        if (criteria.housing_status_in) {
            const h = (profile.housing_status || '').toLowerCase();
            if (criteria.housing_status_in.includes(h) || !h) reasons_yes.push('Housing qualifies');
            else { eligible = false; missing.push(`Housing must be: ${criteria.housing_status_in.join('/')}`); }
        }
        if (criteria.is_rural) {
            if (profile.is_rural !== false) reasons_yes.push('Rural resident');
            else { eligible = false; missing.push('Must be rural resident'); }
        }
        if (criteria.min_age && age < criteria.min_age) {
            eligible = false; missing.push(`Must be ≥ ${criteria.min_age} years`);
        }
        if (criteria.gender && profile.gender && profile.gender.toLowerCase() !== criteria.gender) {
            if (criteria.gender === 'female' && profile.gender.toLowerCase() === 'male') {
                reasons_yes.push('Can apply through female family member');
            } else {
                eligible = false; missing.push(`Applicant should be ${criteria.gender}`);
            }
        }

        for (const excl of scheme.exclusion) {
            if (excl === 'income_tax_payer' && income > 500000) { eligible = false; reasons_no.push('Income tax payer excluded'); }
            if (excl === 'government_employee' && (profile.occupation || '').toLowerCase().includes('gov')) { eligible = false; reasons_no.push('Govt employees excluded'); }
            if (excl === 'owns_pucca_house' && (profile.housing_status || '').toLowerCase() === 'pucca') { eligible = false; reasons_no.push('Already has pucca house'); }
        }

        results.push({
            name: key,
            eligible,
            confidence: eligible ? 0.85 : 0.8,
            reasoning: eligible
                ? `ELIGIBLE (offline check): ${reasons_yes.join('; ')}`
                : `NOT ELIGIBLE (offline check): ${reasons_no.join('; ')}. Missing: ${missing.join('; ')}`,
            benefit_amount: scheme.benefit,
            required_documents: scheme.required_documents,
            why_not_eligible: !eligible ? reasons_no.concat(missing).join('; ') : null,
            missing_criteria: missing,
            checklist: scheme.required_documents,
            application_steps: [],
            citations: ['Offline mode — cached scheme data'],
        });
    }

    return results;
}

/**
 * Check eligibility for a single scheme using questionnaire answers.
 */
export function checkSchemeEligibility(schemeName, answers) {
    const scheme = SCHEME_DATA[schemeName];
    if (!scheme) return { eligible: false, message: 'Scheme not found' };

    let eligible = true;
    const reasons = [];
    const missing = [];
    const criteria = scheme.criteria;

    // PM-KISAN checks
    if (criteria.is_farmer && answers.is_farmer === false) { eligible = false; missing.push('Must be a farmer'); }
    if (criteria.max_land_acres && answers.land_ownership_acres > criteria.max_land_acres) { eligible = false; missing.push(`Land must be ≤ ${criteria.max_land_acres} acres`); }

    // Income checks
    if (criteria.max_income && answers.income_annual > criteria.max_income) { eligible = false; missing.push(`Income must be ≤ ₹${criteria.max_income.toLocaleString()}`); }
    if (criteria.is_bpl_or_low_income && !answers.is_bpl && (answers.income_annual || 0) > 300000) { eligible = false; missing.push('Must be BPL or income ≤ ₹3,00,000'); }

    // Age checks
    if (criteria.min_age && (answers.age || 0) < criteria.min_age) { eligible = false; missing.push(`Must be ≥ ${criteria.min_age} years old`); }

    // Gender checks
    if (criteria.gender && answers.gender && answers.gender.toLowerCase() !== criteria.gender) { eligible = false; missing.push(`Applicant must be ${criteria.gender}`); }

    // Housing checks
    if (criteria.housing_status_in && answers.housing_status) {
        const h = answers.housing_status.toLowerCase().replace(' house', '');
        if (!criteria.housing_status_in.includes(h)) { eligible = false; missing.push(`Housing must be: ${criteria.housing_status_in.join(' or ')}`); }
    }

    // Rural check
    if (criteria.is_rural && answers.is_rural === false) { eligible = false; missing.push('Must be a rural resident'); }

    // LPG check
    if (criteria.has_no_lpg && answers.has_lpg === true) { eligible = false; missing.push('Must not have an existing LPG connection'); }

    // Street vendor check
    if (criteria.is_street_vendor && answers.is_street_vendor === false) { eligible = false; missing.push('Must be a street vendor'); }

    // Girl child
    if (criteria.has_girl_child && answers.has_girl_child === false) { eligible = false; missing.push('Must have a girl child'); }
    if (criteria.girl_child_age_max && (answers.girl_child_age || 0) > criteria.girl_child_age_max) { eligible = false; missing.push(`Girl child must be ≤ ${criteria.girl_child_age_max} years`); }

    // Ex-serviceman
    if (criteria.is_ward_of_ex_serviceman && answers.is_ward_of_ex_serviceman === false) { eligible = false; missing.push('Must be ward of ex-serviceman'); }
    if (criteria.min_marks_12th && (answers.marks_12th || 0) < criteria.min_marks_12th) { eligible = false; missing.push(`12th marks must be ≥ ${criteria.min_marks_12th}%`); }

    // Exclusion checks
    for (const excl of scheme.exclusion) {
        if (excl === 'income_tax_payer' && answers.is_income_tax_payer === true) { eligible = false; missing.push('Income tax payers are excluded'); }
        if (excl === 'government_employee' && answers.is_govt_employee === true) { eligible = false; missing.push('Government employees are excluded'); }
        if (excl === 'government_pensioner' && answers.has_other_pension === true) { eligible = false; missing.push('Already receiving government pension'); }
        if (excl === 'already_has_lpg' && answers.has_lpg === true) { eligible = false; missing.push('Already has LPG connection'); }
        if (excl === 'girl_child_above_10' && (answers.girl_child_age || 0) > 10) { eligible = false; missing.push('Girl child must be under 10'); }
        if (excl === 'already_receiving_other_scholarship' && answers.existing_account === true) { eligible = false; missing.push('Already receiving another scholarship'); }
    }

    if (eligible) reasons.push('All eligibility criteria met!');

    return {
        eligible,
        scheme_name: schemeName,
        benefit: scheme.benefit,
        reasons: eligible ? reasons : missing,
        required_documents: scheme.required_documents,
        portal_url: scheme.portal_url,
        message: eligible
            ? `✅ You are eligible for ${scheme.full_name}! Benefit: ${scheme.benefit}`
            : `❌ Not eligible: ${missing.join('; ')}`,
    };
}

/**
 * Generate a form template offline.
 */
export function offlineGenerateForm(schemeName, profile) {
    const scheme = SCHEME_DATA[schemeName];
    if (!scheme) return null;

    const fields = scheme.form_template.map((tpl) => {
        const val = profile[tpl.field_name];
        return {
            ...tpl,
            value: val != null ? String(val) : '',
            filled: val != null,
            confidence: val != null ? 0.9 : 0.0,
        };
    });

    const filled = fields.filter(f => f.filled).length;
    return {
        scheme_name: schemeName,
        form_title: `Application Form — ${schemeName}`,
        fields,
        missing_fields: fields.filter(f => !f.filled).map(f => f.label),
        completion_percentage: Math.round((filled / fields.length) * 100),
        offline: true,
    };
}

/**
 * Compare two or more schemes side by side.
 */
export function compareSchemes(schemeNames) {
    return schemeNames.map(name => {
        const s = SCHEME_DATA[name];
        if (!s) return null;
        return {
            name,
            full_name: s.full_name,
            category: s.category,
            benefit: s.benefit,
            who_can_apply: s.who_can_apply,
            documents_count: s.required_documents.length,
            required_documents: s.required_documents,
            portal_url: s.portal_url,
        };
    }).filter(Boolean);
}

/**
 * Generate offline Action Paths — step-by-step guide to apply for each eligible scheme.
 */
export function offlineActionPaths(eligibleSchemes, profile) {
    const OFFICE_MAP = {
        'Agriculture': { office: 'District Agriculture Office / Krishi Bhawan', officer: 'Block Agriculture Officer (BAO)' },
        'Housing': { office: 'Block Development Office (BDO) / Gram Panchayat', officer: 'Block Development Officer / Sarpanch' },
        'Health': { office: 'Common Service Centre (CSC) / District Hospital', officer: 'CSC Operator / Block Health Officer' },
        'Energy': { office: 'LPG Distributor Office / Block Development Office', officer: 'LPG Dealer / BDO' },
        'Employment': { office: 'Gram Panchayat / Block Development Office', officer: 'Gram Rozgar Sahayak / BDO' },
        'Food': { office: 'Taluka Supply Office / Fair Price Shop', officer: 'Tehsildar / Food Supply Officer' },
        'Financial': { office: 'Nearest Bank Branch / Post Office', officer: 'Bank Manager / Post Master' },
        'Education': { office: 'District Education Office / School', officer: 'District Education Officer / Principal' },
        'Social': { office: 'District Social Welfare Office', officer: 'District Social Welfare Officer' },
    };

    const action_paths = eligibleSchemes.map(s => {
        const scheme = SCHEME_DATA[s.name];
        if (!scheme) return null;
        const cat = scheme.category;
        const officeInfo = OFFICE_MAP[cat] || { office: 'District Collector Office', officer: 'District Collector' };
        const state = profile.state || 'your state';
        const district = profile.district || 'your district';

        return {
            scheme: s.name,
            primary_office: {
                name: `${officeInfo.office}, ${district}`,
                department: cat,
                estimated_distance: 'Local District Block',
                working_hours: 'Monday to Friday, 10:00 AM — 5:00 PM',
                required_desk_or_officer: officeInfo.officer,
                contact: 'Helpline: 1800-XXX-XXXX',
                address_hint: `Located at the central ${district} administrative block`
            },
            estimated_processing_time: '2-4 weeks',
            tips: [
                `Gather all documents: ${(scheme.required_documents || []).slice(0, 3).join(', ')}`,
                `Apply online at ${scheme.portal_url || 'the official portal'} or visit the office`,
                `Always get an acknowledgment receipt upon submission`
            ]
        };
    }).filter(Boolean);

    const general_tips = [
        '📱 Keep your Aadhaar linked to your bank account for Direct Benefit Transfer (DBT)',
        '📄 Always carry original documents AND photocopies',
        '🏛️ Visit during morning hours (10 AM - 12 PM) for quicker service',
        '📞 Call district helpline (1800 series) for toll-free assistance',
        '💻 Many schemes accept online applications — check the portal first',
        '🧾 Always collect an acknowledgment receipt after submitting your form',
    ];

    return { action_paths, general_tips };
}

/**
 * Detect conflicts between eligible schemes offline.
 */
export function offlineConflicts(eligibleSchemes) {
    const CONFLICT_RULES = [
        {
            schemes: ['PM-KISAN', 'MGNREGA (Employment)'],
            type: 'documentation',
            issue: 'Both require updated land records. Ensure your Khasra-Khatauni is current — same document works for both.',
            resolution: 'Get updated land records from the Tehsildar office. One trip covers both schemes.',
            severity: 'low',
        },
        {
            schemes: ['PMAY-G (Housing)', 'PM Ujjwala Yojana (LPG)'],
            type: 'timing',
            issue: 'Both require BPL verification through SECC-2011 data. Processing may overlap at the same office.',
            resolution: 'Apply for both simultaneously at the Block Development Office — same verification covers both.',
            severity: 'low',
        },
        {
            schemes: ['Ayushman Bharat PM-JAY (Health)', 'NFSA (Food Security)'],
            type: 'income_ceiling',
            issue: 'Both have BPL/income requirements. If your family income changes, re-verify eligibility for both.',
            resolution: 'Keep your income certificate updated annually. Both schemes use SECC data.',
            severity: 'medium',
        },
        {
            schemes: ['PM SVANidhi (Street Vendors)', 'PM Mudra Yojana'],
            type: 'overlapping_benefits',
            issue: 'Both provide micro-loans. Banks may flag dual loan applications.',
            resolution: 'Apply for PM SVANidhi first (₹50K), then PM Mudra after repayment for a larger loan.',
            severity: 'medium',
        },
        {
            schemes: ['Sukanya Samriddhi Yojana', 'PM Scholarship Scheme'],
            type: 'duplicate_benefit',
            issue: 'Both target girl child education. Financial benefit overlap possible.',
            resolution: 'SSY is a savings account, Scholarship is a grant — both can be claimed together without conflict.',
            severity: 'low',
        },
    ];

    const eligibleNames = eligibleSchemes.map(s => s.name);
    const detected = [];

    for (const rule of CONFLICT_RULES) {
        const matching = rule.schemes.filter(s => eligibleNames.includes(s));
        if (matching.length >= 2) {
            detected.push({
                schemes: matching,
                type: rule.type,
                issue: rule.issue,
                resolution: rule.resolution,
                severity: rule.severity,
            });
        }
    }

    return detected;
}

/**
 * Generate a 5-year Life Journey roadmap based on profile and eligible schemes.
 */
export function offlineLifeJourney(eligibleSchemes, profile) {
    const currentYear = new Date().getFullYear();
    const age = profile.age || 25;

    const LIFE_EVENTS = [
        { ageRange: [18, 25], event: 'Education & Skill Building', schemes: ['PM Kaushal Vikas Yojana', 'National Scholarship Portal', 'PM Scholarship Scheme'] },
        { ageRange: [20, 35], event: 'Starting a Family', schemes: ['PM Matru Vandana Yojana', 'Sukanya Samriddhi Yojana', 'Beti Bachao Beti Padhao'] },
        { ageRange: [18, 45], event: 'Employment & Livelihood', schemes: ['MGNREGA (Employment)', 'PM Mudra Yojana', 'PM SVANidhi (Street Vendors)', 'Startup India'] },
        { ageRange: [20, 50], event: 'Agriculture & Land', schemes: ['PM-KISAN', 'PM Fasal Bima Yojana', 'Kisan Credit Card', 'Soil Health Card'] },
        { ageRange: [18, 55], event: 'Housing & Energy', schemes: ['PMAY-G (Housing)', 'PM Ujjwala Yojana (LPG)', 'PM Surya Ghar', 'Saubhagya Yojana'] },
        { ageRange: [18, 99], event: 'Health & Food Security', schemes: ['Ayushman Bharat PM-JAY (Health)', 'NFSA (Food Security)'] },
        { ageRange: [18, 40], event: 'Pension Planning', schemes: ['Atal Pension Yojana', 'PM Jeevan Jyoti Bima', 'PM Suraksha Bima'] },
        { ageRange: [55, 99], event: 'Retirement & Senior Care', schemes: ['NSAP Old Age Pension', 'PM Vaya Vandana Yojana'] },
    ];

    const eligibleNames = eligibleSchemes.map(s => s.name);

    const timeline = [];
    for (let y = 0; y < 5; y++) {
        const futureAge = age + y;
        const year = currentYear + y;
        const relevant = LIFE_EVENTS.filter(le =>
            futureAge >= le.ageRange[0] && futureAge <= le.ageRange[1] &&
            le.schemes.some(s => eligibleNames.includes(s))
        );

        if (relevant.length > 0) {
            const le = relevant[y % relevant.length]; // Rotate through events
            const matchingSchemes = le.schemes.filter(s => eligibleNames.includes(s));
            timeline.push({
                year: `${year}`,
                age: futureAge,
                life_event: le.event,
                eligible_schemes: matchingSchemes,
                estimated_benefit: matchingSchemes.map(s => {
                    const sd = SCHEME_DATA[s];
                    return sd ? `${sd.benefit}` : '';
                }).filter(Boolean).join(' + '),
                action_required: `Apply for ${matchingSchemes.join(' and ')} via portal or block office`,
            });
        }
    }

    const recommendations = [
        '📱 Link Aadhaar with your bank account for Direct Benefit Transfer',
        '📄 Keep income & caste certificates updated every year',
        '🏦 Open a Jan Dhan account if you don\'t have one — many schemes require it',
        '👧 If you have a daughter, open Sukanya Samriddhi account before age 10',
        '📞 Call 1800-XXX-XXXX (toll-free) for scheme guidance in your language',
    ];

    return {
        timeline,
        recommendations,
        summary: `Your 5-year roadmap covers ${timeline.length} key milestones based on ${eligibleSchemes.length} eligible schemes.`,
    };
}

export default SCHEME_DATA;

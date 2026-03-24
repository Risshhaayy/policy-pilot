#!/usr/bin/env python3
"""
Generate realistic government scheme PDF documents for PolicyPilot RAG pipeline.
These contain actual clause-level detail modeled on real Indian government schemes.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data", "pdfs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

styles = getSampleStyleSheet()
title_style = ParagraphStyle('SchemeTitle', parent=styles['Title'], fontSize=16, spaceAfter=12, alignment=TA_CENTER)
heading_style = ParagraphStyle('SchemeHeading', parent=styles['Heading2'], fontSize=13, spaceBefore=14, spaceAfter=6)
clause_style = ParagraphStyle('Clause', parent=styles['Normal'], fontSize=10, leading=14, alignment=TA_JUSTIFY, spaceBefore=4, spaceAfter=4)
sub_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, leading=12, leftIndent=20, spaceBefore=2, spaceAfter=2)


def build_pdf(filename, title, sections):
    path = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(path, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
    story = []
    story.append(Paragraph(f"GOVERNMENT OF INDIA", styles['Normal']))
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 12))
    for sec_title, clauses in sections:
        story.append(Paragraph(sec_title, heading_style))
        for clause in clauses:
            story.append(Paragraph(clause, clause_style))
    doc.build(story)
    print(f"✅ Generated: {path}")


# ── SCHEME 1: PM-KISAN ──
build_pdf("pm_kisan.pdf", "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)\nScheme Guidelines — 2024 Revised Edition", [
    ("1. OBJECTIVE", [
        "Clause 1.1: The PM-KISAN scheme provides income support of Rs. 6,000 per year to all landholding farmer families across the country, to supplement their financial needs for procuring various inputs related to agriculture and allied activities as well as domestic needs.",
        "Clause 1.2: The financial benefit of Rs. 6,000 per year is transferred in three equal installments of Rs. 2,000 each, directly into the bank accounts of eligible farmer families every four months.",
        "Clause 1.3: The scheme is a Central Sector Scheme with 100% funding from the Government of India.",
    ]),
    ("2. DEFINITIONS", [
        "Clause 2.1: 'Farmer Family' is defined as a family comprising of husband, wife, and minor children (below 18 years of age) who collectively own cultivable land as per the land records of the concerned State or Union Territory.",
        "Clause 2.2: 'Cultivable land' means land that is used or can be used for agricultural purposes as recorded in the revenue records of the State/UT.",
        "Clause 2.3: 'Small and Marginal Farmer' means a farmer family owning cultivable land up to 2 hectares.",
    ]),
    ("3. ELIGIBILITY CRITERIA", [
        "Clause 3.1: All landholding farmer families are eligible under the scheme, irrespective of the size of their landholdings.",
        "Clause 3.2: The cultivable land MUST be registered in the name of the applicant or their spouse in the official land records of the State/UT. Land held by institutions, trusts, or corporate bodies shall NOT qualify.",
        "Clause 3.3: The applicant must be a citizen of India.",
        "Clause 3.4: The applicant must have a valid Aadhaar card linked to a bank account.",
        "Clause 3.5: The farmer family must not fall under any of the exclusion categories listed in Section 4.",
    ]),
    ("4. EXCLUSION CATEGORIES", [
        "Clause 4.1: The following categories of beneficiaries of higher economic status shall NOT be eligible for the scheme:",
        "Clause 4.1(a): All institutional landholders.",
        "Clause 4.1(b): Farmer families in which one or more members belong to the following categories: (i) Former and present holders of constitutional posts, (ii) Former and present Ministers/State Ministers, (iii) Former and present Members of Lok Sabha/Rajya Sabha/State Legislative Assemblies/State Legislative Councils.",
        "Clause 4.1(c): Former and present Mayors/Chairpersons of District Panchayats.",
        "Clause 4.1(d): All serving or retired officers and employees of Central/State Government Ministries, including contractual employees, excluding Multi Tasking Staff/Class IV/Group D employees.",
        "Clause 4.1(e): All persons who have paid income tax in the last assessment year.",
        "Clause 4.1(f): Professionals such as Doctors, Engineers, Lawyers, Chartered Accountants, and Architects registered with professional bodies and carrying out profession by undertaking practices.",
        "Clause 4.1(g): All retired/pensioners whose monthly pension is Rs. 10,000 or more (excluding Multi Tasking Staff/Class IV/Group D employees).",
    ]),
    ("5. APPLICATION PROCESS", [
        "Clause 5.1: Eligible farmers can register through (a) Common Service Centres (CSC), (b) State designated nodal officers, or (c) the PM-KISAN online portal at pmkisan.gov.in.",
        "Clause 5.2: Required documents: (i) Aadhaar card, (ii) Land ownership records (khata/khasra), (iii) Bank passbook with IFSC code.",
        "Clause 5.3: After registration, verification is performed by the State/UT government agencies. Upon successful verification, the first installment is released within 30 working days.",
        "Clause 5.4: Farmers can check their application status on the PM-KISAN portal using their Aadhaar number or registered mobile number.",
    ]),
    ("6. BENEFIT AMOUNT AND DISBURSEMENT", [
        "Clause 6.1: Total annual benefit: Rs. 6,000 per eligible farmer family.",
        "Clause 6.2: Disbursement schedule: (i) April–July: Rs. 2,000, (ii) August–November: Rs. 2,000, (iii) December–March: Rs. 2,000.",
        "Clause 6.3: The benefit is credited directly to the bank account linked with the Aadhaar card of the beneficiary (Direct Benefit Transfer — DBT).",
    ]),
    ("7. STATE-SPECIFIC PROVISIONS", [
        "Clause 7.1: State governments may provide additional top-up benefits over and above the Central government benefit of Rs. 6,000.",
        "Clause 7.2: In case of any conflict between Central and State provisions, the State-level provisions shall be treated as supplementary, and the Central provisions shall prevail for the base benefit.",
    ]),
])


# ── SCHEME 2: PM AWAS YOJANA (GRAMIN) ──
build_pdf("pmay_gramin.pdf", "Pradhan Mantri Awas Yojana — Gramin (PMAY-G)\nScheme Guidelines — 2024 Revised Edition", [
    ("1. OBJECTIVE", [
        "Clause 1.1: PMAY-G aims to provide a pucca house with basic amenities to all houseless householders and those living in kutcha and dilapidated houses in rural areas by the year 2024.",
        "Clause 1.2: The unit assistance under PMAY-G is Rs. 1,20,000 in plain areas and Rs. 1,30,000 in hilly states, difficult areas, and Integrated Action Plan (IAP) districts.",
        "Clause 1.3: The beneficiary is entitled to 90 days of unskilled labour from MGNREGA in addition to the unit assistance.",
    ]),
    ("2. ELIGIBILITY CRITERIA", [
        "Clause 2.1: Beneficiaries are identified from the Socio-Economic and Caste Census (SECC) 2011 data, verified by the Gram Sabha.",
        "Clause 2.2: The applicant must belong to a household that is houseless or living in a house with kutcha roof and kutcha wall, as per SECC 2011 data.",
        "Clause 2.3: Priority categories: (a) households with no adult member between age 16 and 59, (b) female-headed households with no adult male member between 16 and 59, (c) households with differently-abled members and no able-bodied adult member, (d) SC/ST households, (e) households with no literate adult above 25 years, (f) landless households deriving major part of income from manual casual labour.",
        "Clause 2.4: Annual household income must NOT exceed Rs. 3,00,000 per year as verified by income certificate from competent authority.",
        "Clause 2.5: Applicant must NOT own a pucca house in their own name or in the name of any family member anywhere in India.",
        "Clause 2.6: Applicant must be a citizen of India with valid Aadhaar identification.",
    ]),
    ("3. EXCLUSION CRITERIA", [
        "Clause 3.1: Households excluded from SECC-identified list include: (a) households owning motorized two/three/four-wheelers, fishing boats, (b) households owning mechanized farm equipment, (c) households with any member as a government employee.",
        "Clause 3.2: Any household member who is an income tax payee is excluded.",
        "Clause 3.3: Households owning a refrigerator are excluded.",
        "Clause 3.4: Households with landline phones are excluded.",
        "Clause 3.5: Households owning more than 2.5 acres of irrigated land with at least one irrigation equipment are excluded.",
    ]),
    ("4. APPLICATION PROCESS", [
        "Clause 4.1: Selection of beneficiaries is done by the Gram Panchayat based on SECC-2011 data, approved by the Gram Sabha.",
        "Clause 4.2: Required documents: (i) Aadhaar card, (ii) BPL certificate or SECC verification, (iii) Income certificate, (iv) Caste certificate (if applicable), (v) Bank account details.",
        "Clause 4.3: Application can be submitted at the Block Development Office (BDO) or through the AwaasSoft portal.",
        "Clause 4.4: Geo-tagging of house construction is mandatory at three stages: (i) foundation, (ii) lintel level, (iii) completion.",
    ]),
    ("5. FUND DISBURSEMENT", [
        "Clause 5.1: The assistance is provided in installments linked to construction milestones verified through geo-tagged photographs.",
        "Clause 5.2: First installment: Rs. 40,000 (at sanction/foundation stage), Second installment: Rs. 40,000 (at lintel level), Third installment: Rs. 40,000 (at completion).",
        "Clause 5.3: Funds are transferred directly to the beneficiary's Aadhaar-linked bank account through DBT.",
    ]),
    ("6. CONFLICT WITH OTHER HOUSING SCHEMES", [
        "Clause 6.1: A beneficiary of PMAY-G CANNOT simultaneously avail benefits under any other Central/State government housing scheme. If a beneficiary is found to have received housing assistance under another scheme, the PMAY-G benefit shall be recovered.",
        "Clause 6.2: State-level housing schemes (e.g., Gujarat Valmiki Ambedkar Awas Yojana, Indiramma Housing Scheme in Telangana) may be availed ONLY if the state scheme is designed as a top-up over PMAY-G and explicitly permits convergence.",
    ]),
])


# ── SCHEME 3: AYUSHMAN BHARAT (PM-JAY) ──
build_pdf("ayushman_bharat.pdf", "Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (PM-JAY)\nScheme Guidelines — 2024 Edition", [
    ("1. OBJECTIVE", [
        "Clause 1.1: PM-JAY provides health coverage of Rs. 5,00,000 per family per year for secondary and tertiary care hospitalization to identified vulnerable families.",
        "Clause 1.2: The scheme is an entitlement-based scheme with entitlement decided on the basis of deprivation and occupational criteria as per SECC 2011 database for rural areas and occupational categories for urban areas.",
    ]),
    ("2. ELIGIBILITY CRITERIA", [
        "Clause 2.1: For rural areas — families identified based on any one of the following seven deprivation criteria from SECC 2011: (a) Only one room with kutcha walls and roof, (b) No adult member between 16–59, (c) Female-headed household with no adult male between 16–59, (d) Differently-abled member with no able-bodied member, (e) SC/ST households, (f) Landless households, (g) Destitute/living on alms/manual scavenger/primitive tribal group/legally released bonded labour.",
        "Clause 2.2: For urban areas — workers belonging to the following 11 occupational categories: rag picker, beggar, domestic worker, street vendor, construction worker, plumber, mason, painter, welder, security guard, coolie/porter.",
        "Clause 2.3: There is NO cap on family size. All members of an eligible family are covered.",
        "Clause 2.4: There is NO age restriction for beneficiaries.",
        "Clause 2.5: Existing beneficiaries of RSBY (Rashtriya Swasthya Bima Yojana) who are NOT in the SECC database are also included.",
    ]),
    ("3. BENEFITS AND COVERAGE", [
        "Clause 3.1: Coverage of up to Rs. 5,00,000 per family per year on a floater basis (shared among all family members).",
        "Clause 3.2: Coverage includes: pre-hospitalization (3 days), hospitalization, post-hospitalization expenses (15 days), diagnostics, medicines, and complications arising during treatment.",
        "Clause 3.3: All pre-existing conditions are covered from day one of enrollment.",
        "Clause 3.4: The scheme covers approximately 1,929 medical and surgical procedures including oncology, cardiology, neurosurgery, and orthopedics.",
    ]),
    ("4. EXCLUSION CRITERIA", [
        "Clause 4.1: Families NOT identified in the SECC 2011 database (for rural) or NOT belonging to the listed occupational categories (for urban) are NOT eligible.",
        "Clause 4.2: The following are NOT covered: OPD treatment, fertility treatments, cosmetic procedures, organ transplant (non-life-threatening), and drug rehabilitation.",
        "Clause 4.3: Individual health insurance policies or employer-provided insurance do NOT disqualify a person from PM-JAY.",
    ]),
    ("5. APPLICATION AND ENROLLMENT", [
        "Clause 5.1: Eligible families can check their eligibility by: (a) visiting the PM-JAY website mera.pmjay.gov.in, (b) calling the toll-free helpline 14555, (c) visiting the nearest Ayushman Bharat Health and Wellness Centre or empaneled hospital.",
        "Clause 5.2: Required documents: (i) Aadhaar card or any valid government-issued ID, (ii) Ration card, (iii) SECC verification slip.",
        "Clause 5.3: Enrollment is FREE. No premium or enrollment fee is charged from the beneficiary.",
        "Clause 5.4: A beneficiary can avail treatment at any empaneled hospital across India (portability).",
    ]),
    ("6. CONFLICT WITH OTHER HEALTH SCHEMES", [
        "Clause 6.1: PM-JAY benefits can be availed IN ADDITION TO state health insurance schemes, provided the state has signed a MoU with the central government for convergence.",
        "Clause 6.2: If a state has its own health scheme with coverage exceeding Rs. 5,00,000, the state scheme takes precedence, and PM-JAY acts as a supplementary cover.",
        "Clause 6.3: Simultaneous claims under PM-JAY and any private health insurance are NOT permitted for the same hospitalization episode. The beneficiary must choose one.",
    ]),
])


# ── SCHEME 4: PM UJJWALA YOJANA ──
build_pdf("pm_ujjwala.pdf", "Pradhan Mantri Ujjwala Yojana (PMUY)\nScheme Guidelines — 2024 Revised Edition", [
    ("1. OBJECTIVE", [
        "Clause 1.1: PMUY aims to provide LPG (Liquefied Petroleum Gas) connections to women from Below Poverty Line (BPL) households to safeguard women and children from health hazards associated with cooking based on fossil fuels.",
        "Clause 1.2: Under PMUY 2.0, the government provides a deposit-free LPG connection with a subsidy of Rs. 1,600 per connection for the purchase of hot plate and first refill.",
    ]),
    ("2. ELIGIBILITY CRITERIA", [
        "Clause 2.1: The applicant MUST be a woman of at least 18 years of age.",
        "Clause 2.2: The applicant must belong to a Below Poverty Line (BPL) household as identified under the SECC 2011 data.",
        "Clause 2.3: The household must NOT already have an LPG connection in the name of any family member.",
        "Clause 2.4: Under PMUY 2.0, the following additional categories are eligible: (a) SC/ST households, (b) beneficiaries of PMAY-G, (c) beneficiaries of Antyodaya Anna Yojana (AAY), (d) Forest dwellers, (e) Most Backward Classes (MBC), (f) Tea and ex-Tea garden tribes, (g) people residing in river islands.",
        "Clause 2.5: Adult women of eligible households must have a valid Aadhaar card and a Jan Dhan or any nationalized bank account.",
        "Clause 2.6: Annual household income must NOT exceed Rs. 2,50,000.",
    ]),
    ("3. DOCUMENTS REQUIRED", [
        "Clause 3.1: Required documents: (i) BPL certificate or SECC data proof, (ii) Aadhaar card of the applicant (woman), (iii) BPL ration card, (iv) Passport-size photograph, (v) Bank account details.",
        "Clause 3.2: In case of migrant workers, address proof from the current area of residence may be accepted along with a self-declaration.",
    ]),
    ("4. APPLICATION PROCESS", [
        "Clause 4.1: Application can be submitted at the nearest LPG distributor (HP, Bharatgas, Indane) or through the PMUY online portal.",
        "Clause 4.2: Upon verification, the LPG connection is sanctioned within 15 working days.",
        "Clause 4.3: The first LPG cylinder and regulator are provided free of cost. Subsequent refills are available at subsidized rates under PAHAL (DBTL) scheme.",
    ]),
    ("5. CONFLICT WITH OTHER FUEL SUBSIDY SCHEMES", [
        "Clause 5.1: Beneficiaries of PMUY who also receive kerosene allocation under PDS shall have their kerosene entitlement reduced proportionally upon receiving LPG connection.",
        "Clause 5.2: PMUY benefit CANNOT be combined with any other Central or State LPG subsidy scheme. If found availing dual benefits, the PMUY subsidy may be recovered.",
    ]),
])


# ── SCHEME 5: MGNREGA ──
build_pdf("mgnrega.pdf", "Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)\nScheme Guidelines — 2024 Operational Edition", [
    ("1. OBJECTIVE AND LEGAL FRAMEWORK", [
        "Clause 1.1: MGNREGA guarantees at least 100 days of wage employment in a financial year to every rural household whose adult members volunteer to do unskilled manual work.",
        "Clause 1.2: The scheme is a demand-driven, rights-based programme. Employment must be provided within 15 days of receipt of application, failing which the applicant is entitled to an unemployment allowance.",
        "Clause 1.3: The wage rate shall not be less than Rs. 267 per day (2024 rate, varies by state). State-specific wage rates: Gujarat: Rs. 311, Maharashtra: Rs. 310, Rajasthan: Rs. 252, Uttar Pradesh: Rs. 230, Kerala: Rs. 331.",
    ]),
    ("2. ELIGIBILITY CRITERIA", [
        "Clause 2.1: Every adult member of a rural household may apply for employment. 'Adult' means a person who has completed 18 years of age.",
        "Clause 2.2: The applicant must be a resident of the Gram Panchayat where the application is made.",
        "Clause 2.3: The applicant must be willing to do unskilled manual work.",
        "Clause 2.4: There is NO income criterion — any rural household can apply regardless of income level.",
        "Clause 2.5: Both men and women are eligible. At least one-third of beneficiaries shall be women (priority).",
    ]),
    ("3. JOB CARD AND REGISTRATION", [
        "Clause 3.1: Every eligible household must first obtain a Job Card from the Gram Panchayat.",
        "Clause 3.2: Required documents for Job Card: (i) Application form, (ii) Aadhaar card of all adult household members, (iii) Two passport-size photographs per member, (iv) Proof of residence (ration card or voter ID).",
        "Clause 3.3: The Job Card must be issued within 15 days of application and is valid for 5 years.",
        "Clause 3.4: The Job Card contains photographs, demographic details, and a record of employment provided.",
    ]),
    ("4. EMPLOYMENT PROVISION", [
        "Clause 4.1: Employment must be provided within 5 km radius of the applicant's residence. If work is provided beyond 5 km, additional transportation and living expenses (10% of wage) shall be paid.",
        "Clause 4.2: If employment is not provided within 15 days of application, the applicant is entitled to unemployment allowance at rates prescribed by the State: not less than 25% of the wage rate for the first 30 days and not less than 50% thereafter.",
        "Clause 4.3: Worksite facilities must include: drinking water, shade, first-aid kit, and crèche (if more than 5 children below 6 years are present).",
    ]),
    ("5. WAGES AND PAYMENT", [
        "Clause 5.1: Wages are paid on a weekly basis or not later than a fortnight after the date on which work was done.",
        "Clause 5.2: Payment is made directly into the worker's Aadhaar-linked bank/post office account through DBT.",
        "Clause 5.3: Delay in wage payment beyond 15 days attracts compensation at the rate of 0.05% of unpaid wages per day.",
    ]),
    ("6. CONVERGENCE WITH OTHER SCHEMES", [
        "Clause 6.1: MGNREGA can be converged with PMAY-G (housing), where 90 days of unskilled labour under MGNREGA can be used for construction of the PMAY-G house.",
        "Clause 6.2: MGNREGA wages are SEPARATE from and IN ADDITION TO the PMAY-G unit assistance. Both benefits can be simultaneously availed.",
        "Clause 6.3: MGNREGA CANNOT be combined with PM-KISAN for the same period — a farmer cannot claim MGNREGA wages for days when PM-KISAN installment covers agriculture-related activities on their own land. However, PM-KISAN and MGNREGA can be availed in different time periods.",
    ]),
])


# ── SCHEME 6: NATIONAL FOOD SECURITY ACT ──
build_pdf("nfsa.pdf", "National Food Security Act (NFSA) 2013\nPublic Distribution System Guidelines — 2024 Revised", [
    ("1. OBJECTIVE", [
        "Clause 1.1: The NFSA aims to provide food and nutritional security by ensuring access to adequate quantity of quality food at affordable prices for people to live a life with dignity.",
        "Clause 1.2: Under NFSA, up to 75% of rural population and 50% of urban population are entitled to receive subsidized foodgrains through the Targeted Public Distribution System (TPDS).",
    ]),
    ("2. ELIGIBILITY AND ENTITLEMENTS", [
        "Clause 2.1: Eligible households are identified in two categories: (a) Antyodaya Anna Yojana (AAY) — 35 kg of foodgrains per household per month, (b) Priority Households (PHH) — 5 kg of foodgrains per person per month.",
        "Clause 2.2: AAY Eligibility: Households with (i) landless agricultural labourers, (ii) marginal farmers, (iii) rural artisans such as potters, (iv) widows, (v) terminally ill persons, (vi) disabled persons, (vii) persons aged 60 years or above with no assured means of subsistence, (viii) all primitive tribal households.",
        "Clause 2.3: PHH Eligibility: Identified by State governments using criteria such as income (below Rs. 1,00,000 per annum for urban, Rs. 80,000 for rural), social indicators, and vulnerability markers.",
        "Clause 2.4: Prices: Rice at Rs. 3/kg, Wheat at Rs. 2/kg, Coarse grains at Rs. 1/kg.",
    ]),
    ("3. APPLICATION PROCESS", [
        "Clause 3.1: Application for ration card under NFSA can be made at the Taluka/Block Supply Office or through the state food department portal.",
        "Clause 3.2: Required documents: (i) Aadhaar card of all family members, (ii) Income certificate, (iii) Residence proof, (iv) Caste certificate (if applicable), (v) Two photographs of the head of household.",
        "Clause 3.3: Ration cards are issued within 30 days of verified application.",
    ]),
    ("4. EXCLUSION CRITERIA", [
        "Clause 4.1: Households with annual income exceeding Rs. 3,00,000 (for AAY) or Rs. 1,00,000 urban / Rs. 80,000 rural (for PHH) are excluded.",
        "Clause 4.2: Government employees (excluding Class IV and contractual staff) are excluded from AAY but may qualify for PHH based on income.",
        "Clause 4.3: Income tax payees are excluded from all NFSA entitlements.",
    ]),
    ("5. CONFLICT WITH OTHER FOOD PROGRAMS", [
        "Clause 5.1: Beneficiaries of NFSA/TPDS CANNOT simultaneously avail subsidized foodgrains under any other Central food distribution scheme (e.g., Annapurna scheme) for the same entitlement period.",
        "Clause 5.2: Mid-Day Meal Scheme (MDMS) and ICDS (Integrated Child Development Services) can be availed IN ADDITION TO NFSA entitlements as they target different demographics (children) within the same household.",
    ]),
])

print("\n✅ All 6 government scheme PDFs generated!")

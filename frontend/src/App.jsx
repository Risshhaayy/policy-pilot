import React, { useState, useRef, useEffect, useCallback } from 'react'
import { addToQueue, getQueue, syncQueuedForms, cacheResult, getCachedResult } from './offlineStore'
import SCHEME_DATA, { offlineEligibilityCheck, offlineGenerateForm, checkSchemeEligibility, compareSchemes, SCHEME_CATEGORIES, offlineActionPaths, offlineConflicts, offlineLifeJourney } from './schemeData'
import { translations } from './translations'

const API_BASE = '/api'

const DOC_TYPE_LABELS = {
    aadhaar: 'Aadhaar Card',
    income_cert: 'Income Certificate',
    land_records: 'Land Records / Khasra-Khatauni',
    bank_passbook: 'Bank Passbook / Cancelled Cheque',
    ration_card: 'Ration Card',
    bpl_cert: 'BPL Certificate',
    caste_cert: 'Caste Certificate',
    voter_id: 'Voter ID',
    other: 'Other Document',
}

// ─── ICONS (inline SVG) ───
const Icons = {
    mic: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>,
    send: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>,
    check: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>,
    x: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>,
    alert: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>,
    upload: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>,
    file: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>,
    star: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    calendar: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>,
    globe: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>,
    shield: <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#shield-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><defs><linearGradient id="shield-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#3381ff" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient></defs><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>,
    arrow: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>,
}

// ─── LOADING SPINNER ───
function Spinner({ text = 'Analyzing...' }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-primary-800 opacity-30" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <p className="text-text-muted text-sm animate-pulse">{text}</p>
        </div>
    )
}

// ─── LANDING PAGE ───

// ─── EXPLORE SCHEMES PAGE ───
function ExploreSchemes({ onSelectScheme, onBack, onDiscover, lang }) {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const [activeState, setActiveState] = useState('All India')
    const allSchemes = Object.entries(SCHEME_DATA)
    const t = (path) => path.split('.').reduce((obj, key) => obj?.[key], translations[lang]) || path

    const statesTranslate = t('common.states')
    const INDIAN_STATES = [
        { id: 'All India', label: statesTranslate.all },
        { id: 'Gujarat', label: statesTranslate.gujarat },
        { id: 'Maharashtra', label: statesTranslate.maharashtra },
        { id: 'Rajasthan', label: statesTranslate.rajasthan },
        { id: 'Uttar Pradesh', label: statesTranslate.up },
        { id: 'Bihar', label: statesTranslate.bihar },
        { id: 'Madhya Pradesh', label: statesTranslate.mp },
        { id: 'Tamil Nadu', label: statesTranslate.tn },
        { id: 'Karnataka', label: statesTranslate.karnataka },
        { id: 'Kerala', label: statesTranslate.kerala },
        { id: 'West Bengal', label: statesTranslate.wb },
        { id: 'Punjab', label: statesTranslate.punjab },
        { id: 'Haryana', label: statesTranslate.haryana },
        { id: 'Odisha', label: statesTranslate.odisha },
        { id: 'Assam', label: statesTranslate.assam }
    ];

    const filtered = allSchemes.filter(([key, scheme]) => {
        const matchesSearch = !search || key.toLowerCase().includes(search.toLowerCase()) || scheme.full_name.toLowerCase().includes(search.toLowerCase()) || scheme.description.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = activeCategory === 'All' || scheme.category === activeCategory
        const matchesState = activeState === 'All India' || !scheme.state || scheme.state === 'All India' || scheme.state === activeState
        return matchesSearch && matchesCategory && matchesState
    })

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-border/50 backdrop-blur-md bg-surface/80 sticky top-0 z-50">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
                    {Icons.shield}
                    <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">PolicyPilot</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-sm text-text-muted hover:text-text transition-colors">← {t('common.back')}</button>
                    <button onClick={onDiscover} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-white text-sm font-medium transition-all">{t('discover.title')}</button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 w-full">
                <div className="text-center mb-8">
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                        {t('explore.title').split('Government')[0]} <span className="text-primary-400">{t('explore.title').includes('Government') ? 'Government' : ''}</span> {t('explore.title').includes('Government') ? t('explore.title').split('Government')[1] : t('explore.title')}
                    </h1>
                    <p className="text-text-muted max-w-xl mx-auto">{t('explore.subtitle')}</p>
                </div>

                {/* Search */}
                <div className="glass-card p-4 mb-6">
                    <input
                        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('explore.searchPlaceholder')}
                        className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary-600 transition-all"
                    />
                </div>

                {/* State Filter */}
                <div className="flex flex-wrap gap-2 mb-4 items-center pl-1">
                    <span className="text-sm font-medium text-text-muted mr-1">📍 {t('explore.stateLabel')}</span>
                    <select
                        value={activeState}
                        onChange={(e) => setActiveState(e.target.value)}
                        className="bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary-600 transition-all font-medium min-w-[150px]"
                    >
                        {INDIAN_STATES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button onClick={() => setActiveCategory('All')}
                        className={`explore-filter-pill ${activeCategory === 'All' ? 'explore-filter-active' : ''}`}>{t('explore.all')} ({allSchemes.length})</button>
                    {SCHEME_CATEGORIES.map(cat => {
                        const count = allSchemes.filter(([, s]) => s.category === cat).length
                        return (
                            <button key={cat} onClick={() => setActiveCategory(cat)}
                                className={`explore-filter-pill ${activeCategory === cat ? 'explore-filter-active' : ''}`}>
                                {cat} ({count})
                            </button>
                        )
                    })}
                </div>

                {/* Scheme Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(([key, scheme]) => (
                        <div key={key} className="explore-card" onClick={() => onSelectScheme(key)}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl">{scheme.icon}</span>
                                <div>
                                    <h3 className="font-display font-semibold text-base">{key}</h3>
                                    <span className="text-xs text-primary-400 font-medium">{scheme.category}</span>
                                </div>
                            </div>
                            <p className="text-sm text-text-muted mb-3 line-clamp-2">{scheme.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-success-400 font-medium">{scheme.benefit.split('(')[0].trim()}</span>
                                <span className="text-xs text-primary-400 flex items-center gap-1">{t('explore.checkEligibility')} {Icons.arrow}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-12 text-text-muted">
                        <p className="text-4xl mb-3">🔍</p>
                        <p>No schemes found matching "{search}"</p>
                    </div>
                )}
            </div>
        </div>
    )
}


// ─── SCHEME DETAIL PAGE ───
function SchemeDetail({ schemeName, onBack, onApply }) {
    const scheme = SCHEME_DATA[schemeName]

    // Apply flow state
    const [step, setStep] = useState('info') // info | apply
    const [uploadedDocs, setUploadedDocs] = useState([])
    const [uploading, setUploading] = useState(false)
    const [formFields, setFormFields] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitResult, setSubmitResult] = useState(null)
    const [showCompare, setShowCompare] = useState(false)

    const t = (path) => path.split('.').reduce((obj, key) => obj?.[key], translations[lang]) || path
    if (!scheme) return <div className="p-8 text-center text-text-muted">{t('common.error')}</div>

    const handleAnswer = (id, value) => {
        setAnswers(prev => ({ ...prev, [id]: value }))
        setResult(null)
    }

    const handleCheckEligibility = () => {
        const res = checkSchemeEligibility(schemeName, answers)
        setResult(res)
    }

    // Initialize form fields from template
    const initFormFields = () => {
        const fields = scheme.form_template.map(tpl => ({ ...tpl, value: '', filled: false }))
        setFormFields(fields)
        setStep('apply')
    }

    // Handle doc upload — sends to backend for AI extraction
    const handleDocUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('doc_type', 'auto')

        try {
            const res = await fetch('/api/upload-document', { method: 'POST', body: formData })
            const data = await res.json()

            const docEntry = { name: file.name, type: file.type, extractedFields: data.extracted_fields || {} }
            setUploadedDocs(prev => [...prev, docEntry])

            // Auto-fill form fields with extracted data
            if (data.extracted_fields && formFields) {
                setFormFields(prev => prev.map(field => {
                    const extracted = data.extracted_fields[field.field_name]
                    if (extracted && !field.value) {
                        return { ...field, value: String(extracted), filled: true, autoFilled: true }
                    }
                    return field
                }))
            }
        } catch (err) {
            // Offline: just record the document
            setUploadedDocs(prev => [...prev, { name: file.name, type: file.type, extractedFields: {}, offline: true }])
        } finally {
            setUploading(false)
        }
    }

    // Handle drag and drop
    const handleDrop = (e) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) {
            const input = document.createElement('input')
            input.type = 'file'
            const dt = new DataTransfer()
            dt.items.add(file)
            input.files = dt.files
            handleDocUpload({ target: input })
        }
    }

    // Update a form field manually
    const handleFieldChange = (index, value) => {
        setFormFields(prev => prev.map((f, i) => i === index ? { ...f, value, filled: !!value } : f))
    }

    // Submit form
    const handleSubmitForm = async () => {
        setSubmitting(true)
        const payload = {
            scheme_name: schemeName,
            form_fields: formFields,
            uploaded_documents: uploadedDocs.map(d => d.name),
        }
        try {
            const res = await fetch('/api/form/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            setSubmitResult(data)
        } catch (err) {
            try {
                await saveForm(payload)
                setSubmitResult({
                    success: true,
                    message: t('formSuccess.queued'),
                    receipt: { receipt_id: `OFFLINE-${Date.now().toString(36).toUpperCase()}`, scheme_name: schemeName, status: t('formSuccess.queuedStatus') },
                })
            } catch (e) {
                setSubmitResult({ success: false, message: t('formSuccess.saveError') })
            }
        } finally {
            setSubmitting(false)
        }
    }

    const relatedSchemes = Object.keys(SCHEME_DATA).filter(k => k !== schemeName && SCHEME_DATA[k].category === scheme.category)
    const comparisonData = showCompare ? compareSchemes([schemeName, ...relatedSchemes.slice(0, 2)]) : []
    const allAnswered = scheme.eligibility_questions.every(q => answers[q.id] !== undefined && answers[q.id] !== '')

    // Form completion stats
    const filledCount = formFields ? formFields.filter(f => f.value && String(f.value).trim()).length : 0
    const totalFields = formFields ? formFields.length : 0
    const requiredFilled = formFields ? formFields.filter(f => f.required).every(f => f.value && String(f.value).trim()) : false
    const completionPct = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-border/50 backdrop-blur-md bg-surface/80 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    {Icons.shield}
                    <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">PolicyPilot</span>
                </div>
                <button onClick={step === 'apply' ? () => setStep('eligibility') : onBack} className="text-sm text-text-muted hover:text-text transition-colors flex items-center gap-1">
                    ← {step === 'apply' ? t('detail.backToDetails') : t('detail.backToExplore')}
                </button>
            </nav>

            <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 w-full space-y-6">
                {/* Scheme Header */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-5xl">{scheme.icon}</span>
                        <div>
                            <span className="text-xs text-primary-400 font-medium">{scheme.category}</span>
                            <h1 className="font-display text-2xl md:text-3xl font-bold">{scheme.full_name}</h1>
                            <p className="text-text-muted text-sm mt-1">{scheme.description}</p>
                        </div>
                    </div>
                    {step === 'eligibility' && (
                        <div className="grid md:grid-cols-3 gap-4 mt-4">
                            <div className="bg-surface-light/50 rounded-xl p-3">
                                <p className="text-xs text-text-muted">💰 Benefit</p>
                                <p className="text-sm font-semibold text-success-400">{scheme.benefit}</p>
                            </div>
                            <div className="bg-surface-light/50 rounded-xl p-3">
                                <p className="text-xs text-text-muted">👤 Who Can Apply</p>
                                <p className="text-sm">{scheme.who_can_apply}</p>
                            </div>
                            <div className="bg-surface-light/50 rounded-xl p-3">
                                <p className="text-xs text-text-muted">📅 Deadline</p>
                                <p className="text-sm">{scheme.deadline}</p>
                            </div>
                        </div>
                    )}
                    {step === 'apply' && (
                        <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary-600 to-success-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                            </div>
                            <span className="text-xs text-text-muted font-medium">{completionPct}% {t('detail.complete')}</span>
                        </div>
                    )}
                </div>

                {/* ══════════ STEP 1: ELIGIBILITY ══════════ */}
                {step === 'eligibility' && (
                    <>
                        {/* Required Documents */}
                        <div className="glass-card p-5">
                            <h3 className="font-display font-semibold mb-3">📎 {t('detail.requiredDocs')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {scheme.required_documents.map((doc, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-surface-light border border-border rounded-lg text-xs text-text-muted">{doc}</span>
                                ))}
                            </div>
                        </div>

                        {/* Eligibility Questionnaire */}
                        <div className="glass-card p-6">
                            <h3 className="font-display font-semibold text-lg mb-1">🎯 {t('detail.checkEligibility')}</h3>
                            <p className="text-xs text-text-muted mb-5">{t('detail.eligibilitySubtitle')}</p>

                            <div className="space-y-4">
                                {scheme.eligibility_questions.map((q) => (
                                    <div key={q.id} className="eligibility-question">
                                        <label className="text-sm font-medium mb-2 block">{q.label}</label>
                                        {q.type === 'boolean' ? (
                                            <div className="flex gap-3">
                                                <button onClick={() => handleAnswer(q.id, true)}
                                                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${answers[q.id] === true ? 'bg-success-500/20 border border-success-500 text-success-400' : 'bg-surface-light border border-border text-text-muted hover:border-primary-600'}`}>
                                                    {t('detail.yes')}
                                                </button>
                                                <button onClick={() => handleAnswer(q.id, false)}
                                                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${answers[q.id] === false ? 'bg-danger-500/20 border border-danger-500 text-danger-400' : 'bg-surface-light border border-border text-text-muted hover:border-primary-600'}`}>
                                                    {t('detail.no')}
                                                </button>
                                            </div>
                                        ) : q.type === 'number' ? (
                                            <input type="number" value={answers[q.id] || ''} onChange={(e) => handleAnswer(q.id, parseFloat(e.target.value) || 0)}
                                                className="w-full md:w-64 px-3 py-2 bg-surface-light border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-600" placeholder={t('detail.enterValue')} />
                                        ) : q.type === 'select' ? (
                                            <select value={answers[q.id] || ''} onChange={(e) => handleAnswer(q.id, e.target.value)}
                                                className="w-full md:w-64 px-3 py-2 bg-surface-light border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-600">
                                                <option value="">{t('detail.select')}</option>
                                                {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : null}
                                    </div>
                                ))}
                            </div>

                            <button onClick={handleCheckEligibility} disabled={!allAnswered}
                                className={`mt-6 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${allAnswered ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white hover:shadow-lg hover:shadow-primary-600/30' : 'bg-surface-light border border-border text-text-muted cursor-not-allowed opacity-60'}`}>
                                🎯 Check Eligibility
                            </button>
                        </div>

                        {/* Eligibility Result */}
                        {result && (
                            <div className={`glass-card p-6 border-l-4 ${result.eligible ? 'border-l-success-500' : 'border-l-danger-500'}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-4xl">{result.eligible ? '🎉' : '😔'}</span>
                                    <div>
                                        <h3 className={`font-display font-bold text-xl ${result.eligible ? 'text-success-400' : 'text-danger-400'}`}>
                                            {result.eligible ? 'You Are Eligible!' : 'Not Eligible'}
                                        </h3>
                                        <p className="text-sm text-text-muted">{result.message}</p>
                                    </div>
                                </div>

                                {result.eligible && (
                                    <div className="mt-4 space-y-3">
                                        <div className="bg-success-500/5 border border-success-500/20 rounded-xl p-4">
                                            <p className="text-xs text-text-muted mb-1">Your Benefit</p>
                                            <p className="text-lg font-bold text-success-400">{result.benefit}</p>
                                        </div>
                                        <button onClick={initFormFields}
                                            className="w-full px-6 py-3.5 bg-gradient-to-r from-success-600 to-success-500 hover:from-success-500 hover:to-success-400 rounded-xl text-white font-semibold transition-all hover:shadow-xl hover:shadow-success-600/30 flex items-center justify-center gap-2">
                                            📝 Apply Now — Upload Documents & Fill Form {Icons.arrow}
                                        </button>
                                    </div>
                                )}

                                {!result.eligible && result.reasons?.length > 0 && (
                                    <div className="mt-4 bg-danger-500/5 border border-danger-500/20 rounded-xl p-4">
                                        <p className="text-xs text-text-muted font-medium mb-2">Why not eligible:</p>
                                        <ul className="space-y-1.5">
                                            {result.reasons.map((r, i) => (
                                                <li key={i} className="text-sm text-danger-300 flex items-start gap-2">
                                                    <span className="text-danger-400 mt-0.5">✗</span> {r}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Scheme Comparison */}
                        {relatedSchemes.length > 0 && (
                            <div className="glass-card p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display font-semibold">📊 Compare with Similar Schemes</h3>
                                    <button onClick={() => setShowCompare(!showCompare)}
                                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium">
                                        {showCompare ? 'Hide' : 'Show'} Comparison
                                    </button>
                                </div>

                                {showCompare && comparisonData.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <table className="compare-table">
                                            <thead>
                                                <tr>
                                                    <th className="text-left text-xs text-text-muted p-3">Feature</th>
                                                    {comparisonData.map(s => <th key={s.name} className="text-left text-xs text-text-muted p-3">{s.name}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="p-3 text-xs text-text-muted">Benefit</td>
                                                    {comparisonData.map(s => <td key={s.name} className="p-3 text-sm text-success-400 font-medium">{s.benefit}</td>)}
                                                </tr>
                                                <tr>
                                                    <td className="p-3 text-xs text-text-muted">Who Can Apply</td>
                                                    {comparisonData.map(s => <td key={s.name} className="p-3 text-xs text-text-muted">{s.who_can_apply}</td>)}
                                                </tr>
                                                <tr>
                                                    <td className="p-3 text-xs text-text-muted">Documents</td>
                                                    {comparisonData.map(s => <td key={s.name} className="p-3 text-sm">{s.documents_count} needed</td>)}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="text-center pb-8">
                            <a href={scheme.portal_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                                🌐 Visit official portal: {scheme.portal_url} {Icons.arrow}
                            </a>
                        </div>
                    </>
                )}

                {/* ══════════ STEP 2: APPLY — UPLOAD + FORM + SUBMIT ══════════ */}
                {step === 'apply' && formFields && !submitResult && (
                    <>
                        {/* Document Upload */}
                        <div className="glass-card p-6">
                            <h3 className="font-display font-semibold text-lg mb-1">📎 Step 1: Upload Your Documents</h3>
                            <p className="text-xs text-text-muted mb-4">Upload your documents and the AI will automatically extract data to fill the form</p>

                            <div className="mb-4">
                                <p className="text-xs text-text-muted mb-2">Documents needed for {schemeName}:</p>
                                <div className="flex flex-wrap gap-2">
                                    {scheme.required_documents.map((doc, i) => {
                                        const isUploaded = uploadedDocs.some(d => d.name.toLowerCase().includes(doc.toLowerCase().split(' ')[0].toLowerCase()))
                                        return (
                                            <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isUploaded ? 'bg-success-500/15 border border-success-500/40 text-success-400' : 'bg-surface-light border border-border text-text-muted'}`}>
                                                {isUploaded ? '✓' : '○'} {doc}
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="upload-dropzone" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                                <p className="text-2xl mb-2">📄</p>
                                <p className="text-sm font-medium">Drag & drop documents here</p>
                                <p className="text-xs text-text-muted mt-1">or click to browse (PDF, JPG, PNG)</p>
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>

                            {uploading && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-primary-400">
                                    <span className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                                    Extracting data from document...
                                </div>
                            )}

                            {uploadedDocs.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs text-text-muted font-medium">Uploaded Documents:</p>
                                    {uploadedDocs.map((doc, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-surface-light/50 rounded-lg p-3">
                                            <span className="text-success-400">✓</span>
                                            <span className="text-sm flex-1">{doc.name}</span>
                                            <span className="text-xs text-text-muted">
                                                {Object.keys(doc.extractedFields).length} fields extracted
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Form Fields */}
                        <div className="glass-card p-6">
                            <h3 className="font-display font-semibold text-lg mb-1">📝 Step 2: Review & Complete Form</h3>
                            <p className="text-xs text-text-muted mb-5">
                                {uploadedDocs.length > 0
                                    ? `Auto-filled ${formFields.filter(f => f.autoFilled).length} fields from your documents. Review and fill remaining fields.`
                                    : 'Upload documents above to auto-fill, or fill manually below.'}
                            </p>

                            <div className="space-y-3">
                                {formFields.map((field, i) => (
                                    <div key={i} className="flex flex-col md:flex-row md:items-center gap-2">
                                        <label className="text-sm text-text-muted w-48 flex-shrink-0">
                                            {field.label} {field.required && <span className="text-danger-400">*</span>}
                                        </label>
                                        <div className="flex-1 relative">
                                            <input
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                value={field.value || ''}
                                                onChange={(e) => handleFieldChange(i, e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-all ${field.autoFilled
                                                    ? 'bg-success-500/10 border border-success-500/30 text-text focus:border-success-500'
                                                    : 'bg-surface-light border border-border text-text focus:border-primary-600'
                                                    }`}
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                            {field.autoFilled && (
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-success-400">AI ✓</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="glass-card p-6">
                            <h3 className="font-display font-semibold text-lg mb-3">🚀 Step 3: Submit Application</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary-600 to-success-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                                </div>
                                <span className="text-sm font-medium">{filledCount}/{totalFields} fields</span>
                            </div>

                            <button onClick={handleSubmitForm} disabled={!requiredFilled || submitting}
                                className={`w-full px-6 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${requiredFilled
                                    ? 'submit-portal-btn'
                                    : 'bg-surface-light border border-border text-text-muted cursor-not-allowed opacity-60'
                                    }`}>
                                {submitting ? (
                                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                                ) : requiredFilled ? (
                                    <>🚀 Submit to {schemeName} Portal</>
                                ) : (
                                    <>Fill all required fields to submit</>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* ══════════ SUBMIT RESULT ══════════ */}
                {submitResult && (
                    <div className="glass-card p-6 border-l-4 border-l-success-500">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-4xl">🎉</span>
                            <div>
                                <h3 className="font-display font-bold text-xl text-success-400">{submitResult.success ? 'Application Submitted!' : 'Submission Failed'}</h3>
                                <p className="text-sm text-text-muted">{submitResult.message}</p>
                            </div>
                        </div>
                        {submitResult.receipt && (
                            <div className="space-y-2 mt-4 bg-surface-light/30 rounded-xl p-4">
                                <div className="flex justify-between text-sm"><span className="text-text-muted">Receipt ID</span><span className="font-mono text-primary-400">{submitResult.receipt.receipt_id}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-text-muted">Scheme</span><span>{submitResult.receipt.scheme_name}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-text-muted">Status</span><span className="text-success-400">{submitResult.receipt.status}</span></div>
                            </div>
                        )}
                        <div className="mt-4 flex gap-3">
                            <button onClick={onBack} className="flex-1 px-4 py-2.5 bg-surface-light border border-border rounded-xl text-sm hover:border-primary-600 transition-all">
                                ← Explore More Schemes
                            </button>
                            {submitResult.receipt?.portal?.url && submitResult.receipt.portal.url !== '#' && (
                                <a href={submitResult.receipt.portal.url} target="_blank" rel="noopener noreferrer"
                                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 rounded-xl text-sm text-white text-center transition-all">
                                    🌐 Track on Portal
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


function Landing({ onStart, onExplore, onSelectScheme, lang, setLang }) {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')
    const [activeState, setActiveState] = useState('All India')
    const allSchemes = Object.entries(SCHEME_DATA)
    const t = (path) => path.split('.').reduce((obj, key) => obj?.[key], translations[lang]) || path
    const INDIAN_STATES = ['All India', 'Gujarat', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Tamil Nadu', 'Karnataka', 'Kerala', 'West Bengal', 'Punjab', 'Haryana', 'Odisha', 'Assam'];

    const filtered = allSchemes.filter(([key, scheme]) => {
        const matchesSearch = !search || key.toLowerCase().includes(search.toLowerCase()) || scheme.full_name.toLowerCase().includes(search.toLowerCase()) || scheme.description.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = activeCategory === 'All' || scheme.category === activeCategory
        const matchesState = activeState === 'All India' || !scheme.state || scheme.state === 'All India' || scheme.state === activeState
        return matchesSearch && matchesCategory && matchesState
    })

    const features = [
        { icon: '🤖', title: 'Multi-Agent AI', desc: '8 specialized AI agents analyze your profile, find schemes, detect conflicts, and optimize benefits' },
        { icon: '📄', title: 'Real PDF RAG', desc: 'Every recommendation cites exact clauses from actual government scheme documents — zero hallucination' },
        { icon: '⚡', title: 'Conflict Detection', desc: 'Automatically detects contradictions between Central and State schemes with resolution suggestions' },
        { icon: '🎯', title: 'Scheme Optimizer', desc: 'AI calculates the best combination of schemes to maximize your total annual benefit' },
        { icon: '📝', title: 'Auto Form-Fill', desc: 'Generates pre-filled application forms with 70-90% fields completed from your documents' },
        { icon: '🗓️', title: 'Life Journey Planner', desc: '5-year roadmap of future scheme eligibility based on your life events and milestones' },
    ]

    return (
        <div className="min-h-screen flex flex-col">
            {/* Nav */}
            <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-border/50 backdrop-blur-md bg-surface/80 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    {Icons.shield}
                    <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">PolicyPilot</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-text-muted">
                    <a href="#features" className="hover:text-text transition-colors">{t('nav.features')}</a>
                    <a href="#how-it-works" className="hover:text-text transition-colors">{t('nav.howItWorks')}</a>
                    <button onClick={onExplore} className="hover:text-text transition-colors">{t('nav.explore')}</button>
                    <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className="bg-transparent border-none text-text-muted hover:text-text cursor-pointer focus:outline-none"
                    >
                        <option value="en" className="bg-surface text-text">English</option>
                        <option value="hi" className="bg-surface text-text">हिंदी</option>
                        <option value="gu" className="bg-surface text-text">ગુજરાતી</option>
                        <option value="mr" className="bg-surface text-text">मराठी</option>
                        <option value="bn" className="bg-surface text-text">বাংলা</option>
                    </select>
                    <button onClick={onStart} className="button-primary px-5 py-2 text-sm">{t('nav.discover')}</button>
                </div>
            </nav>

            {/* Hero */}
            <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 hero-gradient opacity-10" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-950/50 border border-primary-800/50 text-primary-300 text-xs font-medium mb-8">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Powered by Agentic AI + RAG
                    </div>

                    <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                        Your AI Guide to{' '}
                        <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            Government Schemes
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
                        Discover, understand, and apply for Indian welfare schemes in plain language.
                        Every recommendation backed by real PDF citations — no hallucination.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={onStart}
                            id="get-started-btn"
                            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 rounded-xl text-white font-semibold text-lg transition-all hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 flex items-center gap-3"
                        >
                            Discover Your Schemes {Icons.arrow}
                        </button>
                        <a href="#explore"
                            className="px-8 py-4 rounded-xl border border-border hover:border-primary-700 text-text-muted hover:text-text font-medium transition-all flex items-center gap-2 hover:shadow-lg">
                            🔍 Explore All Schemes
                        </a>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="px-6 md:px-12 py-20 bg-surface-light/50">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
                    Not a Chatbot — An <span className="text-primary-400">Intelligent Advisor</span>
                </h2>
                <p className="text-text-muted text-center mb-12 max-w-xl mx-auto">8 specialized AI agents work together to analyze, recommend, and act on your behalf</p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((f, i) => (
                        <div key={i} className="glass-card p-6">
                            <span className="text-3xl mb-4 block">{f.icon}</span>
                            <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                            <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section id="how" className="px-6 md:px-12 py-20">
                <h2 className="font-display text-3xl font-bold text-center mb-12">How It Works</h2>
                <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
                    {[
                        { step: '01', title: 'Describe Your Situation', desc: 'Use text or voice to tell us about yourself — income, occupation, location, family' },
                        { step: '02', title: 'AI Analyzes Everything', desc: '8 agents search 6+ scheme PDFs, check eligibility, detect conflicts, optimize benefits' },
                        { step: '03', title: 'Get Actionable Results', desc: 'See eligible schemes with citations, auto-filled forms, and a 5-year benefit roadmap' },
                    ].map((s, i) => (
                        <div key={i} className="flex-1 glass-card p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center text-white font-bold font-display mx-auto mb-4">{s.step}</div>
                            <h3 className="font-display font-semibold mb-2">{s.title}</h3>
                            <p className="text-text-muted text-sm">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════ EXPLORE SCHEMES — ON HOME PAGE ══════════ */}
            <section id="explore" className="px-6 md:px-12 py-20 bg-surface-light/50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-3">
                        🔍 Explore Government <span className="text-primary-400">Schemes</span>
                    </h2>
                    <p className="text-text-muted text-center mb-8 max-w-xl mx-auto">Browse all available schemes, upload your documents, and apply directly</p>

                    {/* Search */}
                    <div className="glass-card p-4 mb-6">
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="🔎 Search schemes by name or keyword..."
                            className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary-600 transition-all" />
                    </div>

                    {/* State Filter */}
                    <div className="flex flex-wrap gap-2 mb-4 items-center">
                        <span className="text-sm font-medium text-text-muted mr-1">📍 State:</span>
                        <select
                            value={activeState}
                            onChange={(e) => setActiveState(e.target.value)}
                            className="bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary-600 transition-all font-medium min-w-[150px]"
                        >
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        <button onClick={() => setActiveCategory('All')}
                            className={`explore-filter-pill ${activeCategory === 'All' ? 'explore-filter-active' : ''}`}>All ({allSchemes.length})</button>
                        {SCHEME_CATEGORIES.map(cat => {
                            const count = allSchemes.filter(([, s]) => s.category === cat).length
                            return (
                                <button key={cat} onClick={() => setActiveCategory(cat)}
                                    className={`explore-filter-pill ${activeCategory === cat ? 'explore-filter-active' : ''}`}>
                                    {cat} ({count})
                                </button>
                            )
                        })}
                    </div>

                    {/* Scheme Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map(([key, scheme]) => (
                            <div key={key} className="explore-card" onClick={() => onSelectScheme(key)}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">{scheme.icon}</span>
                                    <div>
                                        <h3 className="font-display font-semibold text-base">{key}</h3>
                                        <span className="text-xs text-primary-400 font-medium">{scheme.category}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-text-muted mb-3 line-clamp-2">{scheme.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-success-400 font-medium">{scheme.benefit.split('(')[0].trim()}</span>
                                    <span className="text-xs text-primary-400 flex items-center gap-1">Start Application {Icons.arrow}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-text-muted">
                            <p className="text-4xl mb-3">🔍</p>
                            <p>No schemes found matching "{search}"</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-8 border-t border-border/50 text-center text-text-muted text-xs">
                <p>PolicyPilot — Built for India 🇮🇳 | Hackathon Project | All scheme data sourced from government PDFs</p>
            </footer>
        </div>
    )
}


// ─── SCHEME CARD COMPONENT ───
function SchemeCard({ scheme, onGenerateForm }) {
    const [expanded, setExpanded] = useState(false)
    const isEligible = scheme.eligible

    return (
        <div className={`glass-card p-5 ${isEligible ? 'border-l-4 border-l-success-500' : 'border-l-4 border-l-danger-500'}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display font-semibold text-lg">{scheme.name}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isEligible ? 'badge-eligible' : 'badge-ineligible'}`}>
                            {isEligible ? '✓ Eligible' : '✗ Not Eligible'}
                        </span>
                        {scheme.confidence && (
                            <span className="text-xs text-text-muted">{Math.round(scheme.confidence * 100)}% confidence</span>
                        )}
                    </div>
                    {scheme.benefit_amount && (
                        <p className="text-primary-400 font-semibold text-sm mb-2">💰 Benefit: {scheme.benefit_amount}</p>
                    )}
                    <p className="text-text-muted text-sm leading-relaxed">{scheme.reasoning?.slice(0, 200)}{scheme.reasoning?.length > 200 ? '...' : ''}</p>
                </div>
                <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary-400 hover:text-primary-300 whitespace-nowrap">
                    {expanded ? 'Less ▲' : 'More ▼'}
                </button>
            </div>

            {expanded && (
                <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                    {/* Reasoning */}
                    <div>
                        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Reasoning</h4>
                        <p className="text-sm leading-relaxed">{scheme.reasoning}</p>
                    </div>

                    {/* Citations */}
                    {scheme.citations?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">📚 Citations from Source PDFs</h4>
                            <div className="space-y-1.5">
                                {scheme.citations.map((c, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs bg-primary-950/30 border border-primary-900/30 rounded-lg p-2.5">
                                        {Icons.file}
                                        <span className="text-primary-300">{c}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Why NOT eligible */}
                    {!isEligible && scheme.why_not_eligible && (
                        <div className="bg-danger-500/5 border border-danger-500/20 rounded-lg p-4">
                            <h4 className="text-xs font-semibold text-danger-400 uppercase tracking-wider mb-2">❌ Why Not Eligible</h4>
                            <p className="text-sm text-danger-400/80 mb-2">{scheme.why_not_eligible}</p>
                            {scheme.how_to_become_eligible && (
                                <p className="text-sm text-warning-400">💡 <strong>How to qualify:</strong> {scheme.how_to_become_eligible}</p>
                            )}
                            {scheme.missing_criteria?.length > 0 && (
                                <div className="mt-2">
                                    <span className="text-xs text-text-muted">Missing criteria:</span>
                                    <ul className="list-disc list-inside text-xs text-danger-400/70 mt-1">
                                        {scheme.missing_criteria.map((m, i) => <li key={i}>{m}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Checklist */}
                    {scheme.checklist?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">📋 Checklist</h4>
                            <ul className="space-y-1">
                                {scheme.checklist.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                                        <span className="text-success-400 mt-0.5">{Icons.check}</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Documents Required */}
                    {scheme.required_documents?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">📎 Documents Required</h4>
                            <div className="flex flex-wrap gap-2">
                                {scheme.required_documents.map((doc, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-surface-light rounded-lg text-xs border border-border">{doc}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Steps */}
                    {scheme.application_steps?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">📝 Application Steps</h4>
                            <ol className="space-y-1.5">
                                {scheme.application_steps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <span className="w-5 h-5 rounded-full bg-primary-900 text-primary-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Generate Form Button */}
                    {isEligible && (
                        <button
                            onClick={() => onGenerateForm(scheme.name)}
                            className="w-full mt-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg"
                        >
                            📝 Generate Pre-Filled Application Form
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}


// ─── CONFLICT CARD ───
function ConflictCard({ conflict }) {
    return (
        <div className="glass-card p-5 border-l-4 border-l-warning-500">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-warning-400">{Icons.alert}</span>
                <span className="badge-conflict px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {conflict.type === 'full_conflict' ? '⛔ Full Conflict' : conflict.type === 'partial_conflict' ? '⚠️ Partial Conflict' : '🔄 Convergence Possible'}
                </span>
            </div>
            <p className="font-semibold text-sm mb-1">
                {conflict.schemes?.join(' ↔ ')}
            </p>
            <p className="text-sm text-text-muted mb-3">{conflict.issue}</p>
            {conflict.resolution && (
                <p className="text-sm text-primary-400">💡 <strong>Resolution:</strong> {conflict.resolution}</p>
            )}
            {conflict.citations?.length > 0 && (
                <div className="mt-3 space-y-1">
                    {conflict.citations.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-warning-400/70 bg-warning-500/5 rounded p-2">
                            {Icons.file} {c}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}


// ─── FORM PREVIEW WITH DOCUMENT UPLOAD & SUBMISSION ───
function FormPreview({ form, onFormUpdate }) {
    const [uploadedDocs, setUploadedDocs] = useState([])
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [requiredDocs, setRequiredDocs] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitResult, setSubmitResult] = useState(null)
    const [formFields, setFormFields] = useState(form?.fields || [])
    const [docType, setDocType] = useState('aadhaar')
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (form?.fields) setFormFields(form.fields)
    }, [form])

    // Fetch required docs whenever form fields change
    useEffect(() => {
        if (form?.scheme_name && formFields.length > 0) {
            fetchRequiredDocs()
        }
    }, [formFields, uploadedDocs])

    const fetchRequiredDocs = async () => {
        try {
            const res = await fetch(`${API_BASE}/form/required-docs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheme_name: form.scheme_name, form_fields: formFields }),
            })
            if (res.ok) {
                const data = await res.json()
                setRequiredDocs(data)
            }
        } catch (err) {
            console.error('Required docs fetch error:', err)
        }
    }

    // Handle file upload
    const handleFileUpload = async (file) => {
        if (!file) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('doc_type', docType)

            const res = await fetch(`${API_BASE}/upload-document`, {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) throw new Error('Upload failed')
            const data = await res.json()

            // Add to uploaded docs list
            const docName = DOC_TYPE_LABELS[docType] || docType
            setUploadedDocs(prev => [...prev, { name: docName, fileName: file.name, type: docType, extracted: data.extracted_fields || {} }])

            // Merge extracted fields into form
            if (data.extracted_fields) {
                setFormFields(prev => prev.map(field => {
                    const fieldKey = field.field_name?.toLowerCase()
                    for (const [key, val] of Object.entries(data.extracted_fields)) {
                        if (val && key.toLowerCase() === fieldKey) {
                            return { ...field, value: String(val), filled: true, confidence: 0.85 }
                        }
                    }
                    return field
                }))
            }
        } catch (err) {
            console.error('Upload error:', err)
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFileUpload(file)
    }

    const handleFieldChange = (index, newValue) => {
        setFormFields(prev => prev.map((f, i) => i === index ? { ...f, value: newValue, filled: !!newValue.trim() } : f))
    }

    // Submit form to portal
    const handleSubmitForm = async () => {
        setSubmitting(true)
        const formPayload = {
            scheme_name: form.scheme_name,
            form_fields: formFields,
            uploaded_documents: uploadedDocs.map(d => d.name),
        }
        try {
            const res = await fetch(`${API_BASE}/form/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formPayload),
            })
            const data = await res.json()
            setSubmitResult(data)
        } catch (err) {
            // ── Offline: Queue for later submission ──
            try {
                await addToQueue(formPayload)
                // Try Background Sync
                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    const reg = await navigator.serviceWorker.ready
                    await reg.sync.register('submit-queued-forms')
                }
                setSubmitResult({
                    success: true,
                    message: '📦 Form saved locally! It will auto-submit when internet is available.',
                    receipt: {
                        receipt_id: `OFFLINE-${Date.now().toString(36).toUpperCase()}`,
                        scheme_name: form.scheme_name,
                        submission_time: new Date().toLocaleString(),
                        status: '📦 Queued — Pending Internet',
                        estimated_processing: 'Will submit automatically when online',
                        portal: { portal_name: form.scheme_name + ' Portal', url: '#' },
                        documents_attached: uploadedDocs.map(d => d.name),
                        fields_submitted: formFields.filter(f => f.value).length,
                    },
                    next_steps: [
                        'Your form has been saved securely on this device',
                        'It will auto-submit when internet connectivity is detected',
                        'You can also manually sync from the pending queue banner',
                        'Keep the app open or installed for background sync to work',
                    ],
                })
            } catch (queueErr) {
                setSubmitResult({ success: false, message: 'Could not save form. Please try again.' })
            }
        } finally {
            setSubmitting(false)
        }
    }

    if (!form || !form.fields) return null

    const filledCount = formFields.filter(f => f.filled || (f.value && String(f.value).trim())).length
    const totalRequired = formFields.filter(f => f.required).length
    const completionPct = Math.round((filledCount / formFields.length) * 100)
    const allRequiredFilled = formFields.filter(f => f.required).every(f => f.value && String(f.value).trim())
    const readyToSubmit = allRequiredFilled && (requiredDocs?.all_documents_submitted !== false || uploadedDocs.length > 0)

    // ── Submission Success Modal ──
    if (submitResult?.success) {
        const receipt = submitResult.receipt
        return (
            <div className="space-y-4">
                <div className="glass-card p-8 text-center border-t-4 border-t-success-500">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="font-display text-2xl font-bold text-success-400 mb-2">Application Submitted!</h3>
                    <p className="text-text-muted mb-6">{submitResult.message}</p>

                    <div className="glass-card p-6 text-left mb-6 bg-surface-light/50">
                        <h4 className="font-display font-semibold mb-4 text-lg">📋 Submission Receipt</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div><span className="text-text-muted text-xs">Receipt ID</span><p className="font-mono font-bold text-primary-400">{receipt.receipt_id}</p></div>
                            <div><span className="text-text-muted text-xs">Scheme</span><p className="font-medium">{receipt.scheme_name}</p></div>
                            <div><span className="text-text-muted text-xs">Submitted On</span><p>{receipt.submission_time}</p></div>
                            <div><span className="text-text-muted text-xs">Status</span><p className="text-warning-400 font-medium">{receipt.status}</p></div>
                            <div><span className="text-text-muted text-xs">Processing Time</span><p>{receipt.estimated_processing}</p></div>
                            <div><span className="text-text-muted text-xs">Portal</span><p>{receipt.portal?.portal_name}</p></div>
                        </div>
                        {receipt.documents_attached?.length > 0 && (
                            <div className="mt-4">
                                <span className="text-text-muted text-xs">Documents Attached</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {receipt.documents_attached.map((d, i) => (
                                        <span key={i} className="doc-chip-uploaded">{Icons.check} {d}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-4 text-left mb-6">
                        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">📌 Next Steps</h4>
                        <ol className="space-y-2">
                            {submitResult.next_steps?.map((step, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                    <span className="w-5 h-5 rounded-full bg-primary-900 text-primary-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    {receipt.portal?.url && receipt.portal.url !== '#' && (
                        <a href={receipt.portal.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 rounded-xl text-white font-semibold transition-all hover:shadow-xl hover:shadow-primary-600/30">
                            🌐 Track on {receipt.portal.portal_name} {Icons.arrow}
                        </a>
                    )}
                </div>
            </div>
        )
    }

    // ── Submission Error ──
    if (submitResult && !submitResult.success) {
        return (
            <div className="space-y-4">
                <div className="glass-card p-6 border-l-4 border-l-danger-500">
                    <h3 className="font-display font-semibold text-lg text-danger-400 mb-2">❌ Submission Failed</h3>
                    <p className="text-sm text-text-muted mb-4">{submitResult.message}</p>
                    {submitResult.missing_fields?.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs text-text-muted font-medium mb-1">Missing required fields:</p>
                            <div className="flex flex-wrap gap-2">{submitResult.missing_fields.map((f, i) => <span key={i} className="doc-chip-needed">{f}</span>)}</div>
                        </div>
                    )}
                    {submitResult.missing_documents?.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs text-text-muted font-medium mb-1">Missing documents:</p>
                            <div className="flex flex-wrap gap-2">{submitResult.missing_documents.map((d, i) => <span key={i} className="doc-chip-needed">{Icons.upload} {d}</span>)}</div>
                        </div>
                    )}
                    <button onClick={() => setSubmitResult(null)} className="px-4 py-2 bg-surface-light border border-border rounded-lg text-sm hover:border-primary-600 transition-all">← Back to Form</button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* ── Document Upload Zone ── */}
            <div className="glass-card p-5">
                <h4 className="font-display font-semibold text-lg mb-1">📎 Upload Your Documents</h4>
                <p className="text-xs text-text-muted mb-4">Upload Aadhaar, income certificate, land records, etc. to auto-fill the form</p>

                <div className="flex items-center gap-3 mb-4">
                    <label className="text-xs text-text-muted">Document type:</label>
                    <select value={docType} onChange={(e) => setDocType(e.target.value)}
                        className="bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:border-primary-600">
                        <option value="aadhaar">Aadhaar Card</option>
                        <option value="income_cert">Income Certificate</option>
                        <option value="land_records">Land Records</option>
                        <option value="bank_passbook">Bank Passbook</option>
                        <option value="ration_card">Ration Card</option>
                        <option value="bpl_cert">BPL Certificate</option>
                        <option value="caste_cert">Caste Certificate</option>
                        <option value="voter_id">Voter ID</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div
                    className={`upload-dropzone ${dragOver ? 'upload-dropzone-active' : ''} ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.txt"
                        onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); e.target.value = '' }} />
                    <div className="text-3xl mb-2">{uploading ? '⏳' : '📄'}</div>
                    <p className="text-sm font-medium">{uploading ? 'Processing document...' : 'Drag & drop your document here'}</p>
                    <p className="text-xs text-text-muted mt-1">or click to browse • PDF, JPG, PNG, TXT</p>
                </div>

                {/* Uploaded Documents List */}
                {uploadedDocs.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs text-text-muted font-medium mb-2">Uploaded Documents ({uploadedDocs.length})</p>
                        <div className="flex flex-wrap gap-2">
                            {uploadedDocs.map((doc, i) => (
                                <span key={i} className="doc-chip-uploaded">{Icons.check} {doc.name} <span className="text-text-muted">({doc.fileName})</span></span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Missing Documents Alert ── */}
            {requiredDocs && requiredDocs.needed_documents?.length > 0 && (
                <div className="glass-card p-4 border-l-4 border-l-warning-500 bg-warning-500/5">
                    <div className="flex items-center gap-2 mb-2">
                        {Icons.alert}
                        <h4 className="text-sm font-semibold text-warning-400">Documents Still Needed</h4>
                    </div>
                    <p className="text-xs text-text-muted mb-3">{requiredDocs.message}</p>
                    <div className="flex flex-wrap gap-2">
                        {requiredDocs.needed_documents.map((doc, i) => (
                            <button key={i} onClick={() => { setDocType(doc.document_name.toLowerCase().includes('aadhaar') ? 'aadhaar' : doc.document_name.toLowerCase().includes('income') ? 'income_cert' : doc.document_name.toLowerCase().includes('land') ? 'land_records' : 'other'); fileInputRef.current?.click() }}
                                className="doc-chip-needed cursor-pointer hover:border-warning-400 transition-all">
                                {Icons.upload} {doc.document_name}
                                <span className="text-text-muted text-xs ml-1">→ fills {doc.fills_fields?.length || 0} field(s)</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Form Fields ── */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-lg">{form.form_title || form.scheme_name}</h3>
                    <span className="text-xs text-primary-400 font-medium">{completionPct}% complete</span>
                </div>
                <div className="w-full bg-surface-light rounded-full h-2 mb-6">
                    <div className={`h-2 rounded-full transition-all duration-500 ${completionPct === 100 ? 'bg-gradient-to-r from-success-500 to-success-400' : 'bg-gradient-to-r from-primary-600 to-primary-400'}`} style={{ width: `${completionPct}%` }} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    {formFields.map((field, i) => (
                        <div key={i} className="space-y-1">
                            <label className="text-xs text-text-muted font-medium flex items-center gap-1">
                                {field.label} {field.required && <span className="text-danger-400">*</span>}
                            </label>
                            <input
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={field.value || ''}
                                onChange={(e) => handleFieldChange(i, e.target.value)}
                                placeholder={field.filled ? '' : 'Not available — fill manually or upload document'}
                                className={`w-full px-3 py-2 rounded-lg bg-surface-light border text-sm ${field.filled && field.value ? 'border-success-500/30 text-text' : 'border-warning-500/30 text-text-muted'}`}
                            />
                            {field.filled && field.value && <span className="text-success-400 text-xs">✓ Auto-filled</span>}
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <div className="mt-8 pt-6 border-t border-border/50">
                    {readyToSubmit ? (
                        <button onClick={handleSubmitForm} disabled={submitting}
                            className="submit-portal-btn w-full">
                            {submitting ? (
                                <><span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> Submitting to Portal...</>
                            ) : (
                                <>🚀 Submit Application to {form.scheme_name} Portal</>
                            )}
                        </button>
                    ) : (
                        <div className="text-center">
                            <button disabled className="w-full px-6 py-3.5 rounded-xl bg-surface-light border border-border text-text-muted text-sm font-medium cursor-not-allowed opacity-60">
                                🔒 Complete all required fields to submit
                            </button>
                            <p className="text-xs text-text-muted mt-2">
                                {filledCount}/{formFields.length} fields filled • {totalRequired - formFields.filter(f => f.required && f.value && String(f.value).trim()).length} required field(s) remaining
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


// ─── LIFE JOURNEY TIMELINE ───
function LifeJourney({ journey }) {
    if (!journey?.timeline?.length) return null
    return (
        <div className="space-y-4">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">{Icons.calendar} Life Journey Plan</h3>
            {journey.total_lifetime_benefit && (
                <p className="text-primary-400 font-semibold">Total estimated lifetime benefit: {journey.total_lifetime_benefit}</p>
            )}
            <div className="relative pl-8 space-y-6">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-600 via-purple-600 to-cyan-600 rounded" />
                {journey.timeline.map((item, i) => (
                    <div key={i} className="relative">
                        <div className="absolute -left-5 w-4 h-4 rounded-full bg-primary-600 border-2 border-surface" />
                        <div className="glass-card p-4">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-display font-bold text-primary-400">{item.year}</span>
                                {item.age && <span className="text-xs text-text-muted">Age: {item.age}</span>}
                            </div>
                            <p className="text-sm font-medium mb-1">{item.life_event}</p>
                            {item.eligible_schemes?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {item.eligible_schemes.map((s, j) => (
                                        <span key={j} className="px-2 py-0.5 bg-primary-950/50 border border-primary-800/50 rounded-full text-xs text-primary-300">{s}</span>
                                    ))}
                                </div>
                            )}
                            {item.action_required && <p className="text-xs text-text-muted mt-2">→ {item.action_required}</p>}
                            {item.estimated_benefit && <p className="text-xs text-success-400 mt-1">💰 {item.estimated_benefit}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}


// ─── MAIN APP ───
export default function App() {
    const [page, setPage] = useState('landing') // landing | explore | scheme-detail | discover
    const [selectedScheme, setSelectedScheme] = useState(null)
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingStage, setLoadingStage] = useState('')
    const [results, setResults] = useState(null)
    const [activeTab, setActiveTab] = useState('schemes')
    const [form, setForm] = useState(null)
    const [formLoading, setFormLoading] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [language, setLanguage] = useState('en')
    const [translatedSummary, setTranslatedSummary] = useState('')
    const [error, setError] = useState('')
    const [isOffline, setIsOffline] = useState(!navigator.onLine)
    const [pendingQueue, setPendingQueue] = useState([])
    const textareaRef = useRef(null)
    const t = (path) => path.split('.').reduce((obj, key) => obj?.[key], translations[language]) || path

    // ── Online/Offline Detection ──
    useEffect(() => {
        const goOnline = () => { setIsOffline(false); syncQueuedForms().then(() => refreshQueue()) }
        const goOffline = () => setIsOffline(true)
        window.addEventListener('online', goOnline)
        window.addEventListener('offline', goOffline)
        // Listen for SW sync completion
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', (e) => {
                if (e.data?.type === 'SYNC_COMPLETE') refreshQueue()
            })
        }
        refreshQueue()
        return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
    }, [])

    const refreshQueue = async () => {
        try { const q = await getQueue(); setPendingQueue(q) } catch (e) { }
    }

    const startVoice = useCallback(() => {
        const sm_api_key = import.meta.env.VITE_SPEECHMATICS_API_KEY
        if (!sm_api_key) {
            console.error("Speechmatics API Key not found in .env")
            return
        };

        const languageMap = {
            'en': 'en',
            'hi': 'hi',
            'gu': 'gu',
            'mr': 'mr',
            'bn': 'bn'
        };

        if (isRecording) {
            setIsRecording(false);
            if (window.speechmaticsWS) {
                window.speechmaticsWS.close();
            }
            if (window.audioContext) {
                window.audioContext.close();
            }
            return;
        }

        setIsRecording(true);
        setError('');

        const ws = new WebSocket(`wss://eu2.rt.speechmatics.com/v2/jobs?jwt=${sm_api_key}`);
        window.speechmaticsWS = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({
                message: "StartRecognition",
                transcription_config: {
                    language: languageMap[language] || 'en',
                    operating_point: "enhanced"
                },
                audio_format: {
                    type: "raw",
                    encoding: "pcm_f32le",
                    sample_rate: 16000
                }
            }));
        };

        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.message === "RecognitionStarted") {
                // Start capturing audio
                navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
                    window.audioContext = audioContext;
                    const source = audioContext.createMediaStreamSource(stream);
                    const processor = audioContext.createScriptProcessor(4096, 1, 1);

                    source.connect(processor);
                    processor.connect(audioContext.destination);

                    processor.onaudioprocess = (e) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            const inputData = e.inputBuffer.getChannelData(0);
                            ws.send(inputData.buffer);
                        }
                    };
                }).catch(err => {
                    setError("Microphone access denied");
                    setIsRecording(false);
                    ws.close();
                });
            } else if (msg.message === "AddTranscript") {
                const results = msg.results;
                if (results && results.length > 0) {
                    const transcript = results.map(r => r.alternatives[0].content).join(" ");
                    setQuery(prev => prev + (prev ? " " : "") + transcript);
                }
            } else if (msg.message === "Error") {
                setError(msg.reason || "Speechmatics error");
                setIsRecording(false);
            }
        };

        ws.onclose = () => {
            setIsRecording(false);
        };

        ws.onerror = () => {
            setError("Speechmatics connection failed");
            setIsRecording(false);
        };
    }, [isRecording, language]);

    // ── Submit Query ──
    const handleSubmit = async () => {
        if (!query.trim()) return
        setLoading(true)
        setError('')
        setResults(null)
        setForm(null)
        setActiveTab('schemes')

        const stages = t('discover.stages') || [
            'Understanding your query...',
            'Searching government scheme PDFs...',
            'Analyzing eligibility criteria...',
            'Detecting scheme conflicts...',
            'Optimizing benefit combinations...',
            'Planning your life journey...',
        ]
        let stageIdx = 0
        setLoadingStage(stages[0])
        const interval = setInterval(() => {
            stageIdx = Math.min(stageIdx + 1, stages.length - 1)
            setLoadingStage(stages[stageIdx])
        }, 3000)

        try {
            const res = await fetch(`${API_BASE}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim(), language }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || `Server error ${res.status}`)
            }
            const data = await res.json()
            setResults(data)
            if (data.translated_summary) setTranslatedSummary(data.translated_summary)
            // Cache results for offline use
            try { await cacheResult(`query:${query.trim()}`, data) } catch (e) { }
        } catch (err) {
            // ── Offline Fallback ──
            const offlineData = {
                profile: { query },
                action_paths: offlineActionPaths(query),
                conflicts: offlineConflicts(query),
                life_journey: offlineLifeJourney(query),
                eligible_schemes: []
            }
            setResults(offlineData)
            setError(err.message)
        } finally {
            clearInterval(interval)
            setLoading(false)
        }
    }

    // ── Generate Form ──
    const handleGenerateForm = async (schemeName) => {
        setFormLoading(true)
        setActiveTab('form')
        setError('')
        try {
            const res = await fetch(`${API_BASE}/form/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheme_name: schemeName, profile: results?.profile || {} }),
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.detail || `Form generation failed (${res.status})`)
            }
            const data = await res.json()
            if (data.error) {
                throw new Error(data.error)
            }
            setForm(data)
        } catch (err) {
            // ── Offline Fallback: use cached form template ──
            const offlineForm = offlineGenerateForm(schemeName, results?.profile || {})
            if (offlineForm) {
                setForm(offlineForm)
                setError('')
            } else {
                setError(err.message || 'Form generation failed. Try again.')
                setForm(null)
            }
        } finally {
            setFormLoading(false)
        }
    }

    // ── Landing ──
    if (page === 'landing') return (
        <Landing
            onStart={() => setPage('discover')}
            onExplore={() => setPage('explore')}
            onSelectScheme={(name) => { setSelectedScheme(name); setPage('scheme-detail') }}
            lang={language}
            setLang={setLanguage}
        />
    )

    // ── Explore Schemes (standalone page — fallback) ──
    if (page === 'explore') return (
        <ExploreSchemes
            onSelectScheme={(name) => { setSelectedScheme(name); setPage('scheme-detail') }}
            onBack={() => setPage('landing')}
            onDiscover={() => setPage('discover')}
            lang={language}
        />
    )

    // ── Scheme Detail ──
    if (page === 'scheme-detail' && selectedScheme) return (
        <SchemeDetail
            schemeName={selectedScheme}
            onBack={() => setPage('landing')}
            onApply={(name) => {
                setPage('discover')
                setActiveTab('form')
                handleGenerateForm(name)
            }}
        />
    )

    // ── Discover Page ──
    const eligible = results?.schemes?.filter(s => s.eligible) || []
    const ineligible = results?.schemes?.filter(s => !s.eligible) || []
    const conflicts = results?.conflicts || []
    const actionPaths = results?.action_paths || {}
    const optimization = results?.optimization
    const journey = results?.life_journey

    const tabs = [
        { id: 'schemes', label: `${t('common.tabs.schemes')} (${results?.schemes?.length || 0})`, emoji: '📊' },
        { id: 'conflicts', label: `${t('common.tabs.conflicts')} (${conflicts.length})`, emoji: '⚠️' },
        { id: 'action', label: t('common.tabs.action'), emoji: '📍' },
        { id: 'optimizer', label: t('common.tabs.optimizer'), emoji: '🎯' },
        { id: 'form', label: t('common.tabs.form'), emoji: '📝' },
        { id: 'journey', label: t('common.tabs.journey'), emoji: '🗓️' },
    ]

    return (
        <div className="min-h-screen bg-surface">
            {/* Top Nav */}
            <nav className="flex items-center justify-between px-6 py-3 border-b border-border/50 backdrop-blur-md bg-surface/80 sticky top-0 z-50">
                <button onClick={() => setPage('landing')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    {Icons.shield}
                    <span className="font-display font-bold text-lg bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">PolicyPilot</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                        {Icons.globe}
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-transparent text-text-muted text-xs border-none outline-none cursor-pointer"
                        >
                            <option value="en">English</option>
                            <option value="hi">हिंदी</option>
                            <option value="gu">ગુજરાતી</option>
                            <option value="mr">मराठी</option>
                            <option value="ta">தமிழ்</option>
                            <option value="bn">বাংলা</option>
                            <option value="te">తెలుగు</option>
                        </select>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
                {/* ── Offline Banner ── */}
                {isOffline && (
                    <div className="offline-banner mb-4">
                        <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-warning-400 animate-pulse" />
                            ⚡ {t('common.banners.offline')}
                        </span>
                    </div>
                )}

                {/* ── Offline Results Indicator ── */}
                {results?._offline && !isOffline && (
                    <div className="offline-banner mb-4" style={{ background: 'rgba(51, 129, 255, 0.08)', borderColor: 'rgba(51, 129, 255, 0.3)', color: '#8ec5ff' }}>
                        ℹ️ {t('common.banners.cached')}
                    </div>
                )}

                {/* ── Pending Submissions Queue ── */}
                {pendingQueue.length > 0 && (
                    <div className="glass-card p-4 mb-4 border-l-4 border-l-warning-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-warning-400 text-lg">📦</span>
                                <div>
                                    <p className="text-sm font-medium">{pendingQueue.length} form(s) waiting to submit</p>
                                    <p className="text-xs text-text-muted">{isOffline ? 'Will auto-submit when internet returns' : 'Syncing now...'}</p>
                                </div>
                            </div>
                            {!isOffline && (
                                <button onClick={async () => { await syncQueuedForms(); refreshQueue() }}
                                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 rounded-lg text-xs text-white font-medium transition-all">
                                    🔄 Sync Now
                                </button>
                            )}
                        </div>
                        <div className="mt-3 space-y-1.5">
                            {pendingQueue.map((item, i) => (
                                <div key={item.id || i} className="flex items-center justify-between text-xs bg-surface-light/50 rounded-lg p-2">
                                    <span>{item.data?.scheme_name || 'Unknown Scheme'}</span>
                                    <span className="text-text-muted">{new Date(item.timestamp).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Query Input */}
                <div className="glass-card p-5 mb-6">
                    <h2 className="font-display text-lg font-semibold mb-3">{t('discover.title')}</h2>
                    <p className="text-sm text-text-muted mb-4">{t('discover.subtitle')}</p>
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
                                placeholder={t('discover.placeholder')}
                                rows={3}
                                className="w-full px-4 py-3 bg-surface-light border border-border rounded-xl text-sm text-text placeholder-text-muted/50 resize-none focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={startVoice}
                                className={`p-3 rounded-xl border transition-all ${isRecording ? 'bg-danger-500 border-danger-500 text-white recording-pulse' : 'border-border hover:border-primary-600 text-text-muted hover:text-primary-400'}`}
                                title={t('buttons.voice')}
                            >
                                {Icons.mic}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !query.trim()}
                                className="p-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                title="Analyze"
                            >
                                {Icons.send}
                            </button>
                        </div>
                    </div>
                    {isRecording && <p className="text-danger-400 text-xs mt-2 animate-pulse">🎙️ Listening... Speak now</p>}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl text-danger-400 text-sm flex items-start gap-3">
                        {Icons.alert}
                        <div>
                            <p className="font-medium">Error</p>
                            <p className="text-danger-400/70">{error}</p>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && <Spinner text={loadingStage} />}

                {/* Results */}
                {results && !loading && (
                    <>
                        {/* Summary Bar */}
                        <div className="glass-card p-4 mb-6 bg-gradient-to-r from-primary-950/50 to-purple-950/30">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <p className="text-sm font-medium">{results.summary}</p>
                                    {translatedSummary && language !== 'en' && (
                                        <p className="text-sm text-primary-300 mt-1">{translatedSummary}</p>
                                    )}
                                </div>
                                <div className="flex gap-3 text-xs">
                                    <span className="px-2.5 py-1 bg-success-500/10 border border-success-500/30 rounded-full text-success-400">
                                        ✓ {eligible.length} {t('common.summary.eligible')}
                                    </span>
                                    <span className="px-2.5 py-1 bg-danger-500/10 border border-danger-500/30 rounded-full text-danger-400">
                                        ✗ {ineligible.length} {t('common.summary.ineligible')}
                                    </span>
                                    {conflicts.length > 0 && (
                                        <span className="badge-conflict px-2.5 py-1 rounded-full">
                                            ⚠ {conflicts.length} Conflicts
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-text-muted mt-2">Sources: {results.sources_used?.join(', ')} | {results.total_chunks_retrieved} chunks analyzed</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'tab-active text-white' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
                                >
                                    {tab.emoji} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="space-y-4">
                            {activeTab === 'schemes' && (
                                <>
                                    {eligible.length > 0 && (
                                        <div>
                                            <h3 className="font-display text-lg font-bold text-success-400 mb-3">✓ Eligible Schemes</h3>
                                            <div className="space-y-4">
                                                {eligible.map((s, i) => <SchemeCard key={i} scheme={s} onGenerateForm={handleGenerateForm} />)}
                                            </div>
                                        </div>
                                    )}
                                    {ineligible.length > 0 && (
                                        <div className="mt-8">
                                            <h3 className="font-display text-lg font-bold text-danger-400 mb-3">✗ Not Eligible (with reasons)</h3>
                                            <div className="space-y-4">
                                                {ineligible.map((s, i) => <SchemeCard key={i} scheme={s} onGenerateForm={handleGenerateForm} />)}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'conflicts' && (
                                <div>
                                    <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">{Icons.alert} Scheme Conflicts</h3>
                                    {conflicts.length > 0 ? (
                                        <div className="space-y-4">
                                            {conflicts.map((c, i) => <ConflictCard key={i} conflict={c} />)}
                                        </div>
                                    ) : (
                                        <div className="glass-card p-8 text-center text-text-muted">
                                            <p className="text-4xl mb-3">✅</p>
                                            <p>No conflicts detected between your eligible schemes</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'action' && (
                                <div>
                                    <h3 className="font-display text-xl font-bold mb-4">📍 Nearest Action Path</h3>
                                    {actionPaths.action_paths?.length > 0 ? (
                                        <div className="space-y-6">
                                            {actionPaths.general_tips?.length > 0 && (
                                                <div className="glass-card p-4 bg-primary-950/30 border-l-4 border-l-primary-500">
                                                    <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">💡 General Tips</h4>
                                                    <ul className="space-y-1">{actionPaths.general_tips.map((t, i) => <li key={i} className="text-sm text-text-muted flex items-start gap-2"><span className="text-primary-400 mt-0.5">•</span>{t}</li>)}</ul>
                                                </div>
                                            )}
                                            {actionPaths.action_paths.map((ap, idx) => (
                                                <div key={idx} className="glass-card p-5 border-l-4 border-l-cyan-500">
                                                    <h4 className="font-display font-semibold text-lg mb-4 text-cyan-400">{ap.scheme}</h4>

                                                    {ap.primary_office && (
                                                        <div className="bg-surface-light rounded-xl p-4 mb-4">
                                                            <h5 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">🏛️ Primary Office</h5>
                                                            <div className="grid md:grid-cols-2 gap-3">
                                                                <div><span className="text-xs text-text-muted">Office</span><p className="text-sm font-medium">{ap.primary_office.name}</p></div>
                                                                <div><span className="text-xs text-text-muted">Department</span><p className="text-sm font-medium">{ap.primary_office.department}</p></div>
                                                                <div><span className="text-xs text-text-muted">Distance</span><p className="text-sm font-medium text-cyan-400">{ap.primary_office.estimated_distance}</p></div>
                                                                <div><span className="text-xs text-text-muted">Working Hours</span><p className="text-sm font-medium">{ap.primary_office.working_hours}</p></div>
                                                                <div><span className="text-xs text-text-muted">Officer / Desk</span><p className="text-sm font-medium">{ap.primary_office.required_desk_or_officer}</p></div>
                                                                <div><span className="text-xs text-text-muted">Contact</span><p className="text-sm font-medium">{ap.primary_office.contact}</p></div>
                                                            </div>
                                                            {ap.primary_office.address_hint && <p className="text-xs text-text-muted mt-2">📌 {ap.primary_office.address_hint}</p>}
                                                        </div>
                                                    )}

                                                    {ap.alternative_channels?.length > 0 && (
                                                        <div className="mb-4">
                                                            <h5 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">🔄 Alternative Channels</h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {ap.alternative_channels.map((ch, j) => (
                                                                    <div key={j} className="px-3 py-2 bg-surface-light rounded-lg border border-border text-sm">
                                                                        <span className="text-xs text-primary-400 font-medium uppercase">{ch.type}</span>
                                                                        <p className="font-medium">{ch.name}</p>
                                                                        <p className="text-xs text-text-muted">{ch.details}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {ap.physical_journey_steps?.length > 0 && (
                                                        <div className="mb-4">
                                                            <h5 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">🚶 Physical Journey Steps</h5>
                                                            <ol className="space-y-2">
                                                                {ap.physical_journey_steps.map((step, j) => (
                                                                    <li key={j} className="flex items-start gap-3 text-sm">
                                                                        <span className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{j + 1}</span>
                                                                        <span>{step}</span>
                                                                    </li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 text-xs text-text-muted">
                                                        {ap.estimated_processing_time && <span>⏱️ Processing: {ap.estimated_processing_time}</span>}
                                                    </div>

                                                    {ap.tips?.length > 0 && (
                                                        <div className="mt-3 p-3 bg-warning-500/5 border border-warning-500/20 rounded-lg">
                                                            <p className="text-xs text-warning-400 font-medium mb-1">💡 Tips</p>
                                                            <ul className="space-y-0.5">{ap.tips.map((t, j) => <li key={j} className="text-xs text-text-muted">• {t}</li>)}</ul>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="glass-card p-8 text-center text-text-muted">
                                            <p className="text-4xl mb-3">📍</p>
                                            <p>Action path data not available</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'optimizer' && optimization && (
                                <div className="space-y-4">
                                    <h3 className="font-display text-xl font-bold flex items-center gap-2">{Icons.star} Optimal Scheme Combination</h3>
                                    <div className="glass-card p-6 border-l-4 border-l-primary-500">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-3xl">🎯</span>
                                            <div>
                                                <p className="font-display font-bold text-lg">Best Combination</p>
                                                <p className="text-primary-400 font-semibold">{optimization.total_estimated_benefit}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {optimization.best_combination?.map((s, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-primary-950 border border-primary-800 rounded-lg text-sm text-primary-300 font-medium">{s}</span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-text-muted">{optimization.reasoning}</p>
                                    </div>
                                    {optimization.benefit_breakdown?.length > 0 && (
                                        <div className="glass-card p-5">
                                            <h4 className="font-semibold text-sm mb-3">Benefit Breakdown</h4>
                                            <div className="space-y-2">
                                                {optimization.benefit_breakdown.map((b, i) => (
                                                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                                                        <span>{b.scheme}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs px-2 py-0.5 bg-surface-light rounded text-text-muted">{b.type}</span>
                                                            <span className="font-semibold text-success-400">{b.benefit}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'form' && (
                                <div>
                                    <h3 className="font-display text-xl font-bold mb-4">📝 Application Form</h3>
                                    {formLoading ? (
                                        <Spinner text="Generating pre-filled form..." />
                                    ) : form ? (
                                        <FormPreview form={form} onFormUpdate={setForm} />
                                    ) : (
                                        <div className="glass-card p-8 text-center text-text-muted">
                                            <p className="text-4xl mb-3">📋</p>
                                            <p>Click "Generate Form" on any eligible scheme to auto-fill an application</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'journey' && (
                                <div>
                                    {journey?.timeline?.length > 0 ? (
                                        <LifeJourney journey={journey} />
                                    ) : (
                                        <div className="glass-card p-8 text-center text-text-muted">
                                            <p className="text-4xl mb-3">🗓️</p>
                                            <p>Life journey data not available</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Profile Card */}
                        {results.profile && (
                            <div className="glass-card p-5 mt-8">
                                <h3 className="font-display font-semibold text-sm mb-3 text-text-muted uppercase tracking-wider">Detected Profile</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {Object.entries(results.profile).filter(([k, v]) => v && k !== 'query_intent' && k !== 'special_conditions' && k !== 'error').map(([k, v]) => (
                                        <div key={k} className="text-sm">
                                            <span className="text-text-muted text-xs">{k.replace(/_/g, ' ')}</span>
                                            <p className="font-medium">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

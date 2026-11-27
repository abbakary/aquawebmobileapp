import React, { useState } from 'react'
import {
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react'
import { useS, PLANS } from '../store'
import { Field, tzs } from '../ui'
import { LangToggle } from '../i18n'

const RSTEPS_SW = ['Taarifa za Kampuni', 'Mkurugenzi', 'Matawi', 'Chagua Kifurushi', 'Kamilisha']
const RSTEPS_EN = ['Company Info', 'Director Profile', 'Landing Branches', 'Choose Plan', 'Review & Launch']

export default function Register({ go }) {
  const { x, lang, setLang, t } = useS()
  const RSTEPS = lang === 'sw' ? RSTEPS_SW : RSTEPS_EN

  const [i, setI] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showErr, setShowErr] = useState(false)
  const [apiErr, setApiErr] = useState('')
  const [d, setD] = useState({
    company: '', sector: 'Fish buying & trading', region: 'Mwanza',
    name: '', phone: '', email: '',
    username: '', password: '',
    branches: [{ name: 'Kirumba Landing Pier (Main)', region: 'Mwanza' }],
    plan: 'Business',
  })

  const set = k => e => {
    setShowErr(false)
    setD({ ...d, [k]: e.target.value })
  }
  const sb = (k, v, j) => {
    setShowErr(false)
    setD({ ...d, branches: d.branches.map((b, n) => n === j ? { ...b, [k]: v } : b) })
  }
  const pl = PLANS.find(p => p.id === d.plan)

  const stepErr = [
    !d.company.trim() || !d.region.trim()
      ? t('Tafadhali weka jina la kampuni na mkoa.', 'Please provide company name and region.')
      : '',
    !d.name.trim()
      ? t('Tafadhali weka jina lako kamili.', 'Please enter your full name.')
      : !/^[a-z0-9._]{3,}$/.test(d.username)
        ? t('Jina la mtumiaji: herufi ndogo 3+.', 'Username: 3+ lowercase chars.')
        : d.password.length < 8
          ? t('Nywila lazima iwe na angalau herufi 8.', 'Password must be at least 8 characters.')
          : '',
    d.branches.some(b => !b.name.trim())
      ? t('Weka jina kwa kila tawi.', 'Please name each landing branch.')
      : d.branches.length > pl.branches
        ? t(`Mpango huu unaruhusu matawi ${pl.branches}.`, `Your plan allows ${pl.branches} branch(es).`)
        : '',
    '',
    '',
  ][i]

  const goNext = () => {
    if (stepErr) {
      setShowErr(true)
      return
    }
    setShowErr(false)
    setI(i + 1)
  }

  const goBack = () => {
    setShowErr(false)
    if (i > 0) setI(i - 1)
    else go('')
  }

  const submit = async () => {
    setLoading(true)
    setApiErr('')
    try {
      await x.register({
        company: d.company.trim(),
        name: d.name.trim(),
        username: d.username.trim().toLowerCase(),
        password: d.password,
        phone: d.phone.trim(),
        region: d.region.trim(),
        plan: d.plan,
        branches: d.branches.map(b => ({ name: b.name.trim(), region: (b.region || d.region).trim(), state: {} })),
      })
      go('home')
    } catch (e) {
      setApiErr(e?.message || t('Hitilafu ya usajili. Jaribu tena.', 'Registration failed. Please try again.'))
      setI(1)
    } finally {
      setLoading(false)
    }
  }

  const renderFields = mobile => (
    <>
      {/* Step 0 — Company Info */}
      {i === 0 && (
        <div className="flex flex-col gap-3">
          <Field label={t('Jina la Kampuni / Biashara', 'Company / Trading Business Name')}>
            <input
              value={d.company}
              onChange={set('company')}
              placeholder="e.g. Mara Fish Exporters Co."
              className={`input-field ${mobile ? 'h-12 rounded-xl bg-slate-50/70' : ''}`}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('Sekta', 'Sector Category')}>
              <select
                value={d.sector}
                onChange={set('sector')}
                className={`input-field ${mobile ? 'h-12 rounded-xl bg-slate-50/70' : ''}`}
              >
                <option>Fish buying &amp; trading</option>
                <option>Fish processing factory</option>
                <option>Seafood export supply</option>
                <option>BMU Fisherman Cooperative</option>
              </select>
            </Field>
            <Field label={t('Mkoa wa Makao Makuu', 'HQ Primary Region')}>
              <input
                value={d.region}
                onChange={set('region')}
                placeholder="e.g. Mwanza"
                className={`input-field ${mobile ? 'h-12 rounded-xl bg-slate-50/70' : ''}`}
              />
            </Field>
          </div>
        </div>
      )}

      {/* Step 1 — Director Profile */}
      {i === 1 && (
        <div className="flex flex-col gap-3">
          <Field label={t('Jina Kamili la Mkurugenzi', 'Director / Owner Full Name')}>
            <input
              value={d.name}
              onChange={set('name')}
              placeholder="e.g. John Mwita"
              className={`input-field ${mobile ? 'h-12 rounded-xl bg-slate-50/70' : ''}`}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('Simu (M-Pesa / WhatsApp)', 'Phone (M-Pesa / WhatsApp)')}>
              <input
                type="tel"
                value={d.phone}
                onChange={set('phone')}
                placeholder="0754 111 222"
                className={`input-field font-mono ${mobile ? 'h-12 rounded-xl bg-slate-50/70' : ''}`}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={d.email}
                onChange={set('email')}
                placeholder="director@fishcompany.co.tz"
                className={`input-field ${mobile ? 'h-12 rounded-xl bg-slate-50/70' : ''}`}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('Jina la Mtumiaji', 'Login Username')}>
              <input
                value={d.username}
                autoCapitalize="none"
                placeholder="e.g. owner, juma"
                onChange={e => {
                  setShowErr(false)
                  setD({ ...d, username: e.target.value.toLowerCase() })
                }}
                className={`input-field font-mono ${mobile ? 'h-12 rounded-xl bg-slate-50/70' : ''}`}
              />
            </Field>
            <Field label={t('Nywila (Angalau Herufi 8)', 'Password (8+ chars)')}>
              <input
                type="password"
                value={d.password}
                onChange={set('password')}
                placeholder="••••••••"
                className={`input-field font-mono tracking-widest ${mobile ? 'h-12 rounded-xl bg-slate-50/70' : ''}`}
              />
            </Field>
          </div>
        </div>
      )}

      {/* Step 2 — Branches */}
      {i === 2 && (
        <div className="flex flex-col gap-3">
          {d.branches.map((b, j) => (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5" key={j}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500">
                  {t('Kituo', 'Station')} #{j + 1}
                </span>
                {d.branches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setD({ ...d, branches: d.branches.filter((_, idx) => idx !== j) })}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 size={13} /> {t('Ondoa', 'Remove')}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Field label={t('Jina la Kituo', 'Station Name')}>
                  <input value={b.name} onChange={e => sb('name', e.target.value, j)} className="input-field" />
                </Field>
                <Field label={t('Mkoa / Gati', 'Landing Region / Pier')}>
                  <input value={b.region} placeholder={d.region} onChange={e => sb('region', e.target.value, j)} className="input-field" />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setD({ ...d, branches: [...d.branches, { name: '', region: '' }] })}
            className="btn-secondary text-xs w-full sm:w-fit justify-center"
          >
            <Plus size={14} /> {t('Ongeza Kituo', 'Add Another Station')}
          </button>
        </div>
      )}

      {/* Step 3 — Plan */}
      {i === 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {PLANS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setD({ ...d, plan: p.id })}
              className={`p-3.5 rounded-xl border text-left flex sm:flex-col items-center sm:items-stretch justify-between gap-2 transition ${
                d.plan === p.id
                  ? 'border-[#052d56] bg-blue-50/70 text-blue-950 shadow-sm ring-1 ring-[#052d56]/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div>
                <b className="text-sm block text-slate-900">{p.id}</b>
                <p className="text-[11px] text-slate-600 mt-0.5 mb-0">{p.note}</p>
                <span className="text-[10px] font-mono text-blue-700 font-semibold block mt-1.5">
                  {p.branches > 50 ? t('Bila Kikomo', 'Unlimited') : p.branches} {t('Kituo(s)', 'Station(s)')}
                </span>
              </div>
              <span className="text-sm sm:text-base font-bold font-mono text-[#052d56] shrink-0">
                {tzs(p.price)}<small className="text-[10px] font-sans text-slate-500">/{t('mwezi', 'mo')}</small>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step 4 — Review */}
      {i === 4 && (
        <div className="flex flex-col gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
            {[
              [t('Kampuni:', 'Company:'), `${d.company} (${d.sector})`],
              [t('Mmiliki:', 'Owner:'), `${d.name} (@${d.username})`],
              [t('Vituo:', 'Stations:'), d.branches.map(b => b.name).join(', ')],
              [t('Mpango:', 'Plan:'), `${d.plan} · ${t('Siku 14 Bure', '14 Days Free')}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2 border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-500 shrink-0">{label}</span>
                <b className="text-slate-900 text-right min-w-0 break-words">{value}</b>
              </div>
            ))}
          </div>
          {apiErr && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
              {apiErr}
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-[100dvh] bg-white md:bg-slate-900 flex flex-col">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MOBILE REGISTER WIZARD (< 768px) — Balanced Twin to Mobile Login        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden min-h-[100dvh] bg-white flex flex-col justify-between relative overflow-x-hidden">
        {/* Mobile Top Bar */}
        <div
          className="px-4 pb-1 flex items-center justify-between gap-2 relative z-10 shrink-0"
          style={{ paddingTop: 'calc(10px + env(safe-area-inset-top))' }}
        >
          <button
            type="button"
            onClick={goBack}
            className="min-h-[44px] px-1.5 text-xs font-bold text-[#052d56] flex items-center gap-1"
          >
            <ChevronLeft size={18} />
            <span>{t('Rudi', 'Back')}</span>
          </button>

          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
            {t('Siku 14 Bure', '14 Days Free')}
          </span>

          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* Centered Mobile Registration Body */}
        <div className="flex-1 flex flex-col justify-center px-6 py-3 max-w-sm w-full mx-auto relative z-10">
          {/* Compact Brand & Step Header */}
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-sm flex items-center justify-center mb-2">
              <img
                src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
                alt="AquaCatch FishTrade ERP"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-extrabold text-[#052d56] m-0 leading-tight">
              {t('Fungua Akaunti ya Kampuni', 'Create Company Account')}
            </h1>
            <p className="text-xs text-slate-500 mt-1 mb-0">
              {t(`Hatua ${i + 1} kati ya 5 · ${RSTEPS[i]}`, `Step ${i + 1} of 5 · ${RSTEPS[i]}`)}
            </p>

            {/* Slim 5-step progress bar */}
            <div className="w-full flex items-center gap-1.5 mt-3">
              {RSTEPS.map((stepName, n) => (
                <div
                  key={stepName}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    n < i ? 'bg-emerald-500' : n === i ? 'bg-[#052d56]' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {renderFields(true)}

          {showErr && stepErr && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
              {stepErr}
            </div>
          )}

          {/* Balanced Full-Width Action Buttons */}
          <div className="mt-4 flex flex-col gap-2.5">
            {i < 4 ? (
              <button
                type="button"
                onClick={goNext}
                className="w-full min-h-[48px] rounded-xl bg-[#052d56] hover:bg-[#042242] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-md transition"
              >
                <span>{t('Endelea', 'Continue')}</span>
                <ArrowRight size={17} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-md transition disabled:opacity-60"
              >
                {loading
                  ? <><Loader2 size={17} className="animate-spin" /> {t('Inasajili…', 'Registering…')}</>
                  : <><CheckCircle2 size={17} /> {t('Kamilisha Usajili', 'Complete Registration')}</>}
              </button>
            )}

            {i > 0 && (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center transition"
              >
                &larr; {t('Hatua Iliyopita', 'Previous Step')}
              </button>
            )}
          </div>

          <div className="text-center text-xs text-slate-500 mt-4">
            {t('Tayari una akaunti ya kampuni?', 'Already have a company account?')}{' '}
            <button type="button" onClick={() => go('login')} className="text-[#052d56] font-bold hover:underline">
              {t('Ingia', 'Sign In')}
            </button>
          </div>
        </div>

        {/* Soft Blue Ocean Wave Bottom Decoration */}
        <svg viewBox="0 0 400 64" preserveAspectRatio="none" className="w-full h-14 pointer-events-none shrink-0">
          <path d="M0,28 C90,64 200,8 310,36 C355,48 385,30 400,18 L400,64 L0,64 Z" fill="#18b8b2" fillOpacity="0.32" />
          <path d="M0,42 C110,10 240,60 400,28 L400,64 L0,64 Z" fill="#052d56" fillOpacity="0.16" />
        </svg>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP REGISTER SPLIT SCREEN (>= 768px)                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-row min-h-screen bg-slate-900">
        <div className="relative md:w-5/12 min-h-screen bg-slate-950 flex flex-col justify-between p-12 overflow-hidden">
          <img src="/landing/hero.jpg" alt="Lake Victoria fishermen"
            className="absolute inset-0 w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/40" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-white mb-2">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg overflow-hidden">
                <img src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
                  alt="FishTrade ERP" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-extrabold tracking-tight">AquaCatch</span>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">FishTrade ERP</span>
              </div>
            </div>
            <span className="text-xs font-mono text-blue-300 uppercase tracking-wider">Lake Victoria &amp; Tanganyika</span>
          </div>

          <div className="relative z-10 flex flex-col gap-3 max-w-sm pt-8">
            <h2 className="text-2xl font-bold text-white tracking-tight m-0">
              {t('Weka mfumo wako wa biashara ya samaki ndani ya dakika 2.', 'Set up your commercial seafood ERP in 2 minutes.')}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed m-0">
              {t('Kutoka kwa wavuvi wa pwani hadi mikataba ya viwanda ya mamilioni ya shilingi.', 'Scale from artisanal fishermen to multimillion-shilling factory supply contracts.')}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-2">
              <ShieldCheck size={16} /> {t('Siku 14 Bure · Hakuna Kadi ya Benki', '14 Days Free · No Credit Card Required')}
            </div>
          </div>
        </div>

        <div className="md:w-7/12 flex items-center justify-center p-12 bg-slate-50 overflow-y-auto">
          <div className="w-full max-w-lg flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => go('')} className="text-xs font-bold text-blue-800 hover:underline">
                &larr; {t('Rudi Mwanzo', 'Back to Public Portal')}
              </button>
              <LangToggle lang={lang} setLang={setLang} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">
                {t('Fungua akaunti ya kampuni', 'Create company account')}
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-0">
                {t(`Hatua ${i + 1} kati ya 5: ${RSTEPS[i]}`, `Step ${i + 1} of 5: ${RSTEPS[i]}`)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 text-xs overflow-x-auto no-scrollbar whitespace-nowrap">
              {RSTEPS.map((stepName, n) => (
                <span key={stepName} className={`font-semibold ${n === i ? 'text-blue-700' : n < i ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {n + 1}. {stepName}
                </span>
              ))}
            </div>

            <div className="panel flex flex-col gap-4">
              {renderFields(false)}

              {showErr && stepErr && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
                  {stepErr}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                {i > 0
                  ? <button type="button" onClick={goBack} disabled={loading} className="btn-secondary text-xs">
                      &larr; {t('Rudi', 'Back')}
                    </button>
                  : <div />}
                {i < 4
                  ? <button type="button" onClick={goNext} className="btn-primary text-xs">
                      {t('Endelea', 'Continue')} &rarr;
                    </button>
                  : <button type="button" onClick={submit} disabled={loading}
                      className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 font-bold disabled:opacity-60">
                      {loading
                        ? <><Loader2 size={14} className="animate-spin" /> {t('Inasajili…', 'Registering…')}</>
                        : <><CheckCircle2 size={14} /> {t('Kamilisha Usajili', 'Complete Registration')}</>}
                    </button>}
              </div>
            </div>

            <div className="text-center text-xs text-slate-500">
              {t('Tayari una akaunti ya kampuni?', 'Already have a company account?')}{' '}
              <button type="button" onClick={() => go('login')} className="text-blue-800 font-bold hover:underline">
                {t('Ingia', 'Sign In')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


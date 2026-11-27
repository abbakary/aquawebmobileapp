import React, { useState } from 'react'
import { CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'
import { useS, PLANS } from '../store'
import { Field, tzs } from '../ui'
import { LangToggle } from '../i18n'

const RSTEPS_SW = ['Taarifa za Kampuni', 'Mkurugenzi', 'Matawi', 'Chagua Kifurushi', 'Kamilisha']
const RSTEPS_EN = ['Company Info', 'Director Profile', 'Landing Branches', 'Choose Plan', 'Review & Launch']

export default function Register({ go }) {
  const { x, lang, setLang, t } = useS()
  const RSTEPS = lang === 'sw' ? RSTEPS_SW : RSTEPS_EN

  const [i, setI]           = useState(0)
  const [loading, setLoading] = useState(false)
  const [apiErr, setApiErr]  = useState('')
  const [d, setD]            = useState({
    company: '', sector: 'Fish buying & trading', region: 'Mwanza',
    name: '', phone: '', email: '',
    username: '', password: '',
    branches: [{ name: 'Kirumba Landing Pier (Main)', region: 'Mwanza' }],
    plan: 'Business',
  })

  const set = k => e => setD({ ...d, [k]: e.target.value })
  const sb  = (k, v, j) => setD({ ...d, branches: d.branches.map((b, n) => n === j ? { ...b, [k]: v } : b) })
  const pl  = PLANS.find(p => p.id === d.plan)

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
    '',  // plan step — no validation
    '',  // review step
  ][i]

  const submit = async () => {
    setLoading(true)
    setApiErr('')
    try {
      await x.register({
        company:  d.company.trim(),
        name:     d.name.trim(),
        username: d.username.trim().toLowerCase(),
        password: d.password,
        phone:    d.phone.trim(),
        region:   d.region.trim(),
        plan:     d.plan,
        branches: d.branches.map(b => ({ name: b.name.trim(), region: (b.region || d.region).trim(), state: {} })),
      })
      go('home')
    } catch (e) {
      setApiErr(e?.message || t('Hitilafu ya usajili. Jaribu tena.', 'Registration failed. Please try again.'))
      setI(1)   // jump back to credentials step on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900">
      {/* ── Left Banner ──────────────────────────────────────────────────── */}
      <div className="relative md:w-5/12 min-h-[220px] md:min-h-screen bg-slate-950 flex flex-col justify-between p-8 md:p-12 overflow-hidden">
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

      {/* ── Right Registration Wizard ─────────────────────────────────────── */}
      <div className="md:w-7/12 flex items-center justify-center p-6 md:p-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-lg flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <button onClick={() => go('')} className="text-xs font-bold text-blue-800 hover:underline">
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

          {/* Step indicators */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
            {RSTEPS.map((stepName, n) => (
              <span key={stepName} className={`font-semibold ${n === i ? 'text-blue-700' : n < i ? 'text-emerald-600' : 'text-slate-400'}`}>
                {n + 1}. {stepName}
              </span>
            ))}
          </div>

          <div className="panel flex flex-col gap-4">
            {/* Step 0 — Company Info */}
            {i === 0 && (<>
              <Field label={t('Jina la Kampuni / Biashara', 'Company / Trading Business Name')}>
                <input value={d.company} onChange={set('company')}
                  placeholder="e.g. Mara Fish Exporters Co." className="input-field" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('Sekta', 'Sector Category')}>
                  <select value={d.sector} onChange={set('sector')} className="input-field">
                    <option>Fish buying &amp; trading</option>
                    <option>Fish processing factory</option>
                    <option>Seafood export supply</option>
                    <option>BMU Fisherman Cooperative</option>
                  </select>
                </Field>
                <Field label={t('Mkoa wa Makao Makuu', 'HQ Primary Region')}>
                  <input value={d.region} onChange={set('region')} placeholder="e.g. Mwanza" className="input-field" />
                </Field>
              </div>
            </>)}

            {/* Step 1 — Director Profile */}
            {i === 1 && (<>
              <Field label={t('Jina Kamili la Mkurugenzi', 'Director / Owner Full Name')}>
                <input value={d.name} onChange={set('name')}
                  placeholder="e.g. John Mwita" className="input-field" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('Simu (M-Pesa / WhatsApp)', 'Phone (M-Pesa / WhatsApp)')}>
                  <input type="tel" value={d.phone} onChange={set('phone')}
                    placeholder="0754 111 222" className="input-field font-mono" />
                </Field>
                <Field label="Email">
                  <input type="email" value={d.email} onChange={set('email')}
                    placeholder="director@fishcompany.co.tz" className="input-field" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('Jina la Mtumiaji', 'Login Username')}>
                  <input value={d.username} autoCapitalize="none"
                    placeholder="e.g. owner, juma"
                    onChange={e => setD({ ...d, username: e.target.value.toLowerCase() })}
                    className="input-field font-mono" />
                </Field>
                <Field label={t('Nywila (Angalau Herufi 8)', 'Password (8+ chars)')}>
                  <input type="password" value={d.password} onChange={set('password')}
                    placeholder="••••••••" className="input-field font-mono tracking-widest" />
                </Field>
              </div>
            </>)}

            {/* Step 2 — Branches */}
            {i === 2 && (
              <div className="flex flex-col gap-3">
                {d.branches.map((b, j) => (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl" key={j}>
                    <Field label={`${t('Kituo', 'Station')} ${j + 1} ${t('Jina', 'Name')}`}>
                      <input value={b.name} onChange={e => sb('name', e.target.value, j)} className="input-field" />
                    </Field>
                    <Field label={t('Mkoa / Gati', 'Landing Region / Pier')}>
                      <input value={b.region} placeholder={d.region} onChange={e => sb('region', e.target.value, j)} className="input-field" />
                    </Field>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setD({ ...d, branches: [...d.branches, { name: '', region: '' }] })}
                  className="btn-secondary text-xs w-fit">
                  + {t('Ongeza Kituo', 'Add Another Station')}
                </button>
              </div>
            )}

            {/* Step 3 — Plan */}
            {i === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map(p => (
                  <div key={p.id} onClick={() => setD({ ...d, plan: p.id })}
                    className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                      d.plan === p.id ? 'border-blue-700 bg-blue-50/70 text-blue-950 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}>
                    <div>
                      <b className="text-sm block">{p.id}</b>
                      <span className="text-lg font-bold font-mono text-slate-900 block mt-1">{tzs(p.price)}/{t('mwezi', 'mo')}</span>
                      <p className="text-[11px] text-slate-600 mt-2 mb-0">{p.note}</p>
                    </div>
                    <span className="text-[10px] font-mono text-blue-700 font-semibold block mt-3">
                      {p.branches > 50 ? t('Bila Kikomo', 'Unlimited') : p.branches} {t('Kituo(s)', 'Station(s)')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4 — Review */}
            {i === 4 && (
              <div className="flex flex-col gap-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                  {[
                    [t('Jina la Kampuni:', 'Company Name:'), `${d.company} (${d.sector})`],
                    [t('Akaunti ya Mmiliki:', 'Owner Account:'), `${d.name} (@${d.username})`],
                    [t('Vituo vya Kutua:', 'Initial Stations:'), d.branches.map(b => b.name).join(', ')],
                    [t('Mpango Uliochaguliwa:', 'Selected Plan:'), `${d.plan} · ${t('Siku 14 Bure', '14 Days Free')}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                      <span className="text-slate-500">{label}</span>
                      <b className="text-slate-900 text-right max-w-[55%]">{value}</b>
                    </div>
                  ))}
                </div>
                {apiErr && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
                    {apiErr}
                  </div>
                )}
              </div>
            )}

            {/* Per-step validation error */}
            {stepErr && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
                {stepErr}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-2">
              {i > 0
                ? <button type="button" onClick={() => setI(i - 1)} disabled={loading} className="btn-secondary text-xs">
                    &larr; {t('Rudi', 'Back')}
                  </button>
                : <div />}
              {i < 4
                ? <button type="button" disabled={!!stepErr} onClick={() => setI(i + 1)} className="btn-primary text-xs">
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
            <button onClick={() => go('login')} className="text-blue-800 font-bold hover:underline">
              {t('Ingia', 'Sign In')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

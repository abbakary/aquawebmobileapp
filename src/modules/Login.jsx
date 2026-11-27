import React, { useState } from 'react'
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'
import { useS } from '../store'
import { Field } from '../ui'
import { LangToggle } from '../i18n'

export default function Login({ go }) {
  const { x, lang, setLang, t } = useS()
  const [u, setU]       = useState('')
  const [p, setP]       = useState('')
  const [err, setErr]   = useState('')
  const [loading, setLoading] = useState(false)

  const sub = async () => {
    if (!u.trim() || !p.trim()) { setErr(t('Tafadhali weka jina la mtumiaji na nywila.', 'Please enter username and password.')); return }
    setLoading(true)
    setErr('')
    try {
      await x.login(u.trim().toLowerCase(), p.trim())
      go('home')           // navigate to dashboard on success
    } catch (e) {
      setErr(e?.message || t('Jina la mtumiaji au nywila si sahihi.', 'Incorrect username or password.'))
    } finally {
      setLoading(false)
    }
  }

  const key = e => e.key === 'Enter' && sub()
  const fill = (usr, pwd) => { setU(usr); setP(pwd); setErr('') }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900">
      {/* ── Left Banner ──────────────────────────────��───────────────────── */}
      <div className="relative md:w-1/2 min-h-[240px] md:min-h-screen bg-slate-950 flex flex-col justify-between p-8 md:p-12 overflow-hidden">
        <img src="/landing/hero.jpg" alt="Lake Victoria fishermen"
          className="absolute inset-0 w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-900/20" />

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
          <span className="text-xs font-mono text-blue-300 uppercase tracking-wider">
            {t('Biashara ya Samaki Tanzania', 'Tanzania Seafood Supply Chain')}
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-3 max-w-md pt-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight m-0">
            {t('Biashara ya uhakika kutoka mwalo hadi kiwandani.', 'Precision fish trade from beach to factory gate.')}
          </h2>
          <p className="text-xs md:text-sm text-slate-200 leading-relaxed m-0">
            {t('Simamia matawi yote ya ununuzi wa samaki kwa urahisi.', 'Seamless multi-branch operations for Lake Victoria fish buying companies.')}
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-2">
            <ShieldCheck size={16} /> {t('Inakidhi Viwango vya FiRCIS na GS1', 'FiRCIS & GS1 Traceability Compliant')}
          </div>
        </div>
      </div>

      {/* ── Right Login Form ──────────────────────────────────────────────── */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-slate-50">
        <div className="w-full max-w-md flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <button onClick={() => go('')} className="text-xs font-bold text-blue-800 hover:underline">
              &larr; {t('Rudi Mwanzo', 'Back to Public Portal')}
            </button>
            <LangToggle lang={lang} setLang={setLang} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 m-0">
              {t('Ingia kwenye mfumo', 'Sign in to workspace')}
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-0">
              {t('Weka jina lako la mtumiaji na nywila yako.', 'Enter your username and password.')}
            </p>
          </div>

          <div className="panel flex flex-col gap-4">
            <Field label={t('Jina la Mtumiaji', 'Username')}>
              <input
                type="text" value={u} autoCapitalize="none"
                placeholder={t('mf. owner, juma', 'e.g. owner, juma')}
                onChange={e => { setU(e.target.value); setErr('') }}
                onKeyDown={key}
                className="input-field font-semibold"
                disabled={loading}
              />
            </Field>

            <Field label={t('Nywila', 'Password')}>
              <input
                type="password" value={p}
                placeholder="••••••••"
                onChange={e => { setP(e.target.value); setErr('') }}
                onKeyDown={key}
                className="input-field font-mono font-bold tracking-widest"
                disabled={loading}
              />
            </Field>

            {err && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
                {err}
              </div>
            )}

            <button
              onClick={sub}
              disabled={loading}
              className="btn-primary w-full py-3 justify-center text-sm font-bold shadow-sm disabled:opacity-60"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> {t('Inaingia…', 'Signing in…')}</>
                : <>{t('Ingia Kwenye Kituo', 'Sign In to Station')} <ArrowRight size={16} /></>}
            </button>
          </div>

          {/* Quick-fill accounts — only shown in development */}
          {import.meta.env.DEV && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-2.5 text-xs">
              <b className="text-slate-800 uppercase tracking-wide text-[11px]">
                {t('Akaunti za Majaribio (Bofya Kuingia):', 'Demo Credentials (click to fill):')}
              </b>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { usr: 'owner',   pwd: 'password123', sw: 'Mmiliki wa Kampuni', en: 'Company Owner' },
                  { usr: 'manager', pwd: 'password123', sw: 'Mkurugenzi Mkuu',    en: 'General Manager' },
                  { usr: 'juma',    pwd: 'password123', sw: 'Afisa Manunuzi',     en: 'Purchasing Officer' },
                  { usr: 'neema',   pwd: 'password123', sw: 'Mkaguzi wa Ubora',   en: 'Quality Inspector' },
                ].map(acc => (
                  <button key={acc.usr} type="button"
                    onClick={() => fill(acc.usr, acc.pwd)}
                    className="p-2 text-left rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition">
                    <strong className="block text-slate-900">{t(acc.sw, acc.en)}</strong>
                    <span className="text-[11px] text-slate-500 font-mono">{acc.usr} / {acc.pwd}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 m-0">
                {t('Akaunti hizi zinaonekana wakati wa maendeleo tu.', 'These accounts are visible in development mode only.')}
              </p>
            </div>
          )}

          <div className="text-center text-xs text-slate-500">
            {t('Unahitaji kusajili kampuni mpya ya samaki?', 'Need to register a new fish trading company?')}{' '}
            <button onClick={() => go('register')} className="text-blue-800 font-bold hover:underline">
              {t('Fungua akaunti', 'Create an account')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

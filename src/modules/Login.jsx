import React, { useState } from 'react'
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  User,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  WifiOff
} from 'lucide-react'
import { useS } from '../store'
import { useDevice } from '../device'
import { Field, Modal } from '../ui'
import { LangToggle } from '../i18n'

export default function Login({ go }) {
  const { x, lang, setLang, t } = useS()
  const device = useDevice()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const sub = async () => {
    if (!u.trim() || !p.trim()) {
      setErr(t('Tafadhali weka jina la mtumiaji na nywila.', 'Please enter username and password.'))
      return
    }
    setLoading(true)
    setErr('')
    try {
      await x.login(u.trim().toLowerCase(), p.trim())
      go('home')
    } catch (e) {
      setErr(e?.message || t('Jina la mtumiaji au nywila si sahihi.', 'Incorrect username or password.'))
    } finally {
      setLoading(false)
    }
  }

  const key = e => e.key === 'Enter' && sub()
  const fill = (usr, pwd) => { setU(usr); setP(pwd); setErr('') }

  return (
    <div className="min-h-[100dvh] bg-white md:bg-slate-900 flex flex-col">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MOBILE LOGIN SCREEN (< 768px) — Matches Reference Screen 2              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden min-h-[100dvh] bg-white flex flex-col justify-between relative overflow-x-hidden">
        <div
          className="px-4 pb-1 flex items-center justify-between relative z-10 shrink-0"
          style={{ paddingTop: 'calc(10px + env(safe-area-inset-top))' }}
        >
          <button
            type="button"
            onClick={() => go('')}
            className="min-h-[44px] px-1.5 text-xs font-bold text-[#052d56] flex items-center gap-1"
          >
            <ChevronLeft size={18} />
            <span>{t('Rudi', 'Back')}</span>
          </button>
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-3 max-w-sm w-full mx-auto relative z-10">
          {/* Centered Brand Logo */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-sm flex items-center justify-center mb-2">
              <img
                src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
                alt="AquaCatch FishTrade ERP"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-extrabold text-[#052d56] tracking-tight leading-none">
              AquaCatch
            </span>
            <span className="text-[11px] font-bold text-[#18b8b2] uppercase tracking-wider mt-1">
              FishTrade ERP
            </span>

            <h1 className="text-[22px] font-extrabold text-slate-900 mt-4 mb-1 leading-tight">
              {t('Karibu Tena', 'Welcome Back')}
            </h1>
            <p className="text-xs text-slate-500 m-0">
              {t('Ingia kusimamia biashara yako ya samaki', 'Sign in to manage your fish business')}
            </p>
          </div>

          {!device.isOnline && (
            <div className="mb-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <WifiOff size={15} className="shrink-0 text-amber-600" />
              <span>{t('Haupo mtandaoni. Unahitaji mtandao kuingia mara ya kwanza.', 'Currently offline. Internet is required for initial sign in.')}</span>
            </div>
          )}

          {/* Icon-prefixed inputs */}
          <div className="space-y-3">
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={u}
                autoCapitalize="none"
                autoComplete="username"
                placeholder={t('Jina la mtumiaji au barua pepe', 'Username or email')}
                onChange={e => { setU(e.target.value); setErr('') }}
                onKeyDown={key}
                disabled={loading}
                className="input-field !pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/70 font-medium"
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                value={p}
                autoComplete="current-password"
                placeholder={t('Nywila', 'Password')}
                onChange={e => { setP(e.target.value); setErr('') }}
                onKeyDown={key}
                disabled={loading}
                className="input-field !pl-11 !pr-11 h-12 rounded-xl border-slate-200 bg-slate-50/70 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs min-h-[36px]">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-[#052d56]"
                />
                <span>{t('Nikumbuke', 'Remember me')}</span>
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sky-700 font-semibold hover:underline py-1"
              >
                {t('Umesahau nywila?', 'Forgot password?')}
              </button>
            </div>

            {err && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                {err}
              </div>
            )}

            <button
              type="button"
              onClick={sub}
              disabled={loading}
              className="w-full min-h-[48px] rounded-xl bg-[#052d56] hover:bg-[#042242] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-md transition disabled:opacity-60"
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> {t('Inaingia…', 'Signing in…')}</>
                : <>{t('Ingia', 'Sign In')}</>}
            </button>

            <button
              type="button"
              onClick={() => go('register')}
              className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center transition"
            >
              {t('Fungua Akaunti Mpya', 'Create an Account')}
            </button>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-3 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setShowDemo(v => !v)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 py-1.5 px-3 rounded-full"
              >
                {showDemo
                  ? t('Ficha Akaunti za Majaribio', 'Hide Demo Accounts')
                  : t('Akaunti za Majaribio (Demo)', 'Quick Demo Credentials')}
              </button>
              {showDemo && (
                <div className="mt-1.5 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { usr: 'owner', pwd: 'password123', en: 'Owner' },
                    { usr: 'manager', pwd: 'password123', en: 'Manager' },
                    { usr: 'juma', pwd: 'password123', en: 'Purchasing' },
                    { usr: 'neema', pwd: 'password123', en: 'Inspector' },
                  ].map(acc => (
                    <button
                      key={acc.usr}
                      type="button"
                      onClick={() => { fill(acc.usr, acc.pwd); setShowDemo(false) }}
                      className="px-2.5 py-2 text-left rounded-lg bg-white border border-slate-200 hover:border-blue-400"
                    >
                      <strong className="block text-slate-900">{acc.en}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">{acc.usr}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Soft Blue Ocean Wave Bottom Decoration */}
        <svg viewBox="0 0 400 64" preserveAspectRatio="none" className="w-full h-14 pointer-events-none shrink-0">
          <path d="M0,28 C90,64 200,8 310,36 C355,48 385,30 400,18 L400,64 L0,64 Z" fill="#18b8b2" fillOpacity="0.32" />
          <path d="M0,42 C110,10 240,60 400,28 L400,64 L0,64 Z" fill="#052d56" fillOpacity="0.16" />
        </svg>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP LOGIN SPLIT SCREEN (>= 768px)                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-row min-h-screen bg-slate-900">
        <div className="relative md:w-1/2 min-h-screen bg-slate-950 flex flex-col justify-between p-12 overflow-hidden">
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
            <h2 className="text-3xl font-extrabold text-white tracking-tight m-0">
              {t('Biashara ya uhakika kutoka mwalo hadi kiwandani.', 'Precision fish trade from beach to factory gate.')}
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed m-0">
              {t('Simamia matawi yote ya ununuzi wa samaki kwa urahisi.', 'Seamless multi-branch operations for Lake Victoria fish buying companies.')}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-2">
              <ShieldCheck size={16} /> {t('Inakidhi Viwango vya FiRCIS na GS1', 'FiRCIS & GS1 Traceability Compliant')}
            </div>
          </div>
        </div>

        <div className="md:w-1/2 flex items-center justify-center p-12 bg-slate-50">
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
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={p}
                    placeholder="••••••••"
                    onChange={e => { setP(e.target.value); setErr('') }}
                    onKeyDown={key}
                    className="input-field font-mono font-bold tracking-widest !pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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

      {forgotOpen && (
        <Modal
          title={t('Msaada wa Nywila', 'Password Reset Help')}
          onClose={() => setForgotOpen(false)}
          maxWidth="max-w-sm"
        >
          <p className="text-xs text-slate-600 leading-relaxed m-0">
            {t(
              'Kwa usalama wa kituo, nywila za wafanyakazi zinabadilishwa na Mmiliki au Mkurugenzi kwenye moduli ya "Wafanyakazi & Majukumu".',
              'For station security, staff passwords are reset by your Company Owner or General Manager inside the "Staff & Roles" module.'
            )}
          </p>
        </Modal>
      )}
    </div>
  )
}

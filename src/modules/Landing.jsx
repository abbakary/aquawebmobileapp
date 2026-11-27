import React, { useState } from 'react'
import {
  Fish,
  Scale,
  Warehouse,
  ShieldCheck,
  Truck,
  Building2,
  QrCode,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Award,
  WifiOff,
  Smartphone
} from 'lucide-react'
import { PLANS, useS } from '../store'
import { useDevice } from '../device'
import { FishPhoto, tzs, PWAInstallButton } from '../ui'
import { LangToggle } from '../i18n'

const getFeatures = t => [
  {
    icon: Scale,
    title: t('Manunuzi ya Mwaloni & Mizani', 'Landing Site Purchasing & Scales'),
    desc: t('Rekodi samaki kutoka kwa wavuvi chini ya sekunde 60 kwa mizani ya kidijitali, aina za samaki, na hesabu ya bei moja kwa moja.', 'Capture catch from fishermen in under 60 seconds with digital scale integration, species classification, and automatic price calculations.')
  },
  {
    icon: Warehouse,
    title: t('Vyumba vya Baridi & Ufuatiliaji wa Mizigo', 'Cold Storage & Lot Tracking'),
    desc: t('Stoo ya vyumba vingi (0°C hadi -18°C) kwa mpangilio wa FIFO, gharama halisi kwa kilo, na udhibiti wa samaki wanaoharibika.', 'Multi-chamber inventory (0°C to -18°C blast freezers) with FIFO lot segregation, landed cost per kg, and spoilage write-offs.')
  },
  {
    icon: ShieldCheck,
    title: t('Ukaguzi wa Ubora (HACCP)', 'HACCP Quality Inspection'),
    desc: t('Hakikisha vipimo vya ubora na joto la kupokelea (< 4.0°C). Samaki wasio na ubora wanazuiwa kuingia kwenye mauzo.', 'Enforce organoleptic testing and reception temperature probe logs (< 4.0°C). Substandard fish is locked out from saleable stock.')
  },
  {
    icon: Building2,
    title: t('Mauzo ya Viwandani', 'Industry Processing Sales'),
    desc: t('Uza kwenye viwanda vikubwa (ABC Processing, Lake Victoria Perch) kwa ukomo wa mikopo, ankara, na ufuatiliaji kamili.', 'Supply industrial factories (ABC Processing, Lake Victoria Perch) with credit limits, commercial invoices, and automated batch traceability.')
  },
  {
    icon: Truck,
    title: t('Magari ya Baridi ya Usafirishaji', 'Refrigerated Transport Fleet'),
    desc: t('Fuatilia magari ya baridi ya tani 1–3, joto safarini, gharama za usafiri, na uthibitisho wa kufikisha mzigo.', 'Monitor 1–3 ton KYC refrigerated carriers, transit temperatures, route freight expenses, and driver delivery confirmations.')
  },
  {
    icon: QrCode,
    title: t('Ufuatiliaji wa GS1 QR', 'End-to-End GS1 Traceability'),
    desc: t('Kila kilo ina namba ya QR inayounganisha mvuvi, mwalo, mkaguzi wa ubora, na kiwanda kilichopokea.', 'Every kilogram has a unique QR batch code connecting the fisherman, landing beach, inspector, and delivery factory.')
  }
]

const getFaqs = t => [
  {
    q: t('Je, FishTrade ERP inafanya kazi bila intaneti mwaloni?', 'Does FishTrade ERP work offline at remote lake landing beaches?'),
    a: t('Ndiyo. Mfumo huu ni PWA inayohifadhi data kwenye simu au kompyuta. Maafisa wa manunuzi wanaweza kupima samaki na kutoa risiti hata mtandao ukikatika, kisha data hujituma yenyewe mtandao ukirudi.', 'Yes. The application is built as a Progressive Web App (PWA) with local caching. Purchasing officers can record fish catches, scale weights, and issue offline vouchers even when cellular data drops, automatically syncing upon reconnection.')
  },
  {
    q: t('Je, wakurugenzi wanaweza kufuatilia mialo mingi kwa wakati mmoja?', 'Can company directors monitor multiple landing sites across Tanzania?'),
    a: t('Ndiyo kabisa. Vifurushi vya Business na Enterprise vinaonyesha takwimu za matawi yote kwa pamoja—Mwanza, Kigoma, Musoma, na Bukoba—ikiwemo uzito, faida, na madeni ya wavuvi.', 'Absolutely. The Business and Enterprise tiers provide unified multi-branch analytics, allowing owners to compare volume, margins, landed costs, and supplier payables across Mwanza, Kigoma, Musoma, and Bukoba in real time.')
  },
  {
    q: t('Je, FishTrade inachukua nafasi ya vibali vya serikali vya FiRCIS?', 'Does FishTrade replace official government FiRCIS permits?'),
    a: t('Hapana. FishTrade ERP inasaidia mfumo wa FiRCIS wa Wizara ya Mifugo na Uvuvi kwa kuhifadhi namba za vibali, vyeti vya afya, na kukutuma taarifa kabla muda wa kibali kuisha.', 'No. FishTrade ERP complements Tanzania’s Ministry of Livestock & Fisheries FiRCIS platform by archiving permit numbers, sanitary certificates, and inspection clearances, sending automated notifications before renewals expire.')
  },
  {
    q: t('Ni njia gani za malipo zinazotumika kulipa wavuvi?', 'What payment channels are supported for fishermen?'),
    a: t('Mfumo unarekodi malipo ya M-Pesa, Airtel Money, Tigo Pesa, benki (CRDB / NMB), na pesa taslimu, na kusasisha salio la kila mvuvi moja kwa moja.', 'The system natively reconciles M-Pesa, Airtel Money, Tigo Pesa, bank transfers (CRDB / NMB), and cash vouchers, automatically keeping each fisherman’s outstanding ledger balance accurate.')
  }
]

const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export default function Landing({ go: nav }) {
  const { lang, setLang, t } = useS()
  const device = useDevice()
  const [slideIdx, setSlideIdx] = useState(0)

  const slides = [
    {
      img: '/landing/hero.jpg',
      caption: t('Ukusanyaji wa Samaki Mwaloni', 'Landing Site Procurement & Weighing')
    },
    {
      img: '/photos/cold-storage.png',
      caption: t('Stoo ya Vyumba Baridi (0°C – -18°C)', 'Cold Room Storage & FIFO Batches')
    },
    {
      img: '/photos/refrigerated-truck.png',
      caption: t('Usafirishaji wa Baridi Kiwandani', 'Cold Chain Industry Dispatch')
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MOBILE WELCOME / SPLASH VIEW (< 768px) — Matches Reference Screen 1     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="md:hidden min-h-[100dvh] bg-gradient-to-b from-[#042242] via-[#06325f] to-[#083b6b] text-white flex flex-col justify-between relative overflow-hidden">
        {/* Top bar: Language & Device Readiness */}
        <div
          className="px-5 pt-4 flex items-center justify-between relative z-10"
          style={{ paddingTop: 'calc(14px + env(safe-area-inset-top))' }}
        >
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-200 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
            <Smartphone size={12} />
            {device.isIOS ? 'iPhone Ready' : device.isAndroid ? 'Android Ready' : 'Mobile PWA'}
          </span>
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* Center Brand + Copy + Arched Photo */}
        <div className="px-6 pt-4 pb-2 flex flex-col items-center text-center relative z-10 flex-1 justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-xl flex items-center justify-center mb-3">
            <img
              src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
              alt="AquaCatch FishTrade ERP"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white m-0 leading-tight">
            AquaCatch
          </h1>
          <span className="text-sm font-bold text-sky-200 tracking-wide mt-0.5">
            FishTrade ERP
          </span>
          <p className="text-xs text-slate-200/95 max-w-[280px] leading-relaxed mt-3 mb-5">
            {t(
              'Manunuzi ya Samaki, Stoo Baridi, Usambazaji & Usimamizi wa Fedha (Online & Offline)',
              'Fish Procurement, Inventory, Distribution & Financial Management'
            )}
          </p>

          {/* Rounded Hero Image Card */}
          <div className="w-full max-w-[320px] h-48 rounded-t-[28px] rounded-b-2xl overflow-hidden border border-white/20 shadow-2xl relative bg-slate-900">
            <img
              src={slides[slideIdx].img}
              alt={slides[slideIdx].caption}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#042242]/90 via-[#042242]/40 to-transparent px-3 py-2.5 text-left">
              <span className="text-[11px] font-semibold text-white">{slides[slideIdx].caption}</span>
            </div>
          </div>

          {/* Slide Dots */}
          <div className="flex items-center gap-2 mt-4">
            {slides.map((sl, i) => (
              <button
                key={sl.img}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setSlideIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  slideIdx === i ? 'w-5 bg-[#18b8b2]' : 'w-2 bg-white/35'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Curved Ocean Wave & Primary CTAs */}
        <div className="relative z-10 px-6 pb-7 pt-4" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
          <svg
            viewBox="0 0 400 70"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -top-10 inset-x-0 w-full h-14 opacity-40"
          >
            <path d="M0,40 C95,5 210,65 320,25 C360,10 385,20 400,32 L400,70 L0,70 Z" fill="#18b8b2" />
          </svg>

          <div className="flex flex-col gap-2.5 max-w-[340px] mx-auto">
            <button
              type="button"
              onClick={() => nav('register')}
              className="w-full min-h-[50px] rounded-full bg-[#18b8b2] hover:bg-[#149f9a] text-[#042242] font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-lg transition"
            >
              <span>{t('Anza Sasa', 'Get Started')}</span>
              <ArrowRight size={18} />
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => nav('login')}
                className="min-h-[44px] rounded-full bg-white/12 hover:bg-white/20 border border-white/25 text-white font-bold text-xs flex items-center justify-center transition"
              >
                {t('Ingia Akaunti', 'Sign In')}
              </button>
              <button
                type="button"
                onClick={() => scrollTo('features')}
                className="min-h-[44px] rounded-full bg-transparent hover:bg-white/10 border border-white/15 text-sky-100 font-semibold text-xs flex items-center justify-center gap-1 transition"
              >
                <span>{t('Vipengele', 'Explore')}</span>
                <ChevronDown size={14} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-sky-200/90">
              <span className="flex items-center gap-1">
                <WifiOff size={12} className="text-[#18b8b2]" /> {t('Inafanya Kazi Offline', 'Works Offline')}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-[#18b8b2]" /> FiRCIS & GS1
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP TOP BAR & HERO (>= 768px)                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <header className="hidden md:block sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-sm overflow-hidden">
              <img
                src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
                alt="AquaCatch FishTrade ERP"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                AquaCatch
              </span>
              <span className="text-[11px] font-bold text-blue-700 tracking-wide uppercase">
                FishTrade ERP
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-7 text-sm font-semibold text-slate-600">
            <button onClick={() => scrollTo('features')} className="hover:text-blue-800 transition whitespace-nowrap">
              {t('Vipengele', 'Features')}
            </button>
            <button onClick={() => scrollTo('traceability')} className="hover:text-blue-800 transition whitespace-nowrap">
              {t('Ufuatiliaji', 'Traceability')}
            </button>
            <button onClick={() => scrollTo('fleet')} className="hover:text-blue-800 transition whitespace-nowrap">
              {t('Usafiri Baridi', 'Cold Chain')}
            </button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-blue-800 transition whitespace-nowrap">
              {t('Bei', 'Pricing')}
            </button>
            <button onClick={() => scrollTo('faq')} className="hover:text-blue-800 transition whitespace-nowrap">
              {t('Maswali', 'FAQ')}
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton />
            <LangToggle lang={lang} setLang={setLang} />
            <button
              onClick={() => nav('login')}
              className="text-xs font-bold text-slate-700 hover:text-blue-800 px-3 py-2 transition"
            >
              {t('Ingia', 'Sign In')}
            </button>
            <button
              onClick={() => nav('register')}
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              {t('Anza Bure', 'Start Free Trial')}
            </button>
          </div>
        </div>
      </header>

      <section className="hidden md:block relative bg-sky-950 text-white overflow-hidden py-16 lg:py-20 border-b border-slate-800">
        <img
          src="/landing/hero.jpg"
          alt={t('Wavuvi wa Tanzania wakifika mwalo wa Ziwa Victoria', 'Tanzanian fishermen arriving at Lake Victoria landing site')}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-100 brightness-105 contrast-105 saturate-110 animate-hero-pan"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/80 backdrop-blur-md border border-blue-300/40 text-white text-xs font-semibold w-fit shadow-sm">
              <Award size={14} className="text-amber-300" />{' '}
              {t('Mfumo Maalum kwa Biashara ya Samaki Tanzania na Ziwa Victoria', 'Purpose-Built for Tanzania Seafood Trade & Lake Victoria Fisheries')}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
              {t(
                'Simamia biashara yako ya samaki kutoka mwalo hadi kiwandani.',
                'Run your fish buying operations from the landing beach to the factory gate.'
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-100 max-w-2xl leading-relaxed drop-shadow">
              {t(
                'Ondoa daftari za karatasi na hasara. Rekodi manunuzi ya wavuvi, stoo za baridi, ukaguzi wa ubora, na mauzo ya viwanda katika mfumo mmoja.',
                'Eliminate paper weighing logs and lost profits. Digitize fishermen purchases, cold room inventory, HACCP quality checks, and industrial factory dispatches in one unified system.'
              )}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => nav('register')}
                className="btn-primary text-sm py-3 px-6 bg-emerald-600 hover:bg-emerald-500 font-bold shadow-lg shadow-emerald-950/40"
              >
                {t('Fungua Akaunti ya Kampuni', 'Launch Company ERP')} <ArrowRight size={16} />
              </button>
              <button
                onClick={() => nav('login')}
                className="btn-secondary text-sm py-3 px-5 bg-slate-900/70 text-white border-white/35 hover:bg-slate-900/90 backdrop-blur-md"
              >
                {t('Ingia Kwenye Kituo', 'Sign In to Branch')}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-white/90 font-medium drop-shadow">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400" /> {t('Siku 14 Bure', '14-Day Free Trial')}</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400" /> {t('Inakidhi FiRCIS', 'FiRCIS Compliant')}</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400" /> {t('Inafanya Kazi Bila Intaneti', 'Offline PWA Ready')}</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-sky-300/35 bg-gradient-to-br from-sky-900/75 via-blue-950/75 to-slate-950/80 backdrop-blur-md p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Fish size={14} className="text-emerald-400" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-sky-200 font-semibold">
                    {t('Sangara · Ziwa Victoria', 'Lates niloticus · Lake Victoria')}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/25 text-sky-200 border border-sky-400/40">
                  {t('DARAJA A', 'EXPORT GRADE A')}
                </span>
              </div>

              <div className="relative h-36 sm:h-40 rounded-xl overflow-hidden bg-gradient-to-b from-sky-500/20 via-blue-700/25 to-slate-950/60 border border-white/10 flex items-center justify-center">
                <div className="w-4/5 h-full flex items-center justify-center animate-swim-nile-perch">
                  <img
                    src="/fish/nile-perch.jpg"
                    alt={t('Sangara Mbichi wa Ziwa Victoria', 'Fresh Lake Victoria Nile Perch')}
                    className="w-full h-32 object-cover rounded-xl shadow-lg border border-white/20 brightness-105 contrast-105"
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-sky-300/15 to-transparent animate-water-shimmer" />
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-200 font-semibold">{t('Sangara Mbichi (Nile Perch)', 'Fresh Nile Perch (Sangara)')}</span>
                <span className="font-mono text-emerald-300 font-bold">{t('Baridi 0°C – 2°C', '0°C – 2°C Chilled')}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300">{t('Mnyororo wa Ziwa Victoria', 'Lake Victoria Value Chain')}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-900/70 text-emerald-300 border border-emerald-600/60">
                  {t('TAKWIMU ZA SASA', 'LIVE CATCH DATA')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <small className="text-slate-300 text-xs block">{t('Uzito kwa Mwezi', 'Monthly Volume')}</small>
                  <b className="text-xl font-mono text-white">12,500 <span className="text-xs text-slate-300">kg</span></b>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <small className="text-slate-300 text-xs block">{t('Faida Ghafi', 'Gross Profit')}</small>
                  <b className="text-xl font-mono text-emerald-400">TZS 18.5M</b>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <FishPhoto sp="Nile Perch" size={34} className="ring-2 ring-slate-900" />
                    <FishPhoto sp="Tilapia" size={34} className="ring-2 ring-slate-900" />
                    <FishPhoto sp="Dagaa (Sardines)" size={34} className="ring-2 ring-slate-900" />
                  </div>
                  <div className="text-xs">
                    <b className="text-white block">{t('Aina za Samaki', 'Commercial Species')}</b>
                    <span className="text-slate-300">{t('Sangara, Sato na Dagaa', 'Nile Perch, Tilapia & Dagaa')}</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-sky-300 font-bold">{t('Ubora wa Daraja A', 'Grade A Verified')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shared Features, Traceability, Fleet, Pricing & FAQ Sections */}
      <section className="py-12 md:py-20 max-w-7xl mx-auto px-5 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-2">
            {t('Fursa ya Kibiashara', 'The Commercial Opportunity')}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            {t('Acha kupoteza kilo na fedha kwenye madaftari ya karatasi.', 'Stop losing kilograms and shillings in handwritten paper logs.')}
          </h2>
          <p className="text-slate-600 text-sm mt-3">
            {t('Katika sekta ya uvuvi Tanzania, wafanyabiashara hupoteza faida nyingi kutokana na uzito usio sahihi, madeni yaliyosahaulika, na upotevu kwenye vyumba vya baridi.', 'In Tanzania’s fishing sector, traders lose substantial margins to unverified dock weights, forgotten supplier debts, unmonitored cold storage shrinkage, and delivery disputes.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="p-6 md:p-8 rounded-2xl bg-rose-50/50 border border-rose-200 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">{t('Zamani · Madaftari ya Karatasi', 'Before · Traditional Paper Management')}</span>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 m-0">{t('Hesabu Zisizo Sahihi & Hasara', 'Inaccurate Books & Untraceable Losses')}</h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-700 m-0 p-0 list-none">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-600 font-bold">✕</span> {t('Uzito wa wavuvi kuandikwa kwenye karatasi zinazolowa maji au kupotea.', 'Fishermen weights recorded on damp paper that gets lost or altered.')}
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-600 font-bold">✕</span> {t('Kutojua kiasi halisi kilichopo kwenye vyumba vya baridi kwa wakati.', 'No real-time visibility into cold room stock levels or spoilage write-offs.')}
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-600 font-bold">✕</span> {t('Mizozo na viwanda kuhusu ubora wa samaki au madaraja ya uzito.', 'Disputes with factories over fish quality, size grading, or delivery lot origin.')}
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-600 font-bold">✕</span> {t('Wamiliki kupiga simu kila siku kuulizia mapato na faida.', 'Owners must call employees daily to estimate actual cash flow and profit.')}
              </li>
            </ul>
          </div>

          <div className="p-6 md:p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col gap-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{t('Sasa · Mfumo wa FishTrade ERP', 'After · FishTrade ERP Cloud & PWA')}</span>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 m-0">{t('Udhibiti Kamili wa Kidijitali', 'Centralized Digital Intelligence')}</h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-700 m-0 p-0 list-none">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span> {t('Upimaji wa haraka chini ya sekunde 60 na risiti ya papo hapo.', 'Fast digital scale capture in < 60 seconds with instant WhatsApp receipts.')}
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span> {t('Uwiano wa moja kwa moja wa Samaki Waliopokelewa, Waliouzwa na Waliopo Stoo.', 'Real-time reconciliation of Received, Sold, and On-Hand Cold Storage.')}
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span> {t('Ufuatiliaji wa GS1 QR kuanzia mwaloni hadi kiwandani.', 'Complete GS1 QR batch traceability from the landing beach to the factory gate.')}
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span> {t('Hesabu ya gharama halisi ikijumuisha barafu, vibarua na usafiri.', 'Automated landed cost calculation including ice, labor, and KYC transport.')}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="features" className="py-12 md:py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-2">
              {t('Mfumo Kamili', 'Comprehensive Platform')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              {t('Umejengwa kwa kila mfanyakazi katika biashara ya samaki', 'Built for every role in the fish trading business')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {getFeatures(t).map(feat => {
              const Icon = feat.icon
              return (
                <div key={feat.title} className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 m-0">{feat.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="traceability" className="py-12 md:py-20 max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              {t('Ubora wa Kipekee', 'Core Value Differentiator')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              {t('Ufuatiliaji Kamili wa Samaki kuanzia Mvuvi hadi Kiwandani', 'Complete Fish Traceability from Fisherman to Export Factory')}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t('Kila mzigo wa samaki unapata namba ya kipekee na QR code. Kiwanda au mkaguzi wa afya akiuliza kuhusu mzigo, kampuni inaona mara moja mvuvi aliyeshusha, mwalo, joto la kupokelea, muda kwenye chumba cha baridi, na gari lililosafirisha.', 'Every fish purchase is assigned an immutable batch lot number with an export QR code. If an industrial client or health inspector questions a delivery, the company can immediately verify who supplied the fish, which landing beach it arrived at, reception temperatures, cold room holding duration, and transit vehicle.')}
            </p>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex flex-col gap-2">
              <span className="font-bold flex items-center gap-1.5 text-blue-950">
                <ShieldCheck size={16} /> {t('Inakidhi Kanuni za Uvuvi Tanzania 2005 & FiRCIS', 'Tanzania Fisheries Regulations 2005 & FiRCIS Compliant')}
              </span>
              <span>
                {t('Inatunza kumbukumbu za kisheria zinazounganisha vituo vya kupokelea, wavuvi wadogo, usafiri wa baridi, na viwanda vya uchakataji.', 'Maintains regulatory records linking landing stations, artisanal suppliers, cold chain transport, and final industrial processing consignments.')}
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900">
              <img
                src="/photos/traceability-flow.png"
                alt={t('Mnyororo wa Ufuatiliaji wa Samaki', 'Seafood Traceability Supply Chain')}
                className="w-full h-auto object-cover"
              />
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-xs">
                <span>{t('1. Uvuvi → 2. Uchakataji → 3. Baridi → 4. Kiwandani', '1. Fishing → 2. Processing → 3. Cold Chain → 4. Delivery')}</span>
                <span className="font-mono text-emerald-400 font-bold shrink-0">{t('Inafuatilika 100%', '100% Traceable')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fleet" className="py-12 md:py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-2">
              {t('Usafirishaji wa Baridi', 'Cold Chain Logistics')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              {t('Magari ya Baridi & Usafiri wa Mialoni', 'Refrigerated Fleet & Landing Pier Transport')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
              <img
                src="/photos/refrigerated-truck.png"
                alt={t('Gari la Baridi Mwaloni', 'KYC Refrigerated Truck at dock')}
                className="w-full h-52 sm:h-56 object-cover"
              />
              <div className="p-5 sm:p-6 flex flex-col gap-2">
                <h4 className="text-base font-bold text-slate-900 m-0">{t('Ukusanyaji wa Samaki Mwaloni', 'Dockside Landing Collection')}</h4>
                <p className="text-xs text-slate-600 leading-relaxed m-0">
                  {t('Magari ya baridi yanakusanya makreti moja kwa moja kutoka kwenye boti katika mialo ya Kirumba, Katonga, na Mwigobero.', 'Light refrigerated trucks collect crates directly from fishing boats at Kirumba, Katonga, and Mwigobero piers with instant crate weighing and ice application.')}
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
              <img
                src="/photos/cold-storage.png"
                alt={t('Chumba cha Baridi na Usafirishaji', 'Cold storage facility dispatch')}
                className="w-full h-52 sm:h-56 object-cover"
              />
              <div className="p-5 sm:p-6 flex flex-col gap-2">
                <h4 className="text-base font-bold text-slate-900 m-0">{t('Usafirishaji Kiwandani & Vyumba vya Baridi', 'Factory Dispatch & Cold Storage')}</h4>
                <p className="text-xs text-slate-600 leading-relaxed m-0">
                  {t('Usafirishaji wa baridi kwenda viwanda kama ABC Fish Processing ukiwa na kumbukumbu za joto, noti za mzigo, na ankara.', 'Chilled delivery to ABC Fish Processing and export factories with temperature data logging, delivery notes, and automated customer invoice generation.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-12 md:py-20 max-w-7xl mx-auto px-5 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-2">
            {t('Bei Wazi', 'Transparent Pricing')}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            {t('Vifurushi Maalum kwa Wafanyabiashara wa Samaki Tanzania', 'Tailored to Tanzanian Fish Traders')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {PLANS.map(p => (
            <div
              key={p.id}
              className={`rounded-2xl p-6 sm:p-8 bg-white border flex flex-col justify-between gap-6 shadow-sm ${
                p.id === 'Business' ? 'border-blue-700 ring-2 ring-blue-700/20 shadow-md relative' : 'border-slate-200'
              }`}
            >
              {p.id === 'Business' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                  {t('Kinachopendwa Zaidi', 'Most Popular')}
                </span>
              )}
              <div className="flex flex-col gap-3">
                <h4 className="text-lg font-bold text-slate-900 m-0">{t('Kifurushi cha ', '')}{p.id}{t('', ' Plan')}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">{tzs(p.price)}</span>
                  <span className="text-xs text-slate-500 font-semibold">/{t('mwezi', 'month')}</span>
                </div>
                <p className="text-xs text-slate-600 m-0">{p.note}</p>
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5 text-xs text-slate-700">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-blue-700" />
                    <strong>{p.branches > 50 ? t('Bila Kikomo', 'Unlimited') : p.branches}</strong> {t('Vituo / Mialo', 'Landing Station(s)')}
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-blue-700" />
                    <strong>{p.users > 500 ? t('Bila Kikomo', 'Unlimited') : p.users}</strong> {t('Akaunti za Wafanyakazi', 'Staff User Accounts')}
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-blue-700" />
                    {t('Inafanya Kazi Bila Intaneti (PWA)', 'Offline Mobile PWA Weigher App')}
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-blue-700" />
                    {t('Risiti za WhatsApp na Kuchapisha', 'WhatsApp Voucher Receipts')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => nav('register')}
                className={`btn-primary w-full text-xs py-3 justify-center ${
                  p.id === 'Business' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {t('Anza Jaribio la Siku 14 Bure', 'Start 14-Day Free Trial')}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="py-12 md:py-20 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-2">
              {t('Maswali Yanayoulizwa Mara kwa Mara', 'Frequently Asked Questions')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              {t('Majibu kwa Wakurugenzi na Wasimamizi wa Uvuvi', 'Answers for Company Directors & Fishery Managers')}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {getFaqs(t).map(faq => (
              <details key={faq.q} className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 group">
                <summary className="text-sm font-bold text-slate-900 cursor-pointer flex justify-between items-center list-none gap-3">
                  <span>{faq.q}</span>
                  <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <p className="text-xs text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-100 m-0">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5 text-white font-bold">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden">
              <img
                src="/assets/aistudio/AquaCatch_Sharkwave_Logo_df0743e7.png"
                alt="AquaCatch FishTrade ERP"
                className="w-full h-full object-contain"
              />
            </div>
            <span>AquaCatch · FishTrade ERP Tanzania</span>
          </div>
          <p className="m-0 text-slate-500">
            {t('Mfumo wa Manunuzi, Stoo, Usafirishaji na Fedha kwa Sekta ya Uvuvi Tanzania.', 'Fish Procurement, Inventory, Distribution & Financial ERP for Tanzania Fisheries.')}
          </p>
        </div>
      </footer>
    </div>
  )
}

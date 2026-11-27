import React from 'react'
import {
  Fish,
  Anchor,
  Scale,
  Warehouse,
  ShieldCheck,
  Truck,
  Building2,
  QrCode,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Smartphone,
  ChevronDown,
  Sparkles,
  Award
} from 'lucide-react'
import { PLANS, useS } from '../store'
import { FishPhoto, tzs } from '../ui'
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Logo & Wordmark */}
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

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
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

          {/* Zone 3: Language Toggle + Primary Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
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

      {/* Hero Section with Crystal-Clear Lake Victoria Photography & Animated Nile Perch */}
      <section className="relative bg-sky-950 text-white overflow-hidden py-14 md:py-20 border-b border-slate-800">
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
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400" /> {t('Matawi Mengi', 'Multi-Branch Ready')}</span>
            </div>
          </div>

          {/* Animated Real Nile Perch + Live Catch Showcase */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Live Swimming Nile Perch Card */}
            <div className="relative rounded-2xl overflow-hidden border border-sky-300/35 bg-gradient-to-br from-sky-900/75 via-blue-950/75 to-slate-950/80 backdrop-blur-md p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
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

            {/* Commercial Catch Metrics Card */}
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

      {/* Problem & Solution Transformation (SRS Section 1) */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-rose-50/50 border border-rose-200 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">{t('Zamani · Madaftari ya Karatasi', 'Before · Traditional Paper Management')}</span>
            <h3 className="text-xl font-bold text-slate-900 m-0">{t('Hesabu Zisizo Sahihi & Hasara', 'Inaccurate Books & Untraceable Losses')}</h3>
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

          <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col gap-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{t('Sasa · Mfumo wa FishTrade ERP', 'After · FishTrade ERP Cloud & PWA')}</span>
            <h3 className="text-xl font-bold text-slate-900 m-0">{t('Udhibiti Kamili wa Kidijitali', 'Centralized Digital Intelligence')}</h3>
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

      {/* Feature Capabilities Grid */}
      <section id="features" className="py-16 md:py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-2">
              {t('Mfumo Kamili', 'Comprehensive Platform')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              {t('Umejengwa kwa kila mfanyakazi katika biashara ya samaki', 'Built for every role in the fish trading business')}
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              {t('Mfumo mmoja unaounganisha maafisa wa mialoni, wakaguzi wa ubora, watunza stoo, wahasibu, na wamiliki wa kampuni.', 'One integrated platform with tailored workflows for landing officers, quality inspectors, storekeepers, accountants, and company owners.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFeatures(t).map(feat => {
              const Icon = feat.icon
              return (
                <div key={feat.title} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
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

      {/* Complete Traceability Section (SRS Section 3 with Real Diagram) */}
      <section id="traceability" className="py-16 md:py-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
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
                <span>{t('1. Uvuvi → 2. Uchakataji → 3. Chumba cha Baridi → 4. Kiwandani', '1. Fishing Source → 2. Processing → 3. Cold Chain → 4. Delivery')}</span>
                <span className="font-mono text-emerald-400 font-bold">{t('Inafuatilika 100%', '100% Traceable')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cold Chain Fleet Section with Real Truck Images */}
      <section id="fleet" className="py-16 md:py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-2">
              {t('Usafirishaji wa Baridi', 'Cold Chain Logistics')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              {t('Magari ya Baridi & Usafiri wa Mialoni', 'Refrigerated Fleet & Landing Pier Transport')}
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              {t('Tunza ubora wa samaki kati ya mialo ya ziwa na viwanda kwa magari ya baridi ya tani 1 hadi 3.', 'Maintain fish quality between lake docks and industrial processing zones with 1 to 3 ton KYC light refrigerated trucks.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
              <img
                src="/photos/refrigerated-truck.png"
                alt={t('Gari la Baridi Mwaloni', 'KYC Refrigerated Truck at dock')}
                className="w-full h-56 object-cover"
              />
              <div className="p-6 flex flex-col gap-2">
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
                className="w-full h-56 object-cover"
              />
              <div className="p-6 flex flex-col gap-2">
                <h4 className="text-base font-bold text-slate-900 m-0">{t('Usafirishaji Kiwandani & Vyumba vya Baridi', 'Factory Dispatch & Cold Storage')}</h4>
                <p className="text-xs text-slate-600 leading-relaxed m-0">
                  {t('Usafirishaji wa baridi kwenda viwanda kama ABC Fish Processing ukiwa na kumbukumbu za joto, noti za mzigo, na ankara.', 'Chilled delivery to ABC Fish Processing and export factories with temperature data logging, delivery notes, and automated customer invoice generation.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (SRS Specification in TZS) */}
      <section id="pricing" className="py-16 md:py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-2">
            {t('Bei Wazi', 'Transparent Pricing')}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            {t('Vifurushi Maalum kwa Wafanyabiashara wa Samaki Tanzania', 'Tailored to Tanzanian Fish Traders')}
          </h2>
          <p className="text-slate-600 text-sm mt-3">
            {t('Anza na mwalo mmoja, kisha panua biashara yako katika mialo yote ya Ziwa Victoria na Ziwa Tanganyika.', 'Start with one landing site, then scale to multi-branch operations across Lake Victoria and Lake Tanganyika.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map(p => (
            <div
              key={p.id}
              className={`rounded-2xl p-8 bg-white border flex flex-col justify-between gap-6 shadow-sm ${
                p.id === 'Business' ? 'border-blue-700 ring-2 ring-blue-700/20 shadow-md relative' : 'border-slate-200'
              }`}
            >
              {p.id === 'Business' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {t('Kinachopendwa Zaidi', 'Most Popular For Traders')}
                </span>
              )}
              <div className="flex flex-col gap-3">
                <h4 className="text-lg font-bold text-slate-900 m-0">{t('Kifurushi cha ', '')}{p.id}{t('', ' Plan')}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-mono text-slate-900">{tzs(p.price)}</span>
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

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-20 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-2">
              {t('Maswali Yanayoulizwa Mara kwa Mara', 'Frequently Asked Questions')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              {t('Majibu kwa Wakurugenzi na Wasimamizi wa Uvuvi', 'Answers for Company Directors & Fishery Managers')}
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {getFaqs(t).map(faq => (
              <details key={faq.q} className="p-5 bg-white rounded-xl border border-slate-200 group">
                <summary className="text-sm font-bold text-slate-900 cursor-pointer flex justify-between items-center list-none">
                  {faq.q}
                  <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-xs text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-100 m-0">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white py-16 px-6 text-center border-t border-blue-900">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-5">
          <h2 className="text-2xl sm:text-3xl font-bold m-0">
            {t('Anza kutumia mfumo wa kidijitali leo.', 'Digitize your seafood supply chain today.')}
          </h2>
          <p className="text-sm text-blue-200 max-w-xl">
            {t('Jiunge na wafanyabiashara wa samaki wa Ziwa Victoria na Ziwa Tanganyika wanaotumia FishTrade ERP.', 'Join fish traders across Lake Victoria and Lake Tanganyika moving from manual paper books to high-precision ERP management.')}
          </p>
          <button
            onClick={() => nav('register')}
            className="btn-primary py-3 px-8 text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg"
          >
            {t('Fungua Akaunti ya Kampuni · Siku 14 Bure', 'Create Company Account · 14 Days Free')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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

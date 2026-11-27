import React, { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts'
import {
  Scale,
  Anchor,
  Truck,
  Warehouse,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  ChevronRight,
  Fuel as FuelIcon,
  Wrench,
  Package
} from 'lucide-react'
import { useS, stock, supBal, cusBal, supFuelDebt, ROLES, trCost } from '../store'
import { f, tzs, fmtT, atOf, FishPhoto, Badge, DetailModal, ViewBtn } from '../ui'

const SPECIES_COLORS = {
  'Nile Perch': '#0284c7',
  'Tilapia': '#ea580c',
  'Dagaa (Sardines)': '#10b981',
  'Catfish': '#6366f1'
}

export default function Home({ go }) {
  const { s, T, B, t, spLabel } = useS()
  const role = s.role
  const can = k => !ROLES[role] || ROLES[role].includes(k)

  const st = stock(s)
  const inStock = Object.values(st).reduce((a, b) => a + b, 0)
  const bought = s.batches.reduce((a, b) => a + b.kg, 0)
  const sold = s.sales.reduce((a, x) => a + x.kg, 0)
  const rev = s.sales.reduce((a, x) => a + x.kg * x.price, 0)
  const cogs = s.sales.reduce((a, x) => a + x.cogs, 0)
  const grossProfit = rev - cogs
  const tr = trCost(s)
  const exp0 = s.exps.reduce((a, e) => a + e.amt, 0) + s.batches.reduce((a, b) => a + (b.waste || 0) * b.price, 0)
  const netProfit = grossProfit - exp0 - tr

  const due = s.suppliers.reduce((a, x) => a + supBal(s, x.id), 0)
  const debt = s.customers.reduce((a, x) => a + cusBal(s, x.id), 0)
  const pend = s.batches.filter(b => b.st === 'pending')
  const lim = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
  const expiring = s.comp.filter(c => c.exp < lim)

  const hour = new Date().getHours()
  const greeting = hour < 12
    ? t('Habari za Asubuhi', 'Good Morning')
    : hour < 17
      ? t('Habari za Mchana', 'Good Afternoon')
      : t('Habari za Jioni', 'Good Evening')

  const fmtCompactTzs = val => {
    const abs = Math.abs(val)
    if (abs >= 1e6) return `TZS ${(val / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `TZS ${Math.round(val / 1e3)}K`
    return tzs(val)
  }

  // Real weekly Purchasing vs Sales Volume (last 4 ISO-weeks)
  const volumeData = (() => {
    const isoWeek = dateStr => {
      const d = new Date(dateStr)
      if (isNaN(d)) return null
      const jan4 = new Date(d.getFullYear(), 0, 4)
      const startOfWeek1 = new Date(jan4)
      startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
      const diff = d - startOfWeek1
      return Math.floor(diff / (7 * 864e5)) + 1
    }
    const weekMap = {}
    const ensureWeek = key => { if (!weekMap[key]) weekMap[key] = { key, purchased: 0, sold: 0 } }

    s.batches.forEach(b => {
      if (!b.date) return
      const d = new Date(b.date)
      if (isNaN(d)) return
      const key = `${d.getFullYear()}-W${String(isoWeek(b.date)).padStart(2, '0')}`
      ensureWeek(key)
      weekMap[key].purchased += b.kg || 0
    })
    s.sales.forEach(x => {
      if (!x.date) return
      const d = new Date(x.date)
      if (isNaN(d)) return
      const key = `${d.getFullYear()}-W${String(isoWeek(x.date)).padStart(2, '0')}`
      ensureWeek(key)
      weekMap[key].sold += x.kg || 0
    })

    const sorted = Object.values(weekMap).sort((a, b) => a.key < b.key ? -1 : 1)
    const last4 = sorted.slice(-4)

    if (last4.length === 0) {
      return [1, 2, 3, 4].map(n => ({
        name: t(`W${n}`, `W${n}`),
        label: t(`Wiki ${n}`, `Week ${n}`),
        purchased: 0,
        sold: 0
      }))
    }

    return last4.map((w, i) => ({
      name: `W${i + 1}`,
      label: t(`Wiki ${i + 1}`, `Week ${i + 1}`),
      purchased: w.purchased,
      sold: w.sold,
    }))
  })()

  const speciesData = Object.entries(
    s.batches.reduce((acc, b) => {
      acc[b.sp] = (acc[b.sp] || 0) + b.kg
      return acc
    }, {})
  ).map(([name, value]) => ({
    name: spLabel(name),
    value,
    color: SPECIES_COLORS[name] || '#3b82f6'
  }))

  const [viewBatch, setViewBatch] = useState(null)

  return (
    <div className="page-body">
      {/* ─── MOBILE DASHBOARD (Screen 3 exact hierarchy & balance) ─── */}
      <div className="md:hidden flex flex-col gap-3.5">
        {/* Greeting + Company Subtitle */}
        <div className="pt-0.5">
          <h2 className="text-[19px] font-extrabold text-slate-900 tracking-tight m-0">
            {greeting}, {s.role}
          </h2>
          <p className="text-xs font-medium text-slate-500 m-0 mt-0.5">
            {T.name} · {B.name}
          </p>
        </div>

        {/* Crisp Rounded Lake Boats Photo Card */}
        <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200 h-32 bg-slate-900">
          <img
            src="/landing/hero.jpg"
            alt="Lake Victoria Fisheries"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/75 to-transparent flex items-end justify-between px-3 pb-2.5">
            <span className="text-[11px] font-bold text-white tracking-wide">
              {B.name} · {t('Ziwa Victoria', 'Lake Victoria')}
            </span>
            {can('buy') && (
              <button
                type="button"
                onClick={() => go('buy')}
                className="px-2.5 py-1 rounded-lg bg-[#18b8b2] text-[#042242] text-[11px] font-extrabold shadow-sm"
              >
                + {t('Manunuzi', 'Purchase')}
              </button>
            )}
          </div>
        </div>

        {/* This Month Overview — 2x2 Balanced KPI Grid */}
        <div>
          <h3 className="text-[14.5px] font-extrabold text-slate-900 m-0 mb-2">
            {t('Muhtasari wa Mwezi Huu', 'This Month Overview')}
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => go('buy')}
              className="mobile-card flex items-center gap-2.5 text-left active:scale-[0.99] transition"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Scale size={19} />
              </div>
              <div className="min-w-0">
                <b className="text-[15px] font-extrabold text-slate-900 block truncate tabular-nums">
                  {f(bought)} kg
                </b>
                <span className="text-[11px] font-semibold text-slate-500 block truncate">
                  {t('Walionunuliwa', 'Purchased')}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => go('sales')}
              className="mobile-card flex items-center gap-2.5 text-left active:scale-[0.99] transition"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck size={19} />
              </div>
              <div className="min-w-0">
                <b className="text-[15px] font-extrabold text-slate-900 block truncate tabular-nums">
                  {f(sold)} kg
                </b>
                <span className="text-[11px] font-semibold text-slate-500 block truncate">
                  {t('Waliouzwa', 'Sold')}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => go('stock')}
              className="mobile-card flex items-center gap-2.5 text-left active:scale-[0.99] transition"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Package size={19} />
              </div>
              <div className="min-w-0">
                <b className="text-[15px] font-extrabold text-slate-900 block truncate tabular-nums">
                  {f(inStock)} kg
                </b>
                <span className="text-[11px] font-semibold text-slate-500 block truncate">
                  {t('Stoo Iliyopo', 'In Stock')}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => go('reports')}
              className="mobile-card flex items-center gap-2.5 text-left active:scale-[0.99] transition"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <DollarSign size={19} />
              </div>
              <div className="min-w-0">
                <b className="text-[14.5px] font-extrabold text-slate-900 block truncate tabular-nums">
                  {fmtCompactTzs(grossProfit)}
                </b>
                <span className="text-[11px] font-semibold text-slate-500 block truncate">
                  {t('Faida Ghafi', 'Gross Profit')}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Purchases vs Sales (kg) Chart Card */}
        <div className="mobile-card p-3.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-extrabold text-slate-900 m-0">
              {t('Manunuzi dhidi ya Mauzo (kg)', 'Purchases vs Sales (kg)')}
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1d70f5]" /> {t('Manunuzi', 'Purchased')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> {t('Mauzo', 'Sold')}
              </span>
            </div>
          </div>
          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, name) => [`${f(val)} kg`, name === 'purchased' ? t('Walionunuliwa', 'Purchased') : t('Waliouzwa', 'Sold')]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="purchased" fill="#1d70f5" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="sold" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compact Mobile Alerts */}
        {(pend.length > 0 || expiring.length > 0) && (
          <div className="flex flex-col gap-2">
            {pend.length > 0 && can('quality') && (
              <button
                type="button"
                onClick={() => go('quality')}
                className="w-full p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldAlert size={18} className="text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <b className="text-xs text-amber-900 block truncate">
                      {pend.length} {t('Mizigo Inasubiri Ukaguzi (QC)', 'Batches Pending Quality QC')}
                    </b>
                    <span className="text-[11px] text-amber-700 block truncate">
                      {t('Gusa kukagua joto < 4.0°C', 'Tap to verify freshness & temp')}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-amber-700 shrink-0" />
              </button>
            )}
            {expiring.length > 0 && can('compliance') && (
              <button
                type="button"
                onClick={() => go('compliance')}
                className="w-full p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <b className="text-xs text-rose-900 block truncate">
                      {t('Kibali cha FiRCIS:', 'FiRCIS Permit Alert:')} {expiring[0]?.ref}
                    </b>
                    <span className="text-[11px] text-rose-700 block truncate">
                      {t('Inakaribia kuisha muda', 'Renewal required before export')}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-rose-700 shrink-0" />
              </button>
            )}
          </div>
        )}

        {/* Recent Collections on Mobile */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-extrabold text-slate-900 m-0">
              {t('Makusanyo ya Hivi Karibuni', 'Recent Landing Collections')}
            </h3>
            {can('buy') && (
              <button
                type="button"
                onClick={() => go('buy')}
                className="text-xs font-bold text-[#052d56] flex items-center gap-0.5"
              >
                {t('Yote', 'View All')} <ChevronRight size={14} />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {s.batches.slice(0, 4).map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setViewBatch(b)}
                className="mobile-card w-full flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FishPhoto sp={b.sp} size={42} />
                  <div className="min-w-0">
                    <b className="text-xs text-slate-900 block truncate">
                      {spLabel(b.sp)} · {t('Daraja', 'Grade')} {b.grade}
                    </b>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {s.suppliers.find(x => x.id === b.sup)?.name || b.sup} · {b.site}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <b className="text-xs font-mono text-slate-900 block">{f(b.kg)} kg</b>
                  <Badge variant={b.st === 'accepted' ? 'green' : 'amber'}>
                    {b.st === 'accepted' ? t('Safi', 'QC OK') : t('Inasubiri', 'Pending')}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── DESKTOP DASHBOARD (md+ Preserved Full Experience) ─── */}
      <div className="hidden md:flex md:flex-col md:gap-4">
        {/* High-Impact Maritime Operational Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-md">
          <img
            src="/landing/hero.jpg"
            alt="Lake Victoria Fisheries"
            className="w-full h-48 md:h-56 object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent p-5 md:p-7 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-blue-700/90 text-white shadow text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                {B.name} · {t('Ukanda wa Ziwa Victoria', 'Lake Victoria Region')}
              </span>
            </div>
            <div className="max-w-xl">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1 drop-shadow-sm">
                {t('Mfumo wa Ununuzi wa Samaki na Stoo Baridi', 'Fisheries Procurement & Cold Chain ERP')}
              </h2>
              <p className="text-xs md:text-sm text-slate-100 drop-shadow-sm max-w-lg">
                {t(
                  'Fuatilia makusanyo ya mwalo, mizani ya kidijitali, ukaguzi wa ubora, na usafirishaji wa kiwandani.',
                  'Centralized monitoring for artisanal landing collections, digital scale weighing, quality grading, and direct factory deliveries.'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {can('buy') && (
                <button
                  onClick={() => go('buy')}
                  className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-500 font-bold shadow"
                >
                  <Plus size={14} /> {t('Manunuzi Mapya ya Samaki', 'New Fish Purchase')}
                </button>
              )}
              {can('stock') && (
                <button
                  onClick={() => go('stock')}
                  className="btn-secondary text-xs bg-slate-900/80 hover:bg-slate-900 text-white border-white/30 backdrop-blur-sm"
                >
                  <Warehouse size={14} /> {t('Tazama Vyumba Baridi', 'View Cold Rooms')} ({f(inStock)} kg)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Visual Operational Flow Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            onClick={() => go('buy')}
            className="panel p-0 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition group"
          >
            <div className="h-28 overflow-hidden relative bg-slate-100">
              <img
                src="/photos/scale-dock.png"
                alt="Digital Dock Scale"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-emerald-400 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold backdrop-blur-sm">
                {t('MIZANI YA MWALO', 'SCALE TERMINAL')}
              </span>
            </div>
            <div className="p-2.5">
              <b className="text-xs text-slate-900 block truncate group-hover:text-blue-800">{t('1. Kupima Mwalo', '1. Dock Weighing')}</b>
              <small className="text-[11px] text-slate-500 block truncate">{t('Uzito halisi wa samaki', 'Tare, Gross, Net digital scale')}</small>
            </div>
          </div>

          <div
            onClick={() => go('quality')}
            className="panel p-0 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition group"
          >
            <div className="h-28 overflow-hidden relative bg-slate-100">
              <img
                src="/photos/quality-inspection.png"
                alt="Factory Quality Inspection"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-blue-300 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold backdrop-blur-sm">
                {t('MAABARA YA UBORA', 'HACCP LAB')}
              </span>
            </div>
            <div className="p-2.5">
              <b className="text-xs text-slate-900 block truncate group-hover:text-blue-800">{t('2. Ukaguzi wa Ubora', '2. Quality Grading')}</b>
              <small className="text-[11px] text-slate-500 block truncate">{t('Joto < 4°C, Daraja A/B/C', 'Temp < 4°C, Grade A/B/C')}</small>
            </div>
          </div>

          <div
            onClick={() => go('stock')}
            className="panel p-0 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition group"
          >
            <div className="h-28 overflow-hidden relative bg-slate-100">
              <img
                src="/photos/cold-storage.png"
                alt="Sub-Zero Cold Storage"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-cyan-300 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold backdrop-blur-sm">
                {t('STOO BARIDI', 'COLD CHAIN')}
              </span>
            </div>
            <div className="p-2.5">
              <b className="text-xs text-slate-900 block truncate group-hover:text-blue-800">{t('3. Uhifadhi Baridi', '3. Cold Storage')}</b>
              <small className="text-[11px] text-slate-500 block truncate">{f(inStock)} kg {t('kwenye vyumba baridi', 'in holding rooms')}</small>
            </div>
          </div>

          <div
            onClick={() => go('transport')}
            className="panel p-0 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition group"
          >
            <div className="h-28 overflow-hidden relative bg-slate-100">
              <img
                src="/photos/refrigerated-truck.png"
                alt="Refrigerated Truck Dispatch"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold backdrop-blur-sm">
                {t('USAFIRISHAJI', 'DISPATCH')}
              </span>
            </div>
            <div className="p-2.5">
              <b className="text-xs text-slate-900 block truncate group-hover:text-blue-800">{t('4. Magari ya Baridi', '4. Transport Fleet')}</b>
              <small className="text-[11px] text-slate-500 block truncate">{t('Malori ya tani 1-3', '1-3T insulated trucks')}</small>
            </div>
          </div>
        </div>

        {/* Operational Alerts */}
        {(pend.length > 0 || expiring.length > 0) && (
          <div className="flex flex-col gap-2">
            {pend.length > 0 && can('quality') && (
              <div
                onClick={() => go('quality')}
                className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 cursor-pointer hover:bg-amber-100/70 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert size={18} className="text-amber-600" />
                  <span>
                    <strong>{t(`Mizigo ${pend.length} inasubiri Ukaguzi wa Ubora:`, `${pend.length} Landing Batch awaiting Quality Inspection:`)}</strong>{' '}
                    {t('Joto la kupokelea linapaswa kuwa chini ya 4.0°C.', 'Cold chain compliance requires reception temp < 4.0°C.')}
                  </span>
                </div>
                <span className="font-bold text-amber-700 flex items-center gap-1 shrink-0">
                  {t('Kagua Sasa', 'Inspect Now')} <ChevronRight size={14} />
                </span>
              </div>
            )}
            {expiring.length > 0 && can('compliance') && (
              <div
                onClick={() => go('compliance')}
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900 cursor-pointer hover:bg-rose-100/70 transition"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={18} className="text-rose-600" />
                  <span>
                    <strong>{t('Tahadhari ya Kibali cha FiRCIS:', 'FiRCIS Document Alert:')}</strong> {expiring[0]?.type} ({expiring[0]?.ref}){' '}
                    {t('kinakaribia kuisha muda wake.', 'is due for renewal before export dispatch.')}
                  </span>
                </div>
                <span className="font-bold text-rose-700 flex items-center gap-1 shrink-0">
                  {t('Tazama Vibali', 'View Licences')} <ChevronRight size={14} />
                </span>
              </div>
            )}
          </div>
        )}

        {/* Primary KPI Grid */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon-wrap">
              <Anchor size={22} />
            </div>
            <div className="kpi-content">
              <small>{t('Jumla ya Samaki Walionunuliwa', 'Total Fish Purchased')}</small>
              <b>{f(bought)} <span className="text-xs font-sans text-slate-400">kg</span></b>
              <span className="kpi-sub">{t('Katika mialo yote', 'Across all landing sites')}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap amber">
              <Truck size={22} />
            </div>
            <div className="kpi-content">
              <small>{t('Samaki Waliouzwa Viwandani', 'Fish Sold to Industry')}</small>
              <b>{f(sold)} <span className="text-xs font-sans text-slate-400">kg</span></b>
              <span className="kpi-sub">{Math.round((sold / (bought || 1)) * 100)}% {t('mzunguko wa stoo', 'inventory turn')}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap purple">
              <Warehouse size={22} />
            </div>
            <div className="kpi-content">
              <small>{t('Stoo Iliyopo Baridi', 'Available Cold Stock')}</small>
              <b>{f(inStock)} <span className="text-xs font-sans text-slate-400">kg</span></b>
              <span className="kpi-sub">{t('Vyumba baridi vikuu', 'Main & Port chillers')}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap green">
              <TrendingUp size={22} />
            </div>
            <div className="kpi-content">
              <small>{t('Faida Ghafi', 'Gross Margin (Profit)')}</small>
              <b>{tzs(grossProfit)}</b>
              <span className="kpi-sub text-emerald-600 font-semibold">{t('Faida Halisi:', 'Net:')} {tzs(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="panel lg:col-span-2">
            <div className="panel-header">
              <div>
                <h3>{t('Manunuzi dhidi ya Mauzo ya Viwanda', 'Purchasing vs. Industry Sales Volume')}</h3>
                <p>{t('Mwenendo wa kila wiki kwa kilo (kg)', 'Monthly weekly progression in kilograms (kg)')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">{new Date().toLocaleDateString('sw-TZ', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip
                    formatter={(val, name) => [`${f(val)} kg`, name === 'purchased' ? t('Walionunuliwa', 'Purchased') : t('Waliouzwa Viwandani', 'Sold to Factories')]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="purchased" name={t('Samaki Walionunuliwa', 'Fish Purchased')} fill="#0b3a8c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sold" name={t('Waliouzwa Viwandani', 'Fish Sold to Industry')} fill="#f28c28" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>{t('Mchanganyiko wa Samaki', 'Species Mix')}</h3>
                <p>{t('Mgawanyo wa uzito wa samaki', 'Catch volume distribution')}</p>
              </div>
            </div>
            <div className="w-full h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={speciesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {speciesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={val => `${f(val)} kg`} contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              {speciesData.map(sp => (
                <div key={sp.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sp.color }} />
                    {sp.name}
                  </span>
                  <b className="font-mono text-slate-700">{f(sp.value)} kg</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Health Summary & Live Receiving Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>{t('Hali ya Kifedha', 'Financial Position')}</h3>
                <p>{t('Fedha taslimu, malipo na madeni ya wateja', 'Cash, payables & customer debts')}</p>
              </div>
              <DollarSign className="text-slate-400" size={18} />
            </div>
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block">{t('Mauzo Yaliyotozwa (Mapato)', 'Sales Invoiced (Revenue)')}</span>
                  <b className="text-sm font-mono text-slate-900">{tzs(rev)}</b>
                </div>
                <span className="text-emerald-600 font-semibold text-xs">{t('Yamelipwa:', 'Paid:')} {tzs(rev - debt)}</span>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100 flex justify-between items-center">
                <div>
                  <span className="text-rose-700 block">{t('Malipo ya Wavuvi Yanayodaiwa', 'Supplier Payments Due (Fishermen)')}</span>
                  <b className="text-sm font-mono text-rose-800">{tzs(due)}</b>
                </div>
                {can('payments') && (
                  <button onClick={() => go('payments')} className="text-rose-700 hover:underline font-semibold">
                    {t('Lipa Sasa', 'Pay Now')}
                  </button>
                )}
              </div>

              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 flex justify-between items-center">
                <div>
                  <span className="text-blue-700 block">{t('Madeni ya Wateja (Viwanda)', 'Customer Debts (Industries)')}</span>
                  <b className="text-sm font-mono text-blue-800">{tzs(debt)}</b>
                </div>
                {can('sales') && (
                  <button onClick={() => go('sales')} className="text-blue-700 hover:underline font-semibold">
                    {t('Kusanya', 'Collect')}
                  </button>
                )}
              </div>

              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 flex justify-between items-center">
                <div>
                  <span className="text-amber-800 block">{t('Mikopo ya Mafuta ya Wavuvi', 'Fisherman Fuel Credit Ledger')}</span>
                  <b className="text-sm font-mono text-amber-900">
                    {tzs(s.suppliers.reduce((a, x) => a + supFuelDebt(s, x.id), 0))}
                  </b>
                </div>
                <button onClick={() => go('fuel')} className="text-amber-800 hover:underline font-semibold flex items-center gap-1">
                  <FuelIcon size={12} /> {t('Simamia', 'Manage')}
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-700 block">{t('Meli & Boti Zinazofanya Kazi', 'Active Vessel Fleet & Repairs')}</span>
                  <b className="text-sm font-mono text-slate-900">
                    {(s.boats || []).filter(b => b.status === 'Operational').length} / {(s.boats || []).length} {t('Boti Tayari', 'Boats Ready')}
                  </b>
                </div>
                <button onClick={() => go('maintenance')} className="text-blue-900 hover:underline font-semibold flex items-center gap-1">
                  <Wrench size={12} /> {t('Boti', 'Fleet')}
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block">{t('Gharama za Usafiri na Barafu', 'Transport & Ice Costs')}</span>
                  <b className="text-sm font-mono text-slate-900">{tzs(tr + exp0)}</b>
                </div>
                <span className="text-slate-400">{t('Usafirishaji', 'Landed logistics')}</span>
              </div>
            </div>
          </div>

          <div className="panel lg:col-span-2">
            <div className="panel-header">
              <div>
                <h3>{t('Makusanyo ya Hivi Karibuni Mwalo', 'Recent Landing Collections')}</h3>
                <p>{t('Samaki waliofika, kupimwa na kukaguliwa ubora', 'Fish arrivals, weighing, and quality reception')}</p>
              </div>
              {can('buy') && (
                <button onClick={() => go('buy')} className="btn-secondary text-xs">
                  {t('Tazama Mizigo Yote', 'View All Batches')}
                </button>
              )}
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Samaki na Mzigo', 'Fish & Batch')}</th>
                    <th>{t('Mvuvi / Mwalo', 'Supplier / Landing')}</th>
                    <th>{t('Kiasi', 'Quantity')}</th>
                    <th>{t('Jumla ya Gharama', 'Total Cost')}</th>
                    <th>{t('Ukaguzi', 'Inspection')}</th>
                    <th className="text-right">{t('Vitendo', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.batches.slice(0, 5).map(b => (
                    <tr key={b.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <FishPhoto sp={b.sp} size={36} />
                          <div>
                            <b className="block text-slate-900">{spLabel(b.sp)}</b>
                            <small className="text-slate-400 font-mono">{b.no} · {t('Daraja', 'Grade')} {b.grade}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className="text-slate-800 font-medium">
                            {s.suppliers.find(x => x.id === b.sup)?.name || b.sup}
                          </span>
                          <small className="block text-slate-400">{b.site}</small>
                        </div>
                      </td>
                      <td>
                        <b className="font-mono text-slate-900">{f(b.kg)} kg</b>
                        <small className="block text-slate-400">{b.crates || Math.round(b.kg / 40)} {t('kreti', 'crates')}</small>
                      </td>
                      <td>
                        <b className="font-mono text-slate-900">{tzs(b.kg * b.price)}</b>
                        <small className="block text-slate-400">@ {tzs(b.price)}/kg</small>
                      </td>
                      <td>
                        <Badge variant={b.st === 'accepted' ? 'green' : 'amber'}>
                          {b.st === 'accepted' ? t('Imekubaliwa', 'Accepted') : t('Inasubiri Ukaguzi', 'Pending QC')}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <ViewBtn onClick={() => setViewBatch(b)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {viewBatch && (
        <DetailModal
          title={`${t('Maelezo ya Mzigo:', 'Batch Details:')} ${viewBatch.no}`}
          subtitle={`${spLabel(viewBatch.sp)} · ${viewBatch.site}`}
          badge={
            <Badge variant={viewBatch.st === 'accepted' ? 'green' : 'amber'}>
              {viewBatch.st === 'accepted' ? t('Imekubaliwa', 'Accepted') : t('Inasubiri Ukaguzi', 'Pending QC')}
            </Badge>
          }
          onClose={() => setViewBatch(null)}
          fields={[
            { label: t('Namba ya Manunuzi', 'Purchase ID'), value: viewBatch.pur, mono: true },
            { label: t('Namba ya Mzigo', 'Batch Number'), value: viewBatch.no, mono: true },
            { label: t('Aina ya Samaki', 'Species'), value: `${spLabel(viewBatch.sp)} (${t('Daraja', 'Grade')} ${viewBatch.grade})` },
            { label: t('Mvuvi / Mzabuni', 'Fisherman / Supplier'), value: s.suppliers.find(x => x.id === viewBatch.sup)?.name || viewBatch.sup },
            { label: t('Mwalo', 'Landing Site'), value: viewBatch.site },
            { label: t('Ghala la Baridi', 'Cold Warehouse'), value: viewBatch.wh || 'Mwanza Main Cold Room' },
            { label: t('Uzito wa Jumla', 'Total Weight'), value: `${f(viewBatch.kg)} kg (${viewBatch.crates || Math.round(viewBatch.kg / 40)} ${t('kreti', 'crates')})`, mono: true },
            { label: t('Bei kwa Kilo', 'Price per Kg'), value: tzs(viewBatch.price), mono: true },
            { label: t('Jumla ya Thamani', 'Total Value'), value: tzs(viewBatch.kg * viewBatch.price), mono: true, highlight: true },
            { label: t('Tarehe & Muda', 'Date & Time'), value: fmtT(atOf(viewBatch)), mono: true },
          ]}
          actions={
            can('buy') && (
              <button
                type="button"
                onClick={() => {
                  setViewBatch(null)
                  go('buy')
                }}
                className="btn-primary text-xs"
              >
                {t('Fungua Kwenye Manunuzi', 'Open in Purchases')}
              </button>
            )
          }
        />
      )}
    </div>
  )
}

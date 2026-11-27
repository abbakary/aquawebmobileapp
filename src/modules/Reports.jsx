import React, { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import {
  Download,
  Filter,
  FileSpreadsheet,
  Scale,
  ShoppingBag,
  DollarSign,
  Trash2
} from 'lucide-react'
import { useS, refLabel } from '../store'
import { Field, DetailModal, ViewBtn, f, tzs, fmtT, atOf } from '../ui'

export default function Reports() {
  const { s, t, spLabel } = useS()
  const [tab, setTab] = useState('Purchases')
  const [period, setPeriod] = useState('Month') // 'Month' | '3Months' | 'Custom' | 'All'
  const [fr, setFr] = useState('')
  const [to, setTo] = useState('')
  const [sup, setSup] = useState('')
  const [sp, setSp] = useState('')
  const [wh] = useState('')
  const [viewRow, setViewRow] = useState(null)

  const setPreset = k => {
    setPeriod(k)
    if (k === 'All' || k === 'Custom') {
      if (k === 'All') {
        setFr('')
        setTo('')
      }
      return
    }
    const x = new Date()
    if (k === 'Today') {
      x.setHours(0, 0, 0, 0)
    } else if (k === '7 days') {
      x.setDate(x.getDate() - 7)
    } else if (k === '3Months') {
      x.setMonth(x.getMonth() - 3)
      x.setHours(0, 0, 0, 0)
    } else {
      x.setDate(1)
      x.setHours(0, 0, 0, 0)
    }
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
    setFr(x.toISOString().slice(0, 16))
    setTo('')
  }

  const inR = dt => (!fr || dt >= fr) && (!to || dt <= to)
  const nm = id => s.suppliers.find(x => x.id === id)?.name || '-'

  const filteredBatches = s.batches
    .filter(b => inR(atOf(b)) && (!sup || b.sup === sup) && (!sp || b.sp === sp) && (tab !== 'Stock' || !wh || (b.wh || s.wh[0]) === wh))
    .sort((x, y) => atOf(y).localeCompare(atOf(x)))

  const filteredSales = s.sales
    .filter(x => inR(x.at || x.date + 'T00:00') && (!sp || x.sp === sp))
    .sort((a, b) => (b.at || b.date).localeCompare(a.at || a.date))

  // Summary KPIs for Screen 11
  const totalPurchasedKg = filteredBatches.reduce((a, b) => a + (b.kg || 0), 0)
  const totalSoldKg = filteredSales.reduce((a, x) => a + (x.kg || 0), 0)
  const rev = filteredSales.reduce((a, x) => a + x.kg * x.price, 0)
  const cogs = filteredSales.reduce((a, x) => a + (x.cogs || 0), 0)
  const grossProfit = rev - cogs
  const wasteKg = filteredBatches.reduce((a, b) => a + (b.waste || 0) + (b.rej || 0), 0)
  const wastePct = totalPurchasedKg > 0 ? ((wasteKg / totalPurchasedKg) * 100).toFixed(1) : '0.0'

  const fmtCompactTzs = val => {
    const abs = Math.abs(val)
    if (abs >= 1e6) return `TZS ${(val / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `TZS ${Math.round(val / 1e3)}K`
    return tzs(val)
  }

  // W1–W4 Chart Data matching Screen 11
  const perfData = (() => {
    const isoWeek = dateStr => {
      const d = new Date(dateStr)
      if (isNaN(d)) return null
      const jan4 = new Date(d.getFullYear(), 0, 4)
      const startOfWeek1 = new Date(jan4)
      startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
      return Math.floor((d - startOfWeek1) / (7 * 864e5)) + 1
    }
    const weekMap = {}
    const ensure = k => { if (!weekMap[k]) weekMap[k] = { key: k, purchased: 0, sold: 0 } }
    filteredBatches.forEach(b => {
      if (!b.date) return
      const w = isoWeek(b.date)
      if (!w) return
      const k = `${b.date.slice(0, 4)}-W${String(w).padStart(2, '0')}`
      ensure(k)
      weekMap[k].purchased += b.kg || 0
    })
    filteredSales.forEach(x => {
      if (!x.date) return
      const w = isoWeek(x.date)
      if (!w) return
      const k = `${x.date.slice(0, 4)}-W${String(w).padStart(2, '0')}`
      ensure(k)
      weekMap[k].sold += x.kg || 0
    })
    const last4 = Object.values(weekMap).sort((a, b) => (a.key < b.key ? -1 : 1)).slice(-4)
    if (!last4.length) {
      return [1, 2, 3, 4].map(n => ({ name: `W${n}`, purchased: 0, sold: 0 }))
    }
    return last4.map((w, idx) => ({ name: `W${idx + 1}`, purchased: w.purchased, sold: w.sold }))
  })()

  let headers = []
  let rows = []
  let footers = []

  if (tab === 'Purchases') {
    headers = [
      t('Tarehe na Saa', 'Date & Time'),
      t('Manunuzi #', 'Purchase #'),
      t('Mvuvi / BMU', 'Supplier / BMU'),
      t('Samaki & Daraja', 'Species & Grade'),
      t('Uzito (kg)', 'Weight (kg)'),
      t('Bei (TZS)', 'Price (TZS)'),
      t('Jumla (TZS)', 'Total Amount (TZS)'),
      t('Hali', 'Status')
    ]
    rows = filteredBatches.map(b => [
      fmtT(atOf(b)),
      b.pur,
      nm(b.sup),
      `${spLabel(b.sp)} (${b.grade})`,
      f(b.kg),
      f(b.price),
      f(b.kg * b.price),
      b.st === 'accepted' ? t('Imekubaliwa', 'accepted') : t('Inasubiri', 'pending')
    ])
    const totalKg = filteredBatches.reduce((a, b) => a + b.kg, 0)
    const totalAmt = filteredBatches.reduce((a, b) => a + b.kg * b.price, 0)
    footers = [t('Jumla', 'Total'), '', '', `${filteredBatches.length} ${t('manunuzi', 'purchases')}`, f(totalKg), '', f(totalAmt), '']
  } else if (tab === 'Stock') {
    headers = [
      t('Mzigo #', 'Batch #'),
      t('Aina ya Samaki', 'Species'),
      t('Daraja', 'Grade'),
      t('Chumba Baridi', 'Cold Room'),
      t('Waliopokelewa (kg)', 'Received (kg)'),
      t('Waliokataliwa (kg)', 'Rejected (kg)'),
      t('Salio (kg)', 'Remaining (kg)'),
      t('Thamani (TZS)', 'Valuation (TZS)')
    ]
    rows = filteredBatches.map(b => [
      b.no,
      spLabel(b.sp),
      `${t('Daraja', 'Grade')} ${b.grade}`,
      b.wh || s.wh[0],
      f(b.kg),
      f(b.rej || 0),
      f(b.rem),
      f(b.rem * b.price)
    ])
    const totalRem = filteredBatches.reduce((a, b) => a + b.rem, 0)
    const totalVal = filteredBatches.reduce((a, b) => a + b.rem * b.price, 0)
    footers = [t('Jumla', 'Total'), '', '', `${filteredBatches.length} ${t('mizigo', 'lots')}`, '', '', f(totalRem), f(totalVal)]
  } else if (tab === 'Sales') {
    headers = [
      t('Tarehe ya Ankara', 'Invoice Date'),
      t('Ankara #', 'Invoice #'),
      t('Kiwanda / Mteja', 'Customer Industry'),
      t('Samaki & Daraja', 'Fish & Grade'),
      t('Uzito (kg)', 'Weight Sold (kg)'),
      t('Bei/kg (TZS)', 'Price/kg (TZS)'),
      t('Jumla (TZS)', 'Invoiced (TZS)'),
      t('Yamelipwa', 'Paid'),
      t('Salio', 'Balance')
    ]
    rows = filteredSales.map(x => {
      const cusName = s.customers.find(c => c.id === x.cus)?.name || x.cus
      return [
        fmtT(x.at || x.date + 'T00:00'),
        x.no,
        cusName,
        `${spLabel(x.sp)} (${x.grade})`,
        f(x.kg),
        f(x.price),
        f(x.kg * x.price),
        f(x.paid),
        f(x.kg * x.price - x.paid)
      ]
    })
    const totalSold = filteredSales.reduce((a, x) => a + x.kg, 0)
    const totalInvoiced = filteredSales.reduce((a, x) => a + x.kg * x.price, 0)
    const totalPaid = filteredSales.reduce((a, x) => a + x.paid, 0)
    footers = [t('Jumla', 'Total'), '', '', '', f(totalSold), '', f(totalInvoiced), f(totalPaid), f(totalInvoiced - totalPaid)]
  } else {
    const trips = (s.trips || []).filter(x => inR(atOf(x))).sort((p, q) => atOf(q).localeCompare(atOf(p)))
    headers = [
      t('Tarehe na Saa', 'Date & Time'),
      t('Aina ya Safari', 'Trip Type'),
      t('Njia', 'Mode'),
      t('Kutoka -> Kwenda', 'From -> To'),
      t('Rejea', 'Reference'),
      t('Namba ya Gari', 'Vehicle Reg'),
      t('Gharama (TZS)', 'Cost (TZS)')
    ]
    rows = trips.map(x => [
      fmtT(atOf(x)),
      x.type,
      x.mode,
      `${x.from} → ${x.to}`,
      refLabel(s, x),
      x.veh || '-',
      f(x.cost)
    ])
    const totalCost = trips.reduce((a, tr) => a + tr.cost, 0)
    footers = [t('Jumla', 'Total'), '', '', '', '', `${trips.length} ${t('safari', 'trips')}`, f(totalCost)]
  }

  const exportCSV = () => {
    const csvContent = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `fishtrade-${tab.toLowerCase()}-report.csv`
    link.click()
  }

  const tabLabel = k =>
    k === 'Purchases'
      ? t('Manunuzi', 'Purchases')
      : k === 'Stock'
        ? t('Stoo', 'Stock')
        : k === 'Sales'
          ? t('Mauzo', 'Sales')
          : t('Usafiri', 'Transport')

  return (
    <div className="page-body">
      {/* Desktop Header */}
      <div className="hidden md:flex md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Ripoti za Biashara na Kuhamisha CSV', 'Business Intelligence Reports & CSV Exports')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Chuja historia ya manunuzi, salio la stoo, ankara za mauzo, na gharama za usafiri.', 'Filter historical purchases, inventory balances, sales invoices, and freight costs.')}
          </p>
        </div>
        <button onClick={exportCSV} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
          <Download size={16} /> {t('Pakua Ripoti ya CSV', 'Export Dataset to CSV')}
        </button>
      </div>

      {/* Period Pill Strip matching Screen 11 */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'Month', label: t('Mwezi Huu', 'This Month') },
          { id: '3Months', label: t('Miezi 3', 'Last 3 Months') },
          { id: 'Custom', label: t('Chagua Muda', 'Custom') },
          { id: 'All', label: t('Wote', 'All Time') },
        ].map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition shrink-0 ${
              period === p.id
                ? 'bg-[#052d56] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={exportCSV}
          className="md:hidden ml-auto px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 shrink-0"
        >
          <Download size={13} /> CSV
        </button>
      </div>

      {/* Business Performance Chart + 4 Stacked KPI Cards (Screen 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <div className="mobile-card lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14.5px] font-extrabold text-slate-900 m-0">
              {t('Ufanisi wa Biashara', 'Business Performance')}
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1d70f5]" /> {t('Manunuzi', 'Purchased')}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22c55e]" /> {t('Mauzo', 'Sold')}</span>
            </div>
          </div>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfData} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, name) => [`${f(val)} kg`, name === 'purchased' ? t('Walionunuliwa', 'Purchased') : t('Waliouzwa', 'Sold')]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="purchased" fill="#1d70f5" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="sold" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 Clean Metric Rows matching Screen 11 */}
        <div className="flex flex-col gap-2">
          {[
            {
              icon: Scale,
              bg: 'bg-blue-50 text-blue-600',
              label: t('Jumla ya Manunuzi', 'Total Purchased'),
              value: `${f(totalPurchasedKg)} kg`,
            },
            {
              icon: ShoppingBag,
              bg: 'bg-emerald-50 text-emerald-600',
              label: t('Jumla ya Mauzo', 'Total Sold'),
              value: `${f(totalSoldKg)} kg`,
            },
            {
              icon: DollarSign,
              bg: 'bg-amber-50 text-amber-600',
              label: t('Faida Ghafi', 'Gross Profit'),
              value: fmtCompactTzs(grossProfit),
            },
            {
              icon: Trash2,
              bg: 'bg-rose-50 text-rose-600',
              label: t('Upotevu / Uharibifu', 'Loss / Wastage'),
              value: `${f(wasteKg)} kg (${wastePct}%)`,
            },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="mobile-card flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
                    <Icon size={17} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 truncate">{item.label}</span>
                </div>
                <b className="text-sm font-mono font-extrabold text-slate-900 shrink-0 tabular-nums">{item.value}</b>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dataset Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {['Purchases', 'Stock', 'Sales', 'Transport'].map(tabKey => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setTab(tabKey)}
            className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              tab === tabKey ? 'border-[#052d56] text-[#052d56]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tabLabel(tabKey)}
          </button>
        ))}
      </div>

      {/* Custom Filter Strip (shown on Desktop or when Custom selected on Mobile) */}
      <div className={`panel p-4 flex-col gap-3 ${period === 'Custom' ? 'flex' : 'hidden md:flex'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter size={14} /> {t('Chuja Rekodi:', 'Dataset Filters:')}
          </span>
          <div className="flex items-center gap-1.5">
            {['Today', '7 days', 'Month', 'All'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setPreset(k)}
                className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                {k === 'Today' ? t('Leo', 'Today') : k === '7 days' ? t('Siku 7', '7 days') : k === 'Month' ? t('Mwezi', 'Month') : t('Wote', 'All')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <Field label={t('Kuanzia Tarehe', 'From Date')}>
            <input type="datetime-local" value={fr} onChange={e => setFr(e.target.value)} className="input-field py-1 text-xs" />
          </Field>
          <Field label={t('Mpaka Tarehe', 'To Date')}>
            <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)} className="input-field py-1 text-xs" />
          </Field>
          {tab !== 'Transport' && (
            <Field label={t('Aina ya Samaki', 'Fish Species')}>
              <select value={sp} onChange={e => setSp(e.target.value)} className="input-field py-1 text-xs">
                <option value="">{t('Aina Zote', 'All Species')}</option>
                {['Nile Perch', 'Tilapia', 'Dagaa (Sardines)', 'Catfish'].map(x => <option key={x} value={x}>{spLabel(x)}</option>)}
              </select>
            </Field>
          )}
          {tab === 'Purchases' && (
            <Field label={t('Mvuvi / Msambazaji', 'Supplier')}>
              <select value={sup} onChange={e => setSup(e.target.value)} className="input-field py-1 text-xs">
                <option value="">{t('Wavuvi Wote', 'All Suppliers')}</option>
                {s.suppliers.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </Field>
          )}
        </div>
      </div>

      {/* Mobile Report Record Cards (< md) */}
      <div className="md:hidden space-y-2">
        {rows.slice(0, 20).map((row, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setViewRow(row)}
            className="mobile-card w-full flex items-center justify-between gap-3 text-left"
          >
            <div className="min-w-0">
              <b className="text-xs font-mono text-[#052d56] block truncate">{row[1] || row[0]}</b>
              <span className="text-xs font-bold text-slate-900 block truncate">{row[2] || row[3]}</span>
              <span className="text-[11px] text-slate-500 block truncate">{row[0]} · {row[3]}</span>
            </div>
            <div className="text-right shrink-0">
              <b className="text-xs font-mono font-bold text-slate-900 block">{row[4]}</b>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold">{row[6] || row[7]}</span>
            </div>
          </button>
        ))}
        {rows.length === 0 && (
          <div className="mobile-card p-6 text-center text-xs text-slate-500">
            {t('Hakuna rekodi kwa kipindi hiki.', 'No records for this period.')}
          </div>
        )}
      </div>

      {/* Desktop Data Table (md+) */}
      <div className="hidden md:block panel p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-700 font-mono">
            {rows.length} {t('REKODI ZIMEPATIKANA', 'RECORD(S) FOUND')}
          </span>
          <button onClick={exportCSV} className="text-xs text-blue-700 hover:underline font-semibold flex items-center gap-1">
            <FileSpreadsheet size={14} /> {t('Pakua Jedwali (CSV)', 'Download spreadsheet')}
          </button>
        </div>
        <div className="data-table-wrap border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map(h => <th key={h}>{h}</th>)}
                <th className="text-right">{t('Vitendo', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className={cIdx >= 4 && cIdx <= 6 ? 'font-mono' : ''}>{cell}</td>
                  ))}
                  <td className="text-right"><ViewBtn onClick={() => setViewRow(row)} /></td>
                </tr>
              ))}
            </tbody>
            {footers.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  {footers.map((foot, fIdx) => (
                    <td key={fIdx} className="font-mono text-slate-900 py-3">{foot}</td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {viewRow && (
        <DetailModal
          title={`${t('Maelezo ya Ripoti:', 'Report Record Details:')} ${viewRow[1] || viewRow[0] || ''}`}
          subtitle={tabLabel(tab)}
          onClose={() => setViewRow(null)}
          fields={headers.map((h, i) => ({
            label: h,
            value: viewRow[i] ?? '—',
            mono: i >= 4 && i <= 6,
            highlight: i === headers.length - 1
          }))}
        />
      )}
    </div>
  )
}

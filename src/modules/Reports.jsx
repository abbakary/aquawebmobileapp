import React, { useState } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  Search,
  ArrowRight
} from 'lucide-react'
import { useS, nowL, refLabel } from '../store'
import { Field, FishPhoto, DetailModal, ViewBtn, f, tzs, fmtT, atOf } from '../ui'

export default function Reports() {
  const { s, t, spLabel } = useS()
  const [tab, setTab] = useState('Purchases') // 'Purchases', 'Stock', 'Sales', 'Transport'
  const [fr, setFr] = useState('')
  const [to, setTo] = useState('')
  const [sup, setSup] = useState('')
  const [sp, setSp] = useState('')
  const [wh, setWh] = useState('')
  const [viewRow, setViewRow] = useState(null)

  const setPreset = k => {
    if (k === 'All') {
      setFr('')
      setTo('')
      return
    }
    const x = new Date()
    if (k === 'Today') {
      x.setHours(0, 0, 0, 0)
    } else if (k === '7 days') {
      x.setDate(x.getDate() - 7)
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

  const batches = s.batches
    .filter(b => inR(atOf(b)) && (!sup || b.sup === sup) && (!sp || b.sp === sp) && (tab !== 'Stock' || !wh || (b.wh || s.wh[0]) === wh))
    .sort((x, y) => atOf(y).localeCompare(atOf(x)))

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
    rows = batches.map(b => [
      fmtT(atOf(b)),
      b.pur,
      nm(b.sup),
      `${spLabel(b.sp)} (${b.grade})`,
      f(b.kg),
      f(b.price),
      f(b.kg * b.price),
      b.st === 'accepted' ? t('Imekubaliwa', 'accepted') : t('Inasubiri', 'pending')
    ])
    const totalKg = batches.reduce((a, b) => a + b.kg, 0)
    const totalAmt = batches.reduce((a, b) => a + b.kg * b.price, 0)
    footers = [t('Jumla', 'Total'), '', '', `${batches.length} ${t('manunuzi', 'purchases')}`, f(totalKg), '', f(totalAmt), '']
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
    rows = batches.map(b => [
      b.no,
      spLabel(b.sp),
      `${t('Daraja', 'Grade')} ${b.grade}`,
      b.wh || s.wh[0],
      f(b.kg),
      f(b.rej || 0),
      f(b.rem),
      f(b.rem * b.price)
    ])
    const totalRem = batches.reduce((a, b) => a + b.rem, 0)
    const totalVal = batches.reduce((a, b) => a + b.rem * b.price, 0)
    footers = [t('Jumla', 'Total'), '', '', `${batches.length} ${t('mizigo', 'lots')}`, '', '', f(totalRem), f(totalVal)]
  } else if (tab === 'Sales') {
    const sales = s.sales
      .filter(x => inR(x.at || x.date + 'T00:00') && (!sp || x.sp === sp))
      .sort((a, b) => (b.at || b.date).localeCompare(a.at || a.date))

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
    rows = sales.map(x => {
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
    const totalSold = sales.reduce((a, x) => a + x.kg, 0)
    const totalInvoiced = sales.reduce((a, x) => a + x.kg * x.price, 0)
    const totalPaid = sales.reduce((a, x) => a + x.paid, 0)
    footers = [t('Jumla', 'Total'), '', '', '', f(totalSold), '', f(totalInvoiced), f(totalPaid), f(totalInvoiced - totalPaid)]
  } else {
    // Transport
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
      ? t('Ripoti ya Manunuzi', 'Purchases Report')
      : k === 'Stock'
      ? t('Ripoti ya Stoo', 'Stock Report')
      : k === 'Sales'
      ? t('Ripoti ya Mauzo', 'Sales Report')
      : t('Ripoti ya Usafiri', 'Transport Report')

  return (
    <div className="page-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {['Purchases', 'Stock', 'Sales', 'Transport'].map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
              tab === tabKey ? 'border-blue-700 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tabLabel(tabKey)}
          </button>
        ))}
      </div>

      {/* Filter Strip */}
      <div className="panel p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter size={14} /> {t('Chagua Muda:', 'Date Presets:')}
          </span>
          <div className="flex items-center gap-1.5">
            {['Today', '7 days', 'This Month', 'All'].map(k => (
              <button
                key={k}
                onClick={() => setPreset(k === 'This Month' ? 'Month' : k)}
                className="px-3 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                {k === 'Today' ? t('Leo', 'Today') : k === '7 days' ? t('Siku 7', '7 days') : k === 'This Month' ? t('Mwezi Huu', 'This Month') : t('Wote', 'All')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <Field label={t('Kuanzia Tarehe', 'From Date')}>
            <input
              type="datetime-local"
              value={fr}
              onChange={e => setFr(e.target.value)}
              className="input-field py-1 text-xs"
            />
          </Field>
          <Field label={t('Mpaka Tarehe', 'To Date')}>
            <input
              type="datetime-local"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="input-field py-1 text-xs"
            />
          </Field>
          {tab !== 'Transport' && (
            <Field label={t('Chuja kwa Aina ya Samaki', 'Filter by Species')}>
              <select
                value={sp}
                onChange={e => setSp(e.target.value)}
                className="input-field py-1 text-xs"
              >
                <option value="">{t('Aina Zote za Samaki', 'All Fish Species')}</option>
                {['Nile Perch', 'Tilapia', 'Dagaa (Sardines)', 'Catfish'].map(x => (
                  <option key={x} value={x}>{spLabel(x)}</option>
                ))}
              </select>
            </Field>
          )}
          {tab === 'Purchases' && (
            <Field label={t('Chuja kwa Mvuvi / Msambazaji', 'Filter by Supplier')}>
              <select
                value={sup}
                onChange={e => setSup(e.target.value)}
                className="input-field py-1 text-xs"
              >
                <option value="">{t('Wavuvi Wote', 'All Suppliers')}</option>
                {s.suppliers.map(x => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="panel p-0 overflow-hidden">
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
                {headers.map(h => (
                  <th key={h}>{h}</th>
                ))}
                <th className="text-right">{t('Vitendo', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className={cIdx >= 4 && cIdx <= 6 ? 'font-mono' : ''}>
                      {cell}
                    </td>
                  ))}
                  <td className="text-right">
                    <ViewBtn onClick={() => setViewRow(row)} />
                  </td>
                </tr>
              ))}
            </tbody>
            {footers.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  {footers.map((foot, fIdx) => (
                    <td key={fIdx} className="font-mono text-slate-900 py-3">
                      {foot}
                    </td>
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
          title={`${t('Maelezo ya Ripoti:', 'Report Record Details:')} ${viewRow[0] || ''}`}
          subtitle={tab}
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

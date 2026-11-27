import React, { useState } from 'react'
import {
  DollarSign,
  Receipt,
  Plus,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { useS, trCost } from '../store'
import { Modal, Field, Badge, DetailModal, ViewBtn, f, tzs } from '../ui'

const CATS = [
  'Flake Ice & Insulated Crates',
  'Loading & Dock Handling Labor',
  'Fuel & Generator Backup',
  'Staff Wages & Allowances',
  'Cold Storage Electricity',
  'Boat & Pier Dockage Fees',
  'Other Overhead'
]

const EXPENSE_COLORS = ['#0284c7', '#ea580c', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#94a3b8']

export default function Expenses({ go }) {
  const { s, a, t } = useS()
  const [open, setOpen] = useState(false)
  const [viewExp, setViewExp] = useState(null)
  const [d, setD] = useState({ cat: CATS[0], amt: '350000', desc: '' })

  const rev = s.sales.reduce((t, x) => t + x.kg * x.price, 0)
  const cogs = s.sales.reduce((t, x) => t + x.cogs, 0)
  const loss = s.batches.reduce((t, b) => t + (b.waste || 0) * b.price, 0)
  const opExps = s.exps.reduce((t, e) => t + e.amt, 0)
  const tr = trCost(s)
  const totalLandedLogistics = tr + loss + opExps
  const grossProfit = rev - cogs
  const netProfit = grossProfit - totalLandedLogistics

  const chartData = [
    { name: 'Fish Purchases (COGS)', value: cogs, color: '#0b3a8c' },
    { name: 'Refrigerated Transport', value: tr, color: '#f28c28' },
    { name: 'Ice & Packaging', value: opExps * 0.45, color: '#0284c7' },
    { name: 'Power & Fuel', value: opExps * 0.35, color: '#10b981' },
    { name: 'Handling & Labor', value: opExps * 0.2, color: '#8b5cf6' },
    { name: 'Shrinkage & Loss', value: loss, color: '#ef4444' }
  ].filter(x => x.value > 0)

  const handleSaveExp = () => {
    a.addExp({
      cat: d.cat,
      amt: +d.amt || 0,
      desc: d.desc || d.cat
    })
    setOpen(false)
    setD({ cat: CATS[0], amt: '', desc: '' })
  }

  return (
    <div className="page-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Matumizi ya Uendeshaji na Faida Halisi', 'Operational Expenses & Landed Profit')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Hesabu za barafu, vibarua, umeme, usafiri wa baridi, na faida halisi.', 'Landed cost accounting: ice, dock labor, electricity, refrigerated transit, and net profit calculations.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus size={16} /> {t('Rekodi Matumizi Mapya', 'Record Operational Expense')}
          </button>
        </div>
      </div>

      {/* P&L Statement Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Breakdown Card */}
        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <div>
              <h3>{t('Taarifa ya Faida na Hasara (P&L)', 'Profit & Loss Statement (Consolidated)')}</h3>
              <p>{t('Mapato ukitoa manunuzi, usafiri, na gharama za uendeshaji', 'Revenues minus acquisition, logistics, and overhead')}</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">{t('Fedha: TZS', 'TZS Currency')}</span>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-800">{t('1. Mapato Ghafi ya Mauzo ya Viwanda', '1. Gross Factory Sales Revenue')}</span>
              <b className="font-mono text-sm text-slate-900">{tzs(rev)}</b>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-rose-700">
              <span>{t('Toa: Manunuzi ya Samaki (COGS)', 'Less: Direct Fish Purchases (COGS)')}</span>
              <b className="font-mono text-sm">- {tzs(cogs)}</b>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 font-bold">
              <span>{t('Faida Ghafi ya Biashara', 'Gross Margin (Trading Profit)')}</span>
              <span className="font-mono text-base">{tzs(grossProfit)}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-rose-700">
              <span>{t('Toa: Usafirishaji wa Baridi', 'Less: Refrigerated Transport & Freight')}</span>
              <b className="font-mono text-sm">- {tzs(tr)}</b>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-rose-700">
              <span>{t('Toa: Gharama za Uendeshaji (Barafu, Umeme, Vibarua, Mishahara)', 'Less: Operating Expenses (Ice, Power, Dock Labor)')}</span>
              <b className="font-mono text-sm">- {tzs(opExps)}</b>
            </div>

            {loss > 0 && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                <span>{t('Toa: Hasara ya Samaki Walioharibika', 'Less: Documented Spoilage & Wastage')}</span>
                <b className="font-mono text-sm">- {tzs(loss)}</b>
              </div>
            )}

            <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-sm mt-1">
              <span>{t('Faida Halisi ya Uendeshaji', 'Net Operating Profit')}</span>
              <span className="font-mono text-xl text-emerald-800">{tzs(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Cost Structure Donut Chart */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>{t('Mgawanyo wa Gharama', 'Cost Structure')}</h3>
              <p>{t('Mchanganuo wa manunuzi na usafirishaji', 'Breakdown of acquisition & logistics')}</p>
            </div>
          </div>
          <div className="w-full h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={val => tzs(val)} contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 text-xs">
            {chartData.map(c => (
              <div key={c.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
                <b className="font-mono text-slate-800">{tzs(c.value)}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Ledger Table */}
      <div className="panel p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 m-0">{t('Daftari la Matumizi ya Uendeshaji', 'Operating Expense Journal')}</h3>
          <p className="text-xs text-slate-500 m-0">{t('Matumizi yote yaliyorekodiwa na uhasibu na uendeshaji', 'Line-item expenses recorded by accounting and operations')}</p>
        </div>
        <div className="data-table-wrap border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('Kundi la Matumizi', 'Category')}</th>
                <th>{t('Maelezo', 'Description')}</th>
                <th>{t('Kiasi (TZS)', 'Amount (TZS)')}</th>
                <th>{t('Tarehe', 'Date Logged')}</th>
                <th>{t('Hali', 'Status')}</th>
                <th className="text-right">{t('Vitendo', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {[...s.exps].reverse().map(e => (
                <tr key={e.id}>
                  <td>
                    <b className="text-slate-900">{e.cat}</b>
                  </td>
                  <td>
                    <span className="text-slate-600 text-xs">{e.desc || e.cat}</span>
                  </td>
                  <td>
                    <b className="font-mono text-slate-900">{tzs(e.amt)}</b>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-slate-500">{e.date}</span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t('Imeidhinishwa', 'Approved')}
                    </span>
                  </td>
                  <td className="text-right">
                    <ViewBtn onClick={() => setViewExp(e)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewExp && (
        <DetailModal
          title={t('Maelezo ya Matumizi ya Uendeshaji', 'Operating Expense Details')}
          subtitle={`${viewExp.cat} · ${viewExp.date}`}
          badge={<Badge variant="green">{t('Imeidhinishwa', 'Approved')}</Badge>}
          onClose={() => setViewExp(null)}
          fields={[
            { label: t('Kundi la Matumizi', 'Expense Category'), value: viewExp.cat, fullWidth: true },
            { label: t('Maelezo ya Matumizi', 'Description'), value: viewExp.desc || viewExp.cat, fullWidth: true },
            { label: t('Kiasi Kilichotumika', 'Amount Spent'), value: tzs(viewExp.amt), mono: true, highlight: true },
            { label: t('Tarehe Iliyorekodiwa', 'Date Logged'), value: viewExp.date, mono: true },
          ]}
        />
      )}

      {/* Add Expense Modal */}
      {open && (
        <Modal
          title={t('Rekodi Matumizi ya Uendeshaji', 'Record Operating Expense')}
          subtitle={t('Ingiza gharama za mwaloni, vifungashio, au vyumba vya baridi', 'Log costs for landing operations, packaging, or cold rooms')}
          onClose={() => setOpen(false)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Kundi la Matumizi', 'Expense Category')}>
              <select
                value={d.cat}
                onChange={e => setD({ ...d, cat: e.target.value })}
                className="input-field font-semibold"
              >
                {CATS.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label={t('Kiasi (TZS)', 'Amount (TZS)')}>
              <input
                type="number"
                value={d.amt}
                onChange={e => setD({ ...d, amt: e.target.value })}
                className="input-field font-mono font-bold text-lg"
              />
            </Field>

            <Field label={t('Maelezo / Mtoa Huduma', 'Description / Vendor Details')}>
              <input
                type="text"
                placeholder={t('mf. Mifuko 50 ya barafu kutoka Kirumba Ice Plant', 'e.g. 50 bags crushed ice from Kirumba Ice Plant')}
                value={d.desc}
                onChange={e => setD({ ...d, desc: e.target.value })}
                className="input-field"
              />
            </Field>

            <button
              type="button"
              disabled={!(+d.amt > 0)}
              onClick={handleSaveExp}
              className="btn-primary mt-2"
            >
              {t('Hifadhi Matumizi', 'Post Expense to Ledger')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

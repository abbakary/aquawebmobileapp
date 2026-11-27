import React, { useState } from 'react'
import {
  Users,
  Anchor,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Plus,
  Search,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Fuel as FuelIcon,
  Wrench,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'
import { useS, SITES, supBal, supFuelDebt, supMaintDebt, supAccountStatement, supPurchaseStatus, batchNet, batchDeduction, tot } from '../store'
import { Modal, Field, Badge, FishPhoto, ViewBtn, f, tzs, fmtT } from '../ui'

export default function Suppliers() {
  const { s, a, x, t, spLabel, catLabel } = useS()
  const [open, setOpen] = useState(false)
  const [viewSup, setViewSup] = useState(null)
  const [paySup, setPaySup] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all') // 'all' | 'internal' | 'independent' | 'company' | 'trader'
  const [sourceType, setSourceType] = useState('independent')
  const [payForm, setPayForm] = useState({ amt: '', m: 'M-Pesa (Mobile Money)' })
  const [refreshing, setRefreshing] = useState(false)
  const [d, setD] = useState({
    name: '',
    phone: '',
    site: SITES[0] || 'Mwanza Main Landing (Kirumba)',
    cat: 'Independent Fisherman',
    source_type: 'independent',
    boat: 'MV Furaha',
    nida: '',
    contactPerson: '',
  })

  const totalKg = s.batches.reduce((t, b) => t + b.kg, 0)
  const totalDebt = s.suppliers.reduce((t, x) => t + supBal(s, x.id), 0)

  const getSourceType = sup => {
    if (sup.source_type) return sup.source_type
    const c = (sup.cat || '').toLowerCase()
    if (c.includes('company') || c.includes('internal')) return 'internal'
    if (c.includes('dealer') || c.includes('middleman') || c.includes('agent') || c.includes('dalali')) return 'trader'
    if (c.includes('group') || c.includes('bmu') || c.includes('farm') || c.includes('business')) return 'company'
    return 'independent'
  }

  const filteredSuppliers = s.suppliers.filter(x => {
    const q = search.toLowerCase()
    const matchesSearch =
      x.name.toLowerCase().includes(q) ||
      (x.no || '').toLowerCase().includes(q) ||
      (x.site || '').toLowerCase().includes(q) ||
      (x.boat || '').toLowerCase().includes(q)

    const st = getSourceType(x)
    const matchesCat =
      catFilter === 'all' ||
      (catFilter === 'internal' && st === 'internal') ||
      (catFilter === 'independent' && st === 'independent') ||
      (catFilter === 'company' && st === 'company') ||
      (catFilter === 'trader' && st === 'trader')

    return matchesSearch && matchesCat
  })

  const handlePay = () => {
    if (!paySup) return
    const value = Math.min(+payForm.amt || 0, Math.max(0, supBal(s, paySup.id)))
    if (!(value > 0)) return
    a.pay(paySup.id, value, payForm.m)
    setPaySup(null)
    setPayForm({ amt: '', m: 'M-Pesa (Mobile Money)' })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try { await x.refreshSession() } finally { setRefreshing(false) }
  }

  return (
    <div className="page-body">
      {/* Central Hub Navigation Bar: One Point of Control */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 text-white rounded-xl shadow-sm mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
            <Users size={14} /> {t('Kituo Kikuu:', 'Control Hub:')}
          </span>
          <div className="flex items-center gap-1 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-bold">
              {t('1. Wasambazaji (Suppliers)', '1. Suppliers')}
            </span>
            <a
              href="#/crew"
              className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              {t('2. Wavuvi & Boti (Fishermen & Fleet)', '2. Fishermen & Fleet')}
            </a>
            <a
              href="#/buy"
              className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              {t('3. Manunuzi & Mizani (Procurement)', '3. Procurement & Catches')}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5" title={t('Sasisha data kutoka seva', 'Refresh data from server')}>
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? t('Inasasisha...', 'Refreshing...') : t('Sasisha', 'Refresh')}
          </button>
          <button onClick={() => setOpen(true)} className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500">
            <Plus size={14} /> {t('Sajili Chanzo Kipya', 'Register Fish Source')}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{t('Wavuvi na Wasambazaji', 'Fishermen & Supplier Management')}</h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Daftari la wavuvi, mikataba ya BMU, historia ya samaki walioletwa, na madeni.', 'Digital supplier registry, landing site BMU agreements, historical deliveries, and debt tracking.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary flex items-center gap-1.5" title={t('Sasisha data kutoka seva', 'Refresh data from server')}>
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? t('Inasasisha...', 'Refreshing...') : t('Sasisha', 'Refresh')}
          </button>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus size={16} /> {t('Sajili Mvuvi / BMU Mpya', 'Register New Supplier / BMU')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Users size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Wavuvi Waliosajiliwa', 'Active Registered Suppliers')}</small>
            <b>{s.suppliers.length} <span className="text-xs font-sans text-slate-400">{t('wavuvi', 'fishers')}</span></b>
            <span className="kpi-sub">{t('Ziwa Victoria & Tanganyika', 'Lake Victoria & Tanganyika')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <Anchor size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Jumla ya Samaki Walioletwa', 'Total Fish Sourced')}</small>
            <b>{f(totalKg)} <span className="text-xs font-sans text-slate-400">kg</span></b>
            <span className="kpi-sub">{t('Katika mialo yote', 'Across landing stations')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <DollarSign size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Jumla ya Madeni ya Wavuvi', 'Outstanding Balances')}</small>
            <b className="text-rose-700">{tzs(totalDebt)}</b>
            <span className="kpi-sub">{t('Yanayosubiri malipo', 'Pending disbursement')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap purple">
            <ShieldCheck size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Uzingatiaji wa Sheria za BMU', 'BMU Agreement Compliance')}</small>
            <b>98.4%</b>
            <span className="kpi-sub">{t('Zana halali za uvuvi', 'Verified legal fishing gear')}</span>
          </div>
        </div>
      </div>

      {/* Classification Filters & Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: t('Wasambazaji Wote', 'All Sources') },
            { id: 'internal', label: t('01 · Wavuvi wa Kampuni', '01 · Company-managed') },
            { id: 'independent', label: t('02 · Wavuvi Huru', '02 · Independent') },
            { id: 'company', label: t('03 · Kampuni za Uvuvi', '03 · Fishing Companies') },
            { id: 'trader', label: t('04 · Madalali & Mawakala', '04 · Traders & Agents') },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setCatFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                catFilter === f.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('Tafuta mvuvi kwa jina, namba (SUP-001), boti au mwalo...', 'Search suppliers by name, code (SUP-001), boat or landing site...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('Namba & Jina la Mvuvi', 'Supplier Code & Name')}</th>
              <th>{t('Kundi & Boti', 'Category & Boat')}</th>
              <th>{t('Mwalo & Simu', 'Landing Site & Phone')}</th>
              <th>{t('Jumla Aliyouza', 'Total Supplied')}</th>
              <th>{t('Maelezo ya Akaunti', 'Account Details')}</th>
              <th>{t('Salio Halisi', 'Net Balance')}</th>
              <th className="text-right">{t('Vitendo', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map(sup => {
              const supBatches = s.batches.filter(b => b.sup === sup.id)
              const supKg = supBatches.reduce((sum, b) => sum + b.kg, 0)
              const stmt = supAccountStatement(s, sup.id)
              const bal = supBal(s, sup.id)
              const linkedBoat = (s.boats || []).find(bt => bt.ownerId === sup.id || bt.supId === sup.id)
              const purchaseRows = supPurchaseStatus(s, sup.id)
              const nUnpaid = purchaseRows.filter(r => r.status === 'unpaid').length
              const nPartial = purchaseRows.filter(r => r.status === 'partial').length
              return (
                <tr key={sup.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-800 font-bold flex items-center justify-center text-xs border border-blue-200 shrink-0">
                        {sup.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <b className="text-slate-900 block">{sup.name}</b>
                        <small className="text-slate-400 font-mono">{sup.no || 'SUP-00' + sup.id.slice(1)}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={sup.cat === 'BMU Fishing Group' ? 'blue' : 'neutral'}>
                        {catLabel ? catLabel(sup.cat) : sup.cat}
                      </Badge>
                      <small className="text-[11px] text-slate-500 font-mono">
                        {linkedBoat ? `${linkedBoat.name} (${linkedBoat.regNo || linkedBoat.reg})` : (sup.boat || 'MV Victoria')}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-slate-800 flex items-center gap-1 text-xs font-medium">
                        <MapPin size={12} className="text-slate-400" /> {sup.site}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 mt-0.5">{sup.phone}</span>
                    </div>
                  </td>
                  <td>
                    <b className="font-mono text-slate-900 block">{f(supKg)} kg</b>
                    <small className="text-[11px] text-slate-400">{supBatches.length} {t('mizigo', 'batches')}</small>
                  </td>
                  <td>
                    <div className="flex flex-col text-[11px] font-mono">
                      <span className="text-slate-700">{t('Samaki:', 'Fish:')} <b>{tzs(stmt.totalCatchValue)}</b></span>
                      <span className="text-emerald-700">{t('Amelipwa:', 'Paid:')} {tzs(stmt.totalCatchPaid)}</span>
                      {(stmt.fuelDebt > 0 || stmt.maintDebt > 0) ? (
                        <span className="text-rose-600">
                          {t('Deni Mafuta/Boti:', 'Fuel/Maint Debt:')} -{tzs(stmt.fuelDebt + stmt.maintDebt)}
                        </span>
                      ) : (
                        <span className="text-emerald-600">{t('Hana deni la mafuta/boti', 'No fuel/boat debt')}</span>
                      )}
                      <span className="text-slate-500">
                        {purchaseRows.length} {t('manunuzi', 'purchases')}
                        {nUnpaid > 0 && ` · ${nUnpaid} ${t('hayajalipwa', 'unpaid')}`}
                        {nPartial > 0 && ` · ${nPartial} ${t('kiasi', 'partial')}`}
                      </span>
                    </div>
                  </td>
                  <td>
                    <b className={`font-mono ${stmt.netBalance > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700'}`}>
                      {tzs(stmt.netBalance)}
                    </b>
                    <small className="block text-[10px] text-slate-400">
                      {stmt.netBalance > 0 ? t('Anadai malipo', 'Payable') : t('Akaunti safi', 'Settled')}
                    </small>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ViewBtn onClick={() => setViewSup(sup)} />
                      {bal > 0 && (
                        <button
                          onClick={() => {
                            setPaySup(sup)
                            setPayForm({ amt: String(bal), m: 'M-Pesa (Mobile Money)' })
                          }}
                          className="btn-primary text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CreditCard size={12} /> {t('Lipa', 'Pay')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Register New Fish Source Modal */}
      {open && (
        <Modal
          title={t('Sajili Chanzo Kipya cha Samaki', 'Register New Fish Source')}
          subtitle={t('Chagua nani anasambaza samaki na weka taarifa zake', 'Select fish supply classification and record details')}
          onClose={() => setOpen(false)}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                {t('Nani anasambaza samaki? (Aina ya Chanzo)', 'Who is supplying the fish? (Source Classification)')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'internal',
                    title: t('01 · Wavuvi wa Kampuni', '01 · Company-managed'),
                    desc: t('Wavuvi wanaosimamiwa na kituo chenu (boti, mafuta, vifaa)', 'Fishermen managed by your fleet with company boats & fuel'),
                    cat: 'Company-managed Fishermen',
                  },
                  {
                    id: 'independent',
                    title: t('02 · Mvuvi Huru', '02 · Independent Fisher'),
                    desc: t('Wavuvi au wamiliki wa boti wanaouza moja kwa moja', 'Independent boat owners selling directly to buying site'),
                    cat: 'Independent Fisherman',
                  },
                  {
                    id: 'company',
                    title: t('03 · Kampuni ya Uvuvi', '03 · Fishing Company'),
                    desc: t('Kampuni au kikundi cha BMU chenye wavuvi wake', 'External fishing company or BMU cooperative supplying fish'),
                    cat: 'Other Fishing Company / BMU',
                  },
                  {
                    id: 'trader',
                    title: t('04 · Mfanyabiashara / Dalali', '04 · Trader & Agent'),
                    desc: t('Mawakala na wakusanyaji samaki mialoni', 'Traders or middlemen collecting fish across landing points'),
                    cat: 'Dealer / Fish Trader',
                  },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSourceType(opt.id)
                      setD(prev => ({ ...prev, cat: opt.cat, source_type: opt.id }))
                    }}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      sourceType === opt.id
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <b className={`text-xs block ${sourceType === opt.id ? 'text-blue-900' : 'text-slate-900'}`}>
                      {opt.title}
                    </b>
                    <span className="text-[10px] text-slate-500 mt-1 leading-snug">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <Field label={
              sourceType === 'company'
                ? t('Jina la Kampuni au Kikundi cha BMU', 'Company or BMU Group Name')
                : sourceType === 'trader'
                ? t('Jina la Dalali / Mfanyabiashara', 'Trader / Agent Name')
                : t('Jina Kamili la Mvuvi', 'Fisherman Full Name')
            }>
              <input
                type="text"
                placeholder={sourceType === 'company' ? 'mf. Victoria Fishery Ltd au BMU Katonga' : 'mf. Juma Ramadhani'}
                value={d.name}
                onChange={e => setD({ ...d, name: e.target.value })}
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Namba ya Simu', 'Phone Number')}>
                <input
                  type="tel"
                  placeholder="0754 123 456"
                  value={d.phone}
                  onChange={e => setD({ ...d, phone: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>

              <Field label={t('Kitambulisho cha NIDA / TIN', 'NIDA / TIN Reg')}>
                <input
                  type="text"
                  placeholder="NIDA / TIN"
                  value={d.nida || ''}
                  onChange={e => setD({ ...d, nida: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Mwalo Mkuu / Eneo', 'Landing Site / Area')}>
                <input
                  type="text"
                  list="landing-sites-sup"
                  placeholder={SITES[0]}
                  value={d.site}
                  onChange={e => setD({ ...d, site: e.target.value })}
                  className="input-field"
                />
                <datalist id="landing-sites-sup">
                  {SITES.map(x => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
              </Field>

              <Field label={
                sourceType === 'company'
                  ? t('Mwakilishi / Msimamizi', 'Contact Person')
                  : t('Jina au Namba ya Boti', 'Boat Name or Reg')
              }>
                <input
                  type="text"
                  placeholder={sourceType === 'company' ? 'mf. Hamisi (Meneja)' : 'mf. MV Victoria 02'}
                  value={sourceType === 'company' ? (d.contactPerson || '') : d.boat}
                  onChange={e => {
                    if (sourceType === 'company') {
                      setD({ ...d, contactPerson: e.target.value, boat: e.target.value })
                    } else {
                      setD({ ...d, boat: e.target.value })
                    }
                  }}
                  className="input-field"
                />
              </Field>
            </div>

            <button
              type="button"
              disabled={!d.name.trim()}
              onClick={() => {
                a.addSup({
                  ...d,
                  name: d.name.trim(),
                  phone: d.phone.trim(),
                  source_type: sourceType,
                })
                setOpen(false)
                setD({
                  name: '',
                  phone: '',
                  site: SITES[0] || 'Mwanza Main Landing (Kirumba)',
                  cat: 'Independent Fisherman',
                  source_type: 'independent',
                  boat: 'MV Furaha',
                  nida: '',
                  contactPerson: '',
                })
              }}
              className="btn-primary mt-2"
            >
              {t('Hifadhi Chanzo Kwenye Daftari', 'Save Fish Source to Register')}
            </button>
          </div>
        </Modal>
      )}

      {/* Supplier Ledger & Comprehensive Financial Statement Modal */}
      {viewSup && (() => {
        const statement = supAccountStatement(s, viewSup.id)
        const supBatches = s.batches.filter(b => b.sup === viewSup.id)
        const supPayments = (s.pays || []).filter(p => p.sup === viewSup.id)
        const purchaseRows = supPurchaseStatus(s, viewSup.id)
        const supFuelIssues = (s.fuelIssues || []).filter(f => f.supId === viewSup.id)
        const supWorkOrders = (s.maintenanceOrders || []).filter(m => m.supId === viewSup.id)
        const supSettlements = (s.settlements || []).filter(st => st.supId === viewSup.id)
        const totalPaidCash = supPayments.reduce((sum, p) => sum + (+p.amt || 0), 0)
        const linkedBoat = (s.boats || []).find(bt => bt.ownerId === viewSup.id || bt.supId === viewSup.id)

        return (
          <Modal
            title={`${t('Akaunti Kamili ya Mvuvi:', 'Fisherman Account Details:')} ${viewSup.name}`}
            subtitle={`${viewSup.no || 'SUP'} · ${catLabel ? catLabel(viewSup.cat) : viewSup.cat} · ${viewSup.site} · ${viewSup.phone} · ${t('Boti:', 'Boat:')} ${linkedBoat ? `${linkedBoat.name} (${linkedBoat.reg})` : (viewSup.boat || 'MV Victoria')}`}
            onClose={() => setViewSup(null)}
            maxWidth="max-w-3xl"
          >
            <div className="flex flex-col gap-4 text-xs">
              {/* Financial Balance Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('Samaki Aliyouza', 'Gross Catch')}</span>
                  <b className="font-mono text-slate-900 text-sm">{tzs(statement.totalCatchValue)}</b>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">{t('Makato ya Deni', 'Deductions')}</span>
                  <b className="font-mono text-amber-700 text-sm">-{tzs(statement.totalCatchDeductions)}</b>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-900 block">{t('Thamani Halisi', 'Net Payable')}</span>
                  <b className="font-mono text-blue-900 text-sm">{tzs(statement.totalCatchNet)}</b>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">{t('Amelipwa Taslimu', 'Cash Paid')}</span>
                  <b className="font-mono text-emerald-700 text-sm">{tzs(totalPaidCash)}</b>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-700 block">{t('Madeni ya Mafuta/Boti', 'Fuel/Maint Debt')}</span>
                  <b className="font-mono text-red-600 text-sm">-{tzs(statement.totalDebt)}</b>
                </div>
                <div className="border-l border-slate-200 pl-2">
                  <span className="text-[10px] uppercase font-bold text-slate-700 block">{t('Salio Halisi la Mvuvi', 'Net Fisherman Balance')}</span>
                  <b className={`font-mono text-sm font-extrabold ${statement.netBalance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {tzs(statement.netBalance)}
                  </b>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                <Badge variant="blue">{t('Samaki Wanaodaiwa', 'Fish Owed')}: {tzs(statement.fishOwed)}</Badge>
                <Badge variant="amber">{t('Mafuta', 'Fuel')}: {tzs(statement.fuelDebt)}</Badge>
                <Badge variant="amber">{t('Matengenezo', 'Maintenance')}: {tzs(statement.maintDebt)}</Badge>
                <Badge variant="neutral">{purchaseRows.length} {t('manunuzi', 'purchases')}</Badge>
              </div>

              {/* SECTION 1: CATCH DELIVERIES */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>{t('1. Samaki Walioletwa', '1. Fish Catch Delivered')} ({s.batches.filter(b => b.sup === viewSup.id).length})</span>
                  <span className="text-slate-500 font-normal">{t('Mizani ya Mwalo', 'Landing Weighbridge')}</span>
                </h4>
                <div className="data-table-wrap max-h-44">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Tarehe', 'Date')}</th>
                        <th>{t('Manunuzi / Mzigo', 'Purchase / Batch')}</th>
                        <th>{t('Aina', 'Species')}</th>
                        <th>{t('Uzito', 'Weight')}</th>
                        <th>{t('Jumla', 'Gross')}</th>
                        <th>{t('Makato', 'Deductions')}</th>
                        <th>{t('Halisi', 'Net')}</th>
                        <th>{t('Imelipwa', 'Paid')}</th>
                        <th>{t('Salio', 'Balance')}</th>
                        <th>{t('Hali', 'Status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseRows.map(r => {
                        const b = r.batch
                        return (
                          <tr key={b.id}>
                            <td className="font-mono text-xs">{b.date}</td>
                            <td>
                              <span className="font-mono text-xs text-blue-700 block">{b.pur}</span>
                              <small className="font-mono text-slate-400">{b.no}</small>
                            </td>
                            <td>{spLabel(b.sp)}</td>
                            <td className="font-mono">{f(b.kg)} kg</td>
                            <td className="font-mono">{tzs(tot(b))}</td>
                            <td className="font-mono text-amber-700">-{tzs(batchDeduction(s, b))}</td>
                            <td className="font-mono font-semibold">{tzs(r.net)}</td>
                            <td className="font-mono text-emerald-700">{tzs(r.paid)}</td>
                            <td className={`font-mono font-bold ${r.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{tzs(r.balance)}</td>
                            <td>
                              <Badge variant={r.status === 'paid' ? 'green' : r.status === 'partial' ? 'amber' : 'red'}>
                                {r.status === 'paid' ? t('Imelipwa', 'Paid') : r.status === 'partial' ? t('Kiasi', 'Partial') : t('Haijalipwa', 'Unpaid')}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                      {purchaseRows.length === 0 && (
                        <tr>
                          <td colSpan={10} className="text-center py-3 text-slate-400">{t('Hakuna manunuzi yaliyorekodiwa bado.', 'No purchases recorded yet.')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: FUEL DISPENSED & DEBT */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>{t('2. Mafuta Yaliyotolewa Mwalo', '2. Dock Fuel Issues')} ({supFuelIssues.length})</span>
                  <span className="text-red-700 font-bold">{t('Deni:', 'Unpaid:')} {tzs(statement.fuelDebt)}</span>
                </h4>
                <div className="data-table-wrap max-h-36">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Risiti #', 'Voucher #')}</th>
                        <th>{t('Tarehe', 'Date')}</th>
                        <th>{t('Namba ya Boti', 'Boat Reg')}</th>
                        <th>{t('Lita', 'Litres')}</th>
                        <th>{t('Jumla', 'Total')}</th>
                        <th>{t('Utaratibu', 'Arrangement')}</th>
                        <th>{t('Deni Lililobaki', 'Unpaid Debt')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supFuelIssues.map(fl => (
                        <tr key={fl.id}>
                          <td className="font-mono text-xs text-blue-800">{fl.no}</td>
                          <td>{fl.date}</td>
                          <td className="font-mono">{fl.boatReg || '-'}</td>
                          <td className="font-mono">{fl.litres}L</td>
                          <td className="font-mono">{tzs(fl.total)}</td>
                          <td>{fl.arrangement}</td>
                          <td className="font-mono text-red-600 font-bold">{tzs(fl.balance)}</td>
                        </tr>
                      ))}
                      {supFuelIssues.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-3 text-slate-400">{t('Hakuna mafuta yaliyorekodiwa kwa mvuvi huyu.', 'No fuel issues logged for this fisherman.')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: BOAT MAINTENANCE WORK ORDERS */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>{t('3. Matengenezo ya Boti', '3. Marine Fleet Maintenance')} ({supWorkOrders.length})</span>
                  <span className="text-amber-800 font-bold">{t('Linalokatwa:', 'Recoverable:')} {tzs(statement.maintDebt)}</span>
                </h4>
                <div className="data-table-wrap max-h-36">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Oda #', 'Order #')}</th>
                        <th>{t('Tarehe', 'Date')}</th>
                        <th>{t('Kazi', 'Job Title')}</th>
                        <th>{t('Fundi', 'Mechanic')}</th>
                        <th>{t('Jumla ya Gharama', 'Total Cost')}</th>
                        <th>{t('Utaratibu', 'Arrangement')}</th>
                        <th>{t('Hali', 'Status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supWorkOrders.map(m => (
                        <tr key={m.id}>
                          <td className="font-mono text-xs text-blue-800">{m.no}</td>
                          <td>{m.date}</td>
                          <td className="truncate max-w-[140px]">{m.title}</td>
                          <td>{m.mechanic}</td>
                          <td className="font-mono">{tzs(m.totalCost)}</td>
                          <td>{m.arrangement}</td>
                          <td><Badge variant={m.status === 'Completed' ? 'green' : 'amber'}>{m.status === 'Completed' ? t('Imekamilika', 'Completed') : t('Inaendelea', 'In Progress')}</Badge></td>
                        </tr>
                      ))}
                      {supWorkOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-3 text-slate-400">{t('Hakuna matengenezo ya boti kwa mvuvi huyu.', 'No boat maintenance work orders for this fisherman.')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 4: SETTLEMENTS & CASH CLEARANCES */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>{t('4. Makato ya Samaki & Malipo', '4. Catch Deductions & Settlements')} ({supSettlements.length})</span>
                  <span className="text-slate-500 font-normal">{t('Uhakiki wa hesabu', 'Cross-reconciliation')}</span>
                </h4>
                <div className="data-table-wrap max-h-32">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Makato #', 'Settlement #')}</th>
                        <th>{t('Tarehe', 'Date')}</th>
                        <th>{t('Thamani ya Samaki', 'Fish Value')}</th>
                        <th>{t('Mafuta Yaliyokatwa', 'Fuel Deducted')}</th>
                        <th>{t('Matengenezo Yaliyokatwa', 'Maintenance Deducted')}</th>
                        <th>{t('Malipo Halisi', 'Net Payable')}</th>
                        <th>{t('Alipwa Sasa', 'Paid Now')}</th>
                        <th>{t('Salio', 'Balance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supSettlements.map(st => (
                        <tr key={st.id}>
                          <td className="font-mono text-xs text-blue-800">{st.no}</td>
                          <td>{st.date}</td>
                          <td className="font-mono">{tzs(st.fishTotal)}</td>
                          <td className="font-mono text-red-600">-{tzs(st.fuelDeducted || 0)}</td>
                          <td className="font-mono text-amber-700">-{tzs(st.maintDeducted || 0)}</td>
                          <td className="font-mono font-bold text-slate-900">{tzs(st.netPayable)}</td>
                          <td className="font-mono font-bold text-emerald-700">{tzs(st.paidNow ?? st.netPayable)}</td>
                          <td className={`font-mono ${(+st.purBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{tzs(st.purBalance ?? 0)}</td>
                        </tr>
                      ))}
                      {supSettlements.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-3 text-slate-400">{t('Hakuna makato yaliyorekodiwa bado.', 'No catch deductions settled yet.')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 5: CASH & MOBILE MONEY PAYMENTS RECEIVED */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>{t('5. Malipo Aliyopokea (M-Pesa / Benki / Taslimu)', '5. Payments Received (Mobile Money / Bank / Cash)')} ({supPayments.length})</span>
                  <span className="text-emerald-700 font-bold">{t('Jumla:', 'Total:')} {tzs(totalPaidCash)}</span>
                </h4>
                <div className="data-table-wrap max-h-32">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Risiti #', 'Receipt #')}</th>
                        <th>{t('Tarehe', 'Date')}</th>
                        <th>{t('Manunuzi', 'Purchase')}</th>
                        <th>{t('Njia ya Malipo', 'Channel')}</th>
                        <th>{t('Kiasi Alicholipwa', 'Amount Paid')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supPayments.map(p => (
                        <tr key={p.id}>
                          <td className="font-mono text-xs text-blue-800">{p.ref || p.no || p.id}</td>
                          <td className="font-mono">{p.date}</td>
                          <td className="font-mono text-xs text-blue-700">{p.pur || '-'}</td>
                          <td>{p.m}</td>
                          <td className="font-mono font-bold text-emerald-700">{tzs(p.amt)}</td>
                        </tr>
                      ))}
                      {supPayments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-3 text-slate-400">{t('Hakuna malipo yaliyorekodiwa bado.', 'No payments recorded yet.')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  {supBal(s, viewSup.id) > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewSup
                        setViewSup(null)
                        setPaySup(target)
                        setPayForm({ amt: String(supBal(s, target.id)), m: 'M-Pesa (Mobile Money)' })
                      }}
                      className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CreditCard size={13} /> {t('Lipa Salio Sasa', 'Pay Balance Now')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-secondary text-xs"
                  >
                    <FileText size={13} /> {t('Chapa Taarifa', 'Print Statement')}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setViewSup(null)}
                  className="btn-secondary text-xs"
                >
                  {t('Funga', 'Close')}
                </button>
              </div>
            </div>
          </Modal>
        )
      })()}

      {/* Fast Payment Modal */}
      {paySup && (
        <Modal
          title={`${t('Lipa Mvuvi:', 'Pay Supplier:')} ${paySup.name}`}
          subtitle={`${t('Deni Linalodaiwa:', 'Outstanding Balance:')} ${tzs(supBal(s, paySup.id))}`}
          onClose={() => setPaySup(null)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Kiasi cha Malipo (TZS)', 'Disbursement Amount (TZS)')}>
              <input
                type="number"
                value={payForm.amt}
                onChange={e => setPayForm({ ...payForm, amt: e.target.value })}
                max={supBal(s, paySup.id)}
                className="input-field font-mono font-bold text-lg"
              />
              {+payForm.amt > supBal(s, paySup.id) && (
                <span className="text-[11px] text-rose-600 font-semibold">
                  {t('Kiasi kinazidi salio la mvuvi.', 'Amount exceeds the supplier balance.')}
                </span>
              )}
            </Field>

            <Field label={t('Njia ya Malipo', 'Payment Channel')}>
              <select
                value={payForm.m}
                onChange={e => setPayForm({ ...payForm, m: e.target.value })}
                className="input-field"
              >
                <option>M-Pesa (Mobile Money)</option>
                <option>Airtel Money</option>
                <option>Tigo Pesa</option>
                <option>CRDB / NMB Bank Transfer</option>
                <option>Cash Voucher</option>
              </select>
            </Field>

            <button
              type="button"
              onClick={handlePay}
              disabled={!(+payForm.amt > 0)}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700"
            >
              {t('Thibitisha & Toa Risiti ya Malipo', 'Confirm & Issue Disbursement Receipt')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

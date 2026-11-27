import React, { useState, useEffect } from 'react'
import {
  Anchor,
  Users,
  UserCheck,
  Ship,
  Phone,
  DollarSign,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  Clock,
  Compass,
  FileText,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Shield,
  LifeBuoy,
  Eye
} from 'lucide-react'
import { useS, SITES } from '../store'
import { Modal, Field, Badge, f, tzs, fmtT } from '../ui'

export default function Crew() {
  const { s, a, t } = useS()
  const [tab, setTab] = useState('company') // 'company' | 'independent' | 'financials' | 'boats'
  const [search, setSearch] = useState('')
  const [selectedBoatId, setSelectedBoatId] = useState(s.activeBoatId || (s.boats && s.boats[0]?.id) || '')

  // Modals
  const [assignOpen, setAssignOpen] = useState(false)
  const [kibaluaOpen, setKibaluaOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [boatOpen, setBoatOpen] = useState(false)
  const [settleKibalua, setSettleKibalua] = useState(null)

  useEffect(() => {
    const onQuickAdd = e => {
      if (e.detail?.tab === 'crew') setAssignOpen(true)
    }
    window.addEventListener('aquacatch:quick-add', onQuickAdd)
    return () => window.removeEventListener('aquacatch:quick-add', onQuickAdd)
  }, [])

  // Form states
  const [assignForm, setAssignForm] = useState({
    boatId: selectedBoatId,
    supId: '',
    fishermanName: '',
    position: 'Crew',
    accountType: 'Permanent',
    phone: '',
    nida: '',
    startDate: new Date().toISOString().slice(0, 10),
  })

  const [kibaluaForm, setKibaluaForm] = useState({
    boatId: selectedBoatId,
    fishermanName: '',
    phone: '',
    durationDays: 3,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    dailyRate: 15000,
    advancePaid: 0,
    notes: '',
  })

  const [boatForm, setBoatForm] = useState({
    name: '',
    code: '',
    regNo: '',
    captain: '',
    engine: 'Yamaha 40HP Enduro',
    landingSite: SITES[0] || 'Mwanza Main Landing (Kirumba)',
    boatType: 'FRP (Fiberglass)',
    ownerType: 'Company-managed',
  })

  const [kibaluaSettleForm, setKibaluaSettleForm] = useState({
    finalPayment: '',
    method: 'Cash',
    notes: 'Kibalua completed payout',
  })

  const boats = s.boats || []
  const crewAssignments = s.boatCrewAssignments || []
  const kibaluaList = s.kibaluaEngagements || []
  const suppliers = s.suppliers || []

  // Active boat
  const activeBoat = boats.find(b => b.id === selectedBoatId) || boats[0]

  // Counts
  const totalPermanentCrew = crewAssignments.filter(c => c.status === 'Active').length
  const totalKibaluaActive = kibaluaList.filter(k => k.status === 'Active').length
  const totalIndependent = suppliers.filter(sup => 
    sup.source_type === 'independent' || sup.cat?.toLowerCase().includes('individual') || (!sup.source_type && !sup.cat?.toLowerCase().includes('bmu'))
  ).length

  // Filtered lists
  const filteredAssignments = crewAssignments.filter(c => {
    const matchesSearch = c.fishermanName.toLowerCase().includes(search.toLowerCase()) ||
      c.boatName?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    const matchesBoat = !selectedBoatId || c.boatId === selectedBoatId
    return matchesSearch && matchesBoat
  })

  const filteredKibalua = kibaluaList.filter(k => {
    const matchesSearch = k.fishermanName.toLowerCase().includes(search.toLowerCase()) ||
      k.boatName?.toLowerCase().includes(search.toLowerCase()) ||
      k.phone?.includes(search)
    const matchesBoat = !selectedBoatId || k.boatId === selectedBoatId
    return matchesSearch && matchesBoat
  })

  const handleCreateAssignment = () => {
    if (!assignForm.fishermanName.trim() || !assignForm.boatId) return
    const targetBoat = boats.find(b => b.id === assignForm.boatId)
    a.assignBoatCrew({
      ...assignForm,
      boatName: targetBoat?.name || '',
      boatReg: targetBoat?.regNo || targetBoat?.code || '',
    })
    setAssignOpen(false)
    setAssignForm({
      boatId: selectedBoatId,
      supId: '',
      fishermanName: '',
      position: 'Crew',
      accountType: 'Permanent',
      phone: '',
      nida: '',
      startDate: new Date().toISOString().slice(0, 10),
    })
  }

  const handleCreateKibalua = () => {
    if (!kibaluaForm.fishermanName.trim() || !kibaluaForm.boatId) return
    const targetBoat = boats.find(b => b.id === kibaluaForm.boatId)
    a.createKibaluaEngagement({
      ...kibaluaForm,
      boatName: targetBoat?.name || '',
      boatReg: targetBoat?.regNo || targetBoat?.code || '',
    })
    setKibaluaOpen(false)
    setKibaluaForm({
      boatId: selectedBoatId,
      fishermanName: '',
      phone: '',
      durationDays: 3,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      dailyRate: 15000,
      advancePaid: 0,
      notes: '',
    })
  }

  const handleAddBoat = () => {
    if (!boatForm.name.trim()) return
    a.addBoat({
      ...boatForm,
      id: 'boat_' + Date.now(),
      status: 'Active',
      operationalStatus: 'Ready for Fishing',
      totalKg: 0,
      totalTrips: 0,
    })
    setBoatOpen(false)
    setBoatForm({
      name: '',
      code: '',
      regNo: '',
      captain: '',
      engine: 'Yamaha 40HP Enduro',
      landingSite: SITES[0] || 'Mwanza Main Landing (Kirumba)',
      boatType: 'FRP (Fiberglass)',
      ownerType: 'Company-managed',
    })
  }

  const handleSettleKibalua = () => {
    if (!settleKibalua) return
    a.completeKibaluaEngagement(settleKibalua.id, {
      finalPaymentPaid: +kibaluaSettleForm.finalPayment || 0,
      paymentMethod: kibaluaSettleForm.method,
      notes: kibaluaSettleForm.notes,
    })
    setSettleKibalua(null)
  }

  return (
    <div className="page-body">
      {/* Central Hub Navigation Bar: One Point of Control */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 text-white rounded-xl shadow-sm mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
            <Anchor size={14} /> {t('Kituo Kikuu:', 'Control Hub:')}
          </span>
          <div className="flex items-center gap-1 text-xs">
            <a
              href="#/suppliers"
              className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              {t('1. Wasambazaji (Suppliers)', '1. Suppliers')}
            </a>
            <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-bold">
              {t('2. Wavuvi & Boti (Fishermen & Fleet)', '2. Fishermen & Fleet')}
            </span>
            <a
              href="#/buy"
              className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              {t('3. Manunuzi & Mizani (Procurement)', '3. Procurement & Catches')}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setBoatOpen(true)} className="btn-secondary text-xs py-1.5 bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
            <Ship size={13} /> {t('Sajili Boti', 'Register Boat')}
          </button>
          <button onClick={() => setAssignOpen(true)} className="btn-primary text-xs py-1.5 bg-emerald-600 hover:bg-emerald-500">
            <Plus size={13} /> {t('Pangia Baharia', 'Assign Crew')}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">
            {t('Usimamizi wa Wavuvi na Boti', 'Fisherman & Fleet Management')}
          </h2>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t(
              'Usimamizi wa mabaharia wa kampuni, manahodha, vibarua wa msimu, na wavuvi huru.',
              'Manage company-employed crew, captains, casual kibalua fishers, and independent boat fishers.'
            )}
          </p>
        </div>
        <div className="grid grid-cols-2 md:flex items-center gap-2">
          <button onClick={() => setBoatOpen(true)} className="btn-secondary text-xs">
            <Ship size={14} /> {t('Sajili Boti', 'Register Boat')}
          </button>
          <button onClick={() => setKibaluaOpen(true)} className="btn-secondary md:hidden text-xs">
            <Clock size={14} /> {t('Kibalua Mpya', 'New Kibalua')}
          </button>
          <button onClick={() => setAssignOpen(true)} className="hidden md:inline-flex btn-primary text-xs">
            <Plus size={14} /> {t('Pangia Baharia Kazi', 'Assign Crew Member')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <Ship size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Boti za Kampuni', 'Company Fleet')}</small>
            <b>{boats.length} <span className="text-xs font-sans text-slate-400">{t('vyombo', 'vessels')}</span></b>
            <span className="kpi-sub">{t('Zinazofanya kazi mialoni', 'Active fishing operations')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <UserCheck size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Wavuvi wa Kudumu', 'Permanent Crew')}</small>
            <b>{totalPermanentCrew} <span className="text-xs font-sans text-slate-400">{t('wavuvi', 'fishers')}</span></b>
            <span className="kpi-sub">{t('Wamepangiwa boti za kampuni', 'Assigned to company boats')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <Clock size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Vibarua Hai (Kibalua)', 'Casual Day Fishers')}</small>
            <b>{totalKibaluaActive} <span className="text-xs font-sans text-slate-400">{t('vibarua', 'kibalua')}</span></b>
            <span className="kpi-sub">{t('Mikataba ya muda mfupi', 'Short-term fishing trips')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap purple">
            <Users size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Wavuvi Huru / Wasambazaji', 'Independent Fishers')}</small>
            <b>{totalIndependent} <span className="text-xs font-sans text-slate-400">{t('wavuvi', 'suppliers')}</span></b>
            <span className="kpi-sub">{t('Wanatoa samaki kwa mauzo', 'Independent fish sellers')}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-sm font-medium overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab('company')}
          className={`pb-2.5 px-1 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            tab === 'company'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Anchor size={16} /> {t('01 · Wavuvi wa Kampuni', '01 · Company-managed Crew')}
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-mono">
            {crewAssignments.length + kibaluaList.length}
          </span>
        </button>

        <button
          onClick={() => setTab('independent')}
          className={`pb-2.5 px-1 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            tab === 'independent'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass size={16} /> {t('02 · Wavuvi Huru & Wasambazaji', '02 · Independent Fishers')}
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-mono">
            {totalIndependent}
          </span>
        </button>

        <button
          onClick={() => setTab('boats')}
          className={`pb-2.5 px-1 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            tab === 'boats'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ship size={16} /> {t('Boti za Kampuni (Fleet)', 'Company Fleet')}
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-mono">
            {boats.length}
          </span>
        </button>

        <button
          onClick={() => setTab('financials')}
          className={`pb-2.5 px-1 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            tab === 'financials'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign size={16} /> {t('Mizania & Mikopo ya Wavuvi', 'Accounts & Advances')}
        </button>
      </div>

      {/* Tab 1: Wavuvi wa Kampuni */}
      {tab === 'company' && (
        <div className="flex flex-col gap-4">
          {/* Boat selector pill bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedBoatId('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedBoatId === ''
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t('Boti Zote', 'All Boats')}
            </button>
            {boats.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBoatId(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors ${
                  selectedBoatId === b.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Ship size={13} />
                <span>{b.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${selectedBoatId === b.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {b.code || b.regNo}
                </span>
              </button>
            ))}
          </div>

          {/* Search bar & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('Tafuta baharia au nahodha kwa jina, boti, simu...', 'Search crew member by name, boat, phone...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10 text-xs"
              />
            </div>
            <button onClick={() => setKibaluaOpen(true)} className="hidden md:inline-flex btn-secondary text-xs shrink-0">
              <Clock size={14} /> {t('Sajili Kibalua Mpya', 'New Kibalua Engagement')}
            </button>
          </div>

          {/* Table: Permanent Crew */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 m-0">
                {t('Wavuvi na Mabaharia wa Kudumu (Permanent Crew)', 'Permanent Boat Crew & Captains')}
              </h3>
              <span className="text-xs text-slate-400 font-mono">{filteredAssignments.length} {t('walioorodheshwa', 'listed')}</span>
            </div>
            {/* Mobile Permanent Crew Cards (< md) */}
            <div className="md:hidden p-3 flex flex-col gap-2.5 bg-slate-50/50">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  {t('Hakuna baharia aliyepangiwa boti hii bado.', 'No permanent crew assigned to this vessel yet.')}
                </div>
              ) : (
                filteredAssignments.map(a => (
                  <div key={a.id} className="mobile-card flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-800 font-bold flex items-center justify-center text-xs border border-blue-200 shrink-0">
                          {a.fishermanName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <b className="text-sm text-slate-900 block truncate">{a.fishermanName}</b>
                          <span className="text-[11px] font-medium text-blue-600 block">
                            {a.position === 'Captain' ? t('Nahodha (Captain)', 'Captain') : t('Baharia (Crew)', 'Crew Member')}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {a.boatName} · {a.phone || '-'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={a.status === 'Active' ? 'green' : 'neutral'}>{a.status}</Badge>
                        <b className={`font-mono text-xs block mt-1 ${a.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {tzs(a.balance || 0)}
                        </b>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block data-table-wrap border-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Jina la Mvuvi & Cheo', 'Fisherman & Position')}</th>
                    <th>{t('Boti Aliyopangiwa', 'Assigned Vessel')}</th>
                    <th>{t('Mawasiliano & NIDA', 'Phone & NIDA')}</th>
                    <th>{t('Tarehe ya Kuanza', 'Start Date')}</th>
                    <th>{t('Hali ya Kazi', 'Engagement Status')}</th>
                    <th>{t('Salio la Akaunti', 'Account Balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                        {t('Hakuna baharia aliyepangiwa boti hii bado.', 'No permanent crew assigned to this vessel yet.')}
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-800 font-bold flex items-center justify-center text-xs border border-blue-200 shrink-0">
                              {a.fishermanName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <b className="text-slate-900 block">{a.fishermanName}</b>
                              <span className="text-[11px] font-medium text-blue-600">
                                {a.position === 'Captain' ? '⚓ Nahodha (Captain)' : 'Baharia (Crew Member)'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                              <Ship size={12} className="text-slate-400" /> {a.boatName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">{a.boatReg}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col font-mono text-xs">
                            <span className="text-slate-800">{a.phone || '-'}</span>
                            <span className="text-[10px] text-slate-400">{a.nida ? `NIDA: ${a.nida}` : ''}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs text-slate-600 font-mono">{a.startDate}</span>
                        </td>
                        <td>
                          <Badge variant={a.status === 'Active' ? 'green' : 'neutral'}>
                            {a.status}
                          </Badge>
                        </td>
                        <td>
                          <b className={`font-mono text-xs ${a.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {tzs(a.balance || 0)}
                          </b>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Casual Kibalua Fishers */}
          <div className="card p-0 overflow-hidden mt-2">
            <div className="px-4 py-3 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 m-0 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-600" />
                {t('Wavuvi wa Muda / Vibarua (Kibalua Engagements)', 'Casual / Trip Day-Workers (Kibalua)')}
              </h3>
              <span className="text-xs text-amber-700 font-mono">{filteredKibalua.length} {t('rekodi', 'records')}</span>
            </div>
            {/* Mobile Kibalua Cards (< md) */}
            <div className="md:hidden p-3 flex flex-col gap-2.5 bg-slate-50/50">
              {filteredKibalua.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  {t('Hakuna kibarua hai kwa sasa.', 'No casual kibalua engagements active.')}
                </div>
              ) : (
                filteredKibalua.map(k => {
                  const netRem = k.remainingPayable || (k.dailyRate * k.durationDays - (k.advancePaid || 0))
                  return (
                    <div key={k.id} className="mobile-card flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <b className="text-sm text-slate-900 block truncate">{k.fishermanName}</b>
                          <span className="text-[11px] font-mono text-slate-500 block">
                            {k.no || 'KIB-' + k.id.slice(0, 6)} · {k.boatName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {k.durationDays} {t('siku', 'days')} · {tzs(k.dailyRate)}/{t('siku', 'day')}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <b className="font-mono text-sm text-blue-700 block tabular-nums">{tzs(netRem)}</b>
                          <Badge variant={k.status === 'Active' ? 'amber' : 'neutral'}>{k.status}</Badge>
                        </div>
                      </div>
                      {k.status === 'Active' && (
                        <button
                          onClick={() => {
                            setSettleKibalua(k)
                            setKibaluaSettleForm({
                              finalPayment: String(netRem),
                              method: 'Cash',
                              notes: 'Kibalua completion settlement'
                            })
                          }}
                          className="btn-primary text-xs bg-[#18b8b2] hover:bg-[#139c97] w-full"
                        >
                          <CheckCircle2 size={14} /> {t('Kamilisha Malipo', 'Settle Kibalua')}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className="hidden md:block data-table-wrap border-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Namba & Jina', 'Kibalua Code & Name')}</th>
                    <th>{t('Boti', 'Boat')}</th>
                    <th>{t('Kipindi & Siku', 'Duration & Days')}</th>
                    <th>{t('Kiwango kwa Siku', 'Daily Rate')}</th>
                    <th>{t('Jumla & Advance', 'Gross & Advance')}</th>
                    <th>{t('Salio Lililobaki', 'Net Remaining')}</th>
                    <th>{t('Hali', 'Status')}</th>
                    <th className="text-right">{t('Vitendo', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKibalua.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-400 text-xs">
                        {t('Hakuna kibarua hai kwa sasa.', 'No casual kibalua engagements active.')}
                      </td>
                    </tr>
                  ) : (
                    filteredKibalua.map(k => (
                      <tr key={k.id}>
                        <td>
                          <div>
                            <b className="text-slate-900 block">{k.fishermanName}</b>
                            <small className="text-slate-400 font-mono">{k.no || 'KIB-' + k.id.slice(0, 6)}</small>
                          </div>
                        </td>
                        <td>
                          <span className="text-slate-800 text-xs font-medium">{k.boatName}</span>
                        </td>
                        <td>
                          <div className="text-xs font-mono">
                            <span>{k.durationDays} {t('siku', 'days')}</span>
                            <span className="text-[10px] text-slate-400 block">{k.startDate} → {k.endDate}</span>
                          </div>
                        </td>
                        <td className="font-mono text-xs">{tzs(k.dailyRate)}/siku</td>
                        <td>
                          <div className="text-xs font-mono">
                            <span className="text-slate-800 block">{tzs(k.grossPayable || (k.dailyRate * k.durationDays))}</span>
                            {k.advancePaid > 0 && (
                              <span className="text-rose-600 text-[10px] block">Adv: -{tzs(k.advancePaid)}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <b className="font-mono text-xs text-blue-700">
                            {tzs(k.remainingPayable || (k.dailyRate * k.durationDays - (k.advancePaid || 0)))}
                          </b>
                        </td>
                        <td>
                          <Badge variant={k.status === 'Active' ? 'amber' : 'neutral'}>
                            {k.status}
                          </Badge>
                        </td>
                        <td className="text-right">
                          {k.status === 'Active' && (
                            <button
                              onClick={() => {
                                setSettleKibalua(k)
                                setKibaluaSettleForm({
                                  finalPayment: String(k.remainingPayable || (k.dailyRate * k.durationDays - (k.advancePaid || 0))),
                                  method: 'Cash',
                                  notes: 'Kibalua completion settlement'
                                })
                              }}
                              className="btn-primary text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle2 size={12} /> {t('Kamilisha Malipo', 'Settle')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Wavuvi Huru & Wasambazaji */}
      {tab === 'independent' && (
        <div className="flex flex-col gap-4">
          <div className="card bg-blue-50/50 border border-blue-200 p-4">
            <div className="flex items-start gap-3">
              <Compass size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <b className="text-blue-900 block text-sm">
                  {t('Wavuvi Huru & Wasambazaji wa Nje (Independent & External Sourcing)', 'Independent Fishers & External Fish Sourcing')}
                </b>
                <p className="text-blue-800 mt-1 m-0">
                  {t(
                    'Hawa ni wavuvi au wamiliki wa vyombo huru wanaouza samaki moja kwa moja kwenye kituo chako cha mapokezi bila kuwa sehemu ya mabaharia wa kampuni. Wanapokea malipo kupitia vocha au malipo ya moja kwa moja.',
                    'These are independent boat owners or fishers who deliver catch to your landing site. They operate independently and receive payment per catch delivery without being on company payroll.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Independent Fishers (< md) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {suppliers.filter(s => s.source_type === 'independent' || !s.source_type || s.cat?.toLowerCase().includes('individual')).map(sup => (
              <div key={sup.id} className="mobile-card flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs border border-slate-300 shrink-0">
                    {sup.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <b className="text-sm text-slate-900 block truncate">{sup.name}</b>
                    <span className="text-[11px] text-slate-500 block truncate">{sup.boat || 'MV Furaha'} · {sup.site}</span>
                    <span className="text-[11px] font-mono text-slate-400">{sup.phone}</span>
                  </div>
                </div>
                <Badge variant={sup.status === 'Active' ? 'green' : 'neutral'}>
                  {sup.status || 'Active'}
                </Badge>
              </div>
            ))}
          </div>

          <div className="hidden md:block data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Namba & Jina la Mvuvi Huru', 'Code & Fisher Name')}</th>
                  <th>{t('Uainishaji / Aina', 'Classification')}</th>
                  <th>{t('Boti / Chombo Chake', 'Vessel / Boat')}</th>
                  <th>{t('Mwalo Mkuu', 'Landing Site')}</th>
                  <th>{t('Mawasiliano', 'Phone Contact')}</th>
                  <th>{t('Hali ya Akaunti', 'Account Status')}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.filter(s => s.source_type === 'independent' || !s.source_type || s.cat?.toLowerCase().includes('individual')).map(sup => (
                  <tr key={sup.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs border border-slate-300 shrink-0">
                          {sup.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <b className="text-slate-900 block">{sup.name}</b>
                          <small className="text-slate-400 font-mono">{sup.no || 'SUP-' + sup.id.slice(0, 6)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant="neutral">
                        {sup.cat || t('Mvuvi Huru', 'Independent Fisherman')}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-slate-800">{sup.boat || 'MV Furaha'}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600">{sup.site}</span>
                    </td>
                    <td className="font-mono text-xs text-slate-700">{sup.phone}</td>
                    <td>
                      <Badge variant={sup.status === 'Active' ? 'green' : 'neutral'}>
                        {sup.status || 'Active'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Boti za Kampuni */}
      {tab === 'boats' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boats.map(b => {
              const bCrew = crewAssignments.filter(c => c.boatId === b.id && c.status === 'Active')
              const bKibalua = kibaluaList.filter(k => k.boatId === b.id && k.status === 'Active')
              return (
                <div key={b.id} className="card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <b className="text-base text-slate-900 block">{b.name}</b>
                        <span className="text-xs font-mono text-slate-400">{b.code || b.regNo}</span>
                      </div>
                      <Badge variant={b.operationalStatus === 'Ready for Fishing' ? 'green' : 'amber'}>
                        {b.operationalStatus || 'Active'}
                      </Badge>
                    </div>

                    <div className="py-3 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>{t('Nahodha Mkuu:', 'Captain:')}</span>
                        <b className="text-slate-800">{b.captain || t('Hajateuliwa', 'Unassigned')}</b>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>{t('Injini:', 'Engine:')}</span>
                        <span className="font-mono text-slate-700">{b.engine || 'Yamaha 40HP'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>{t('Kituo cha Mwalo:', 'Landing Base:')}</span>
                        <span className="text-slate-700">{b.landingSite || b.site}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>{t('Jumla ya Samaki:', 'Total Catch:')}</span>
                        <b className="font-mono text-blue-700">{f(b.totalKg || 0)} kg</b>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono">
                      {bCrew.length} {t('mabaharia', 'crew')} · {bKibalua.length} {t('vibarua', 'kibalua')}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedBoatId(b.id)
                        setTab('company')
                      }}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      {t('Tazama Wavuvi', 'View Crew')} <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Financials & Advances */}
      {tab === 'financials' && (
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              {t('Daftari la Mikopo & Madeni ya Mabaharia (Fisherman Ledger)', 'Fisherman Advances & Operational Accounts')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t(
                'Mchanganuo wa posho zilizotolewa kabla ya safari (advances), zana za uvuvi, na gawio lililorejeshwa.',
                'Record and track voyage advances, gear liability deductions, and net catch compensation.'
              )}
            </p>

            {/* Mobile Financials Cards (< md) */}
            <div className="md:hidden flex flex-col gap-2.5">
              {crewAssignments.map(c => (
                <div key={c.id} className="mobile-card flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <b className="text-sm text-slate-900 block truncate">{c.fishermanName}</b>
                    <span className="text-[11px] text-slate-500 block truncate">{c.boatName} · {c.accountType || 'Permanent'}</span>
                    <span className="text-[11px] font-mono text-slate-400">{c.phone}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <b className={`font-mono text-sm block tabular-nums ${c.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {tzs(c.balance || 0)}
                    </b>
                    <span className="text-[10px] text-slate-500">
                      {c.balance > 0 ? t('Anadaiwa', 'Owes company') : t('Safi', 'Settled')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block data-table-wrap border-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Mvuvi / Baharia', 'Fisherman')}</th>
                    <th>{t('Boti', 'Boat')}</th>
                    <th>{t('Aina ya Mkataba', 'Agreement')}</th>
                    <th>{t('Salio Halisi', 'Current Balance')}</th>
                    <th>{t('Hali ya Deni', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {crewAssignments.map(c => (
                    <tr key={c.id}>
                      <td>
                        <b className="text-slate-900 block">{c.fishermanName}</b>
                        <small className="text-slate-400 font-mono">{c.phone}</small>
                      </td>
                      <td>
                        <span className="text-slate-800 font-medium text-xs">{c.boatName}</span>
                      </td>
                      <td>
                        <Badge variant="neutral">{c.accountType || 'Permanent'}</Badge>
                      </td>
                      <td>
                        <b className={`font-mono text-xs ${c.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {tzs(c.balance || 0)}
                        </b>
                      </td>
                      <td>
                        <span className="text-xs text-slate-500">
                          {c.balance > 0 ? t('Anadaiwa kurejesha', 'Owes company') : t('Akaunti safi', 'Settled')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign Boat Crew */}
      {assignOpen && (
        <Modal
          title={t('Pangia Baharia au Nahodha Kazi', 'Assign Fisherman to Vessel')}
          subtitle={t('Chagua boti na sajili jukumu lake', 'Select company boat and set crew position')}
          onClose={() => setAssignOpen(false)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Chagua Boti ya Kampuni', 'Select Company Vessel')}>
              <select
                value={assignForm.boatId}
                onChange={e => setAssignForm({ ...assignForm, boatId: e.target.value })}
                className="input-field"
              >
                {boats.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code || b.regNo})
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t('Jina Kamili la Mvuvi / Baharia', 'Fisherman Full Name')}>
              <input
                type="text"
                placeholder={t('mf. Juma Ramadhani', 'e.g. Juma Ramadhani')}
                value={assignForm.fishermanName}
                onChange={e => setAssignForm({ ...assignForm, fishermanName: e.target.value })}
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Cheo / Jukumu', 'Position / Role')}>
                <select
                  value={assignForm.position}
                  onChange={e => setAssignForm({ ...assignForm, position: e.target.value })}
                  className="input-field"
                >
                  <option value="Captain">{t('Nahodha (Captain)', 'Captain')}</option>
                  <option value="Crew">{t('Baharia (Crew Member)', 'Crew Member')}</option>
                  <option value="Engineer">{t('Fundi Mitambo (Engineer)', 'Engineer')}</option>
                </select>
              </Field>

              <Field label={t('Aina ya Ajira', 'Engagement Agreement')}>
                <select
                  value={assignForm.accountType}
                  onChange={e => setAssignForm({ ...assignForm, accountType: e.target.value })}
                  className="input-field"
                >
                  <option value="Permanent">{t('Mbaharia wa Kudumu', 'Permanent Employee')}</option>
                  <option value="Seasonal">{t('Wa Msimu (Seasonal)', 'Seasonal')}</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Namba ya Simu', 'Phone Number')}>
                <input
                  type="tel"
                  placeholder="0754 123 456"
                  value={assignForm.phone}
                  onChange={e => setAssignForm({ ...assignForm, phone: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>

              <Field label={t('Kitambulisho cha Taifa (NIDA)', 'National ID (NIDA)')}>
                <input
                  type="text"
                  placeholder="19900101-..."
                  value={assignForm.nida}
                  onChange={e => setAssignForm({ ...assignForm, nida: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <button
              type="button"
              disabled={!assignForm.fishermanName.trim() || !assignForm.boatId}
              onClick={handleCreateAssignment}
              className="btn-primary mt-2"
            >
              {t('Thibitisha Upangaji wa Baharia', 'Confirm Crew Assignment')}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: New Kibalua Engagement */}
      {kibaluaOpen && (
        <Modal
          title={t('Sajili Kibarua wa Msimu (Kibalua)', 'Casual Fishing Trip (Kibalua)')}
          subtitle={t('Weka makubaliano ya siku na ujira', 'Record short-term trip agreement and daily rate')}
          onClose={() => setKibaluaOpen(false)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Boti ya Kazi', 'Assigned Boat')}>
              <select
                value={kibaluaForm.boatId}
                onChange={e => setKibaluaForm({ ...kibaluaForm, boatId: e.target.value })}
                className="input-field"
              >
                {boats.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code || b.regNo})
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t('Jina la Kibarua', 'Casual Fisher Name')}>
              <input
                type="text"
                placeholder={t('mf. Ally Bakari', 'e.g. Ally Bakari')}
                value={kibaluaForm.fishermanName}
                onChange={e => setKibaluaForm({ ...kibaluaForm, fishermanName: e.target.value })}
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Idadi ya Siku', 'Duration (Days)')}>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={kibaluaForm.durationDays}
                  onChange={e => setKibaluaForm({ ...kibaluaForm, durationDays: +e.target.value || 1 })}
                  className="input-field font-mono"
                />
              </Field>

              <Field label={t('Kiwango kwa Siku (TZS)', 'Daily Rate (TZS)')}>
                <input
                  type="number"
                  step="1000"
                  value={kibaluaForm.dailyRate}
                  onChange={e => setKibaluaForm({ ...kibaluaForm, dailyRate: +e.target.value || 0 })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Advance / Malipo ya Awali', 'Advance Paid')}>
                <input
                  type="number"
                  step="1000"
                  value={kibaluaForm.advancePaid}
                  onChange={e => setKibaluaForm({ ...kibaluaForm, advancePaid: +e.target.value || 0 })}
                  className="input-field font-mono"
                />
              </Field>

              <Field label={t('Namba ya Simu', 'Phone Number')}>
                <input
                  type="tel"
                  placeholder="0765..."
                  value={kibaluaForm.phone}
                  onChange={e => setKibaluaForm({ ...kibaluaForm, phone: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono flex justify-between">
              <span className="text-slate-500">{t('Jumla ya Mkataba:', 'Total Contract:')}</span>
              <b className="text-slate-900">{tzs(kibaluaForm.dailyRate * kibaluaForm.durationDays)}</b>
            </div>

            <button
              type="button"
              disabled={!kibaluaForm.fishermanName.trim() || !kibaluaForm.boatId}
              onClick={handleCreateKibalua}
              className="btn-primary mt-2"
            >
              {t('Hifadhi Kibalua', 'Save Kibalua Engagement')}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Settle Kibalua */}
      {settleKibalua && (
        <Modal
          title={t('Kamilisha Malipo ya Kibalua', 'Settle Casual Engagement')}
          subtitle={`${settleKibalua.fishermanName} · ${settleKibalua.boatName}`}
          onClose={() => setSettleKibalua(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-xs flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-slate-600">{t('Jumla ya Ujira:', 'Gross Pay:')}</span>
                <b className="font-mono">{tzs(settleKibalua.dailyRate * settleKibalua.durationDays)}</b>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>{t('Advance Iliyotolewa:', 'Advance Deducted:')}</span>
                <span className="font-mono">-{tzs(settleKibalua.advancePaid || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-1 font-bold text-blue-900">
                <span>{t('Salio Halisi la Kulipwa:', 'Net Due:')}</span>
                <span className="font-mono">
                  {tzs(settleKibalua.dailyRate * settleKibalua.durationDays - (settleKibalua.advancePaid || 0))}
                </span>
              </div>
            </div>

            <Field label={t('Kiasi Kinacholipwa Sasa (TZS)', 'Amount Paid Now')}>
              <input
                type="number"
                value={kibaluaSettleForm.finalPayment}
                onChange={e => setKibaluaSettleForm({ ...kibaluaSettleForm, finalPayment: e.target.value })}
                className="input-field font-mono font-bold"
              />
            </Field>

            <Field label={t('Njia ya Malipo', 'Payment Method')}>
              <select
                value={kibaluaSettleForm.method}
                onChange={e => setKibaluaSettleForm({ ...kibaluaSettleForm, method: e.target.value })}
                className="input-field"
              >
                <option value="Cash">{t('Pesa Taslimu (Cash)', 'Cash Voucher')}</option>
                <option value="M-Pesa (Mobile Money)">M-Pesa</option>
                <option value="Airtel Money">Airtel Money</option>
              </select>
            </Field>

            <button
              type="button"
              onClick={handleSettleKibalua}
              className="btn-primary mt-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {t('Thibitisha Malipo & Funga Kazi', 'Confirm Payment & Complete')}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Register Boat */}
      {boatOpen && (
        <Modal
          title={t('Sajili Boti Mpya ya Kampuni', 'Register New Company Vessel')}
          subtitle={t('Weka maelezo ya chombo, injini na mwalo', 'Add vessel details, engine spec, and home landing site')}
          onClose={() => setBoatOpen(false)}
        >
          <div className="flex flex-col gap-4">
            <Field label={t('Jina la Boti', 'Boat Name')}>
              <input
                type="text"
                placeholder={t('mf. MV Ushindi III', 'e.g. MV Ushindi III')}
                value={boatForm.name}
                onChange={e => setBoatForm({ ...boatForm, name: e.target.value })}
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Namba ya Usajili / Code', 'Reg No or Code')}>
                <input
                  type="text"
                  placeholder="TZN-552"
                  value={boatForm.regNo}
                  onChange={e => setBoatForm({ ...boatForm, regNo: e.target.value, code: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>

              <Field label={t('Nahodha Mkuu', 'Captain Name')}>
                <input
                  type="text"
                  placeholder={t('Jina la Nahodha', 'Captain Name')}
                  value={boatForm.captain}
                  onChange={e => setBoatForm({ ...boatForm, captain: e.target.value })}
                  className="input-field"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Aina ya Injini', 'Engine Model')}>
                <input
                  type="text"
                  placeholder="Yamaha 40HP"
                  value={boatForm.engine}
                  onChange={e => setBoatForm({ ...boatForm, engine: e.target.value })}
                  className="input-field"
                />
              </Field>

              <Field label={t('Mwalo Mkuu', 'Landing Site')}>
                <select
                  value={boatForm.landingSite}
                  onChange={e => setBoatForm({ ...boatForm, landingSite: e.target.value })}
                  className="input-field"
                >
                  {SITES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <button
              type="button"
              disabled={!boatForm.name.trim()}
              onClick={handleAddBoat}
              className="btn-primary mt-2"
            >
              {t('Hifadhi Boti', 'Save Vessel')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

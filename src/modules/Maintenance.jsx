import React, { useState } from 'react'
import {
  Wrench,
  Plus,
  Search,
  Ship,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
  Calendar,
  DollarSign,
  User,
  Settings,
  ArrowRight,
  Filter,
  Check,
  FileText,
  TrendingUp,
  Cpu
} from 'lucide-react'
import { useS, supMaintDebt } from '../store'
import { Modal, Field, Badge, DetailModal, ViewBtn, f, tzs, fmtT } from '../ui'

export default function Maintenance() {
  const { s, a, t } = useS()
  const [tab, setTab] = useState('orders') // 'orders' | 'boats' | 'spares' | 'schedules'
  const [newOrderModal, setNewOrderModal] = useState(false)
  const [newBoatModal, setNewBoatModal] = useState(false)
  const [newSpareModal, setNewSpareModal] = useState(false)
  const [viewOrder, setViewOrder] = useState(null)
  const [viewSpare, setViewSpare] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  const boats = s.boats || []
  const orders = s.maintenanceOrders || []
  const spareParts = s.spareParts || []
  const suppliers = s.suppliers || []

  // Top KPIs
  const totalBoats = boats.length
  const operationalBoats = boats.filter(b => b.status === 'Operational').length
  const operationalPct = totalBoats > 0 ? Math.round((operationalBoats / totalBoats) * 100) : 100
  const activeOrders = orders.filter(o => o.status !== 'Completed').length
  const totalSpend = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0)
  const totalRecoverableDebt = suppliers.reduce((sum, sup) => sum + supMaintDebt(s, sup.id), 0)

  // Work Order Form State
  const [woForm, setWoForm] = useState({
    boatId: boats[0]?.id || '',
    supId: suppliers[0]?.id || '',
    title: 'Engine 100-Hr Overhaul & Gear Oil Service',
    fault: 'Engine stalling at idle speed; propeller vibration felt during high load',
    mechanic: 'Fundi Rashidi (Mwanza Marine Workshop)',
    arrangement: 'Company-assisted (Deduct from fish)',
    partsCost: '60000',
    laborCost: '40000',
    otherCost: '0',
    status: 'In Progress',
    selectedPartId: spareParts[0]?.id || '',
    selectedPartQty: '2',
    addedParts: []
  })

  // Boat Form State
  const [boatForm, setBoatForm] = useState({
    regNo: 'TZN-' + Math.floor(100 + Math.random() * 900),
    name: 'MV Baraka',
    ownerType: 'Fisherman-owned',
    ownerId: suppliers[0]?.id || 's0',
    captain: 'Juma Selemani',
    engine: 'Yamaha Outboard 40HP 2-Stroke',
    boatType: 'Planked Wooden Mashua (10m)',
    engineHours: '120',
    notes: 'Insulated deck box installed'
  })

  // Spare Part Form State
  const [partForm, setPartForm] = useState({
    name: '',
    partNo: '',
    category: 'Ignition',
    stock: '10',
    minStock: '3',
    unitCost: '15000',
    sellPrice: '20000',
    unit: 'pcs'
  })

  // Handle adding part into work order
  const handleAddPartToOrder = () => {
    const part = spareParts.find(p => p.id === woForm.selectedPartId)
    if (!part) return
    const qty = +woForm.selectedPartQty || 1
    const cost = qty * (part.sellPrice || part.unitCost)
    const newAdded = [
      ...woForm.addedParts,
      { partId: part.id, name: part.name, qty, cost }
    ]
    const updatedPartsCost = newAdded.reduce((sum, x) => sum + x.cost, 0)
    setWoForm(prev => ({
      ...prev,
      addedParts: newAdded,
      partsCost: String(updatedPartsCost)
    }))
  }

  const submitWorkOrder = () => {
    a.addWorkOrder({
      boatId: woForm.boatId,
      supId: woForm.supId,
      title: woForm.title,
      fault: woForm.fault,
      mechanic: woForm.mechanic,
      arrangement: woForm.arrangement,
      parts: woForm.addedParts,
      partsCost: +woForm.partsCost || 0,
      laborCost: +woForm.laborCost || 0,
      otherCost: +woForm.otherCost || 0,
      status: woForm.status
    })
    setNewOrderModal(false)
  }

  const submitBoat = () => {
    a.addBoat(boatForm)
    setNewBoatModal(false)
  }

  const submitSpare = () => {
    a.addSparePart({
      name: partForm.name,
      partNo: partForm.partNo,
      category: partForm.category,
      stock: +partForm.stock,
      minStock: +partForm.minStock,
      unitCost: +partForm.unitCost,
      sellPrice: +partForm.sellPrice,
      unit: partForm.unit
    })
    setNewSpareModal(false)
  }

  const updateOrderStatus = (id, newStatus) => {
    a.updateWorkOrder(id, { status: newStatus })
  }

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const boat = boats.find(b => b.id === o.boatId)
    const matchSearch =
      o.no.toLowerCase().includes(search.toLowerCase()) ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      (boat?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (boat?.regNo || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="page-body">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 m-0">
              {t('Usimamizi wa Meli na Matengenezo', 'Fleet & Boat Maintenance Management')}
            </h2>
            <Badge variant="blue">{t('Uendeshaji Ziwani', 'Lake Marine Ops')}</Badge>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t('Fuatilia usajili wa boti, matengenezo ya injini, vipuri, na madeni ya matengenezo.', 'Track vessel registries, scheduled marine services, repair work orders, marine spare parts, and recoverable credit.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewBoatModal(true)}
            className="btn-secondary text-xs"
          >
            <Ship size={15} /> + {t('Sajili Boti', 'Register Boat')}
          </button>
          <button
            onClick={() => setNewOrderModal(true)}
            className="btn-primary"
          >
            <Plus size={16} /> {t('Oda Mpya ya Matengenezo', 'New Work Order')} (<span className="text-xs font-mono">&lt; 1 min</span>)
          </button>
        </div>
      </div>

      {/* Top Fleet Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fleet & Operational Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('Jumla ya Boti Zilizosajiliwa', 'Total Registered Fleet')}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-slate-900">{totalBoats}</span>
                <span className="text-xs text-slate-500 font-medium">{t('Boti Zilizopo', 'Boats Active')}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
              <Ship size={20} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{t('Kiwango cha Utendaji:', 'Operational Rate:')}</span>
            <span className="font-bold text-emerald-700">{operationalPct}% {t('Tayari Ziwani', 'Ready for Lake')}</span>
          </div>
        </div>

        {/* Active Work Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('Matengenezo Yanayoendelea', 'Active Repairs & Service')}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-amber-600">{activeOrders}</span>
                <span className="text-xs text-slate-500 font-medium">{t('Zinakarabatiwa', 'Under Maintenance')}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
              <Wrench size={20} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{t('Karakana:', 'Workshop:')}</span>
            <span className="font-medium text-slate-700">Mwanza Port Marine</span>
          </div>
        </div>

        {/* Total Maintenance Investment */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('Jumla ya Gharama za Matengenezo', 'Total Maintenance Spend')}
              </span>
              <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
                {tzs(totalSpend)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{t('Vipuri & Ufundi:', 'Parts & Labor:')}</span>
            <span className="font-bold font-mono text-slate-800">{orders.length} {t('Zimekamilika / Zinazoendelea', 'Completed / Active')}</span>
          </div>
        </div>

        {/* Recoverable Maintenance Debt */}
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                {t('Deni Linalokatwa Kwenye Samaki', 'Recoverable Debt (Assisted)')}
              </span>
              <span className="text-2xl font-black font-mono text-amber-950 mt-1 block">
                {tzs(totalRecoverableDebt)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-amber-900">
            <span>{t('Linakatwa moja kwa moja:', 'Deducted automatically on:')}</span>
            <span className="font-bold">{t('Samaki Wajao', 'Next Fish Catch')}</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 overflow-x-auto">
        <button
          onClick={() => setTab('orders')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            tab === 'orders'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench size={15} /> {t('Oda za Matengenezo', 'Work Orders & Repairs')} ({orders.length})
        </button>
        <button
          onClick={() => setTab('boats')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            tab === 'boats'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ship size={15} /> {t('Usajili wa Boti', 'Boat Registry')} ({boats.length})
        </button>
        <button
          onClick={() => setTab('spares')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            tab === 'spares'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package size={15} /> {t('Vipuri vya Boti', 'Marine Spare Parts')} ({spareParts.length})
        </button>
        <button
          onClick={() => setTab('schedules')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            tab === 'schedules'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={15} /> {t('Ratiba ya Saa za Injini', 'Engine Hour Schedules')}
        </button>
      </div>

      {/* TAB 1: WORK ORDERS & REPAIRS */}
      {tab === 'orders' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('Tafuta kwa namba ya oda, jina la boti, au tatizo...', 'Search by WO #, boat name, registration, or fault...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['All', 'Reported', 'In Progress', 'Completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                    filterStatus === status
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {status === 'All' ? t('Zote', 'All') : status === 'Reported' ? t('Imeripotiwa', 'Reported') : status === 'In Progress' ? t('Inaendelea', 'In Progress') : t('Imekamilika', 'Completed')}
                </button>
              ))}
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Oda #', 'Order #')}</th>
                  <th>{t('Tarehe', 'Date')}</th>
                  <th>{t('Boti / Chombo', 'Boat & Vessel')}</th>
                  <th>{t('Kazi & Tatizo', 'Job Title & Fault')}</th>
                  <th>{t('Fundi', 'Mechanic')}</th>
                  <th>{t('Mchanganuo wa Gharama', 'Cost Breakdown')}</th>
                  <th>{t('Jumla ya Gharama', 'Total Cost')}</th>
                  <th>{t('Utaratibu wa Malipo', 'Arrangement')}</th>
                  <th>{t('Hali', 'Status')}</th>
                  <th className="text-right">{t('Hatua', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(item => {
                  const boat = boats.find(b => b.id === item.boatId)
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="font-mono font-bold text-blue-900">{item.no}</td>
                      <td>
                        <span className="text-xs text-slate-700 block">{item.date}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{fmtT(item.at || item.date)}</span>
                      </td>
                      <td>
                        <b className="text-slate-900 block">{boat?.name || t('Boti', 'Vessel')}</b>
                        <span className="text-xs font-mono text-slate-500">{boat?.regNo}</span>
                      </td>
                      <td className="max-w-[220px]">
                        <b className="text-slate-900 block truncate">{item.title}</b>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{item.fault}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-800 font-medium block">{item.mechanic}</span>
                      </td>
                      <td className="text-xs">
                        <span className="text-slate-500 block">{t('Vipuri:', 'Parts:')} {tzs(item.partsCost)}</span>
                        <span className="text-slate-500 block">{t('Ufundi:', 'Labor:')} {tzs(item.laborCost)}</span>
                      </td>
                      <td className="font-mono font-bold text-slate-900">{tzs(item.totalCost)}</td>
                      <td>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            item.arrangement === 'Company-paid'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {item.arrangement}
                        </span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            item.status === 'Completed'
                              ? 'green'
                              : item.status === 'In Progress'
                                ? 'amber'
                                : 'blue'
                          }
                        >
                          {item.status === 'Completed' ? t('Imekamilika', 'Completed') : item.status === 'In Progress' ? t('Inaendelea', 'In Progress') : t('Imeripotiwa', 'Reported')}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status !== 'Completed' && (
                            <button
                              onClick={() => updateOrderStatus(item.id, 'Completed')}
                              title={t('Thibitisha Kukamilika', 'Mark as Completed')}
                              className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold inline-flex items-center gap-1 transition"
                            >
                              <Check size={12} /> {t('Kamilisha', 'Sign-off')}
                            </button>
                          )}
                          <button
                            onClick={() => setViewOrder(item)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                          >
                            {t('Maelezo', 'Details')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BOAT REGISTRY */}
      {tab === 'boats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boats.map(boat => {
            const owner = suppliers.find(s => s.id === boat.ownerId)
            const activeWO = orders.find(o => o.boatId === boat.id && o.status !== 'Completed')
            const isOperational = boat.status === 'Operational'

            return (
              <div
                key={boat.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm hover:border-blue-400 transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-900 block">{boat.regNo}</span>
                      <h3 className="text-base font-bold text-slate-900 m-0 mt-0.5">{boat.name}</h3>
                      <span className="text-xs text-slate-500 block">{boat.boatType}</span>
                    </div>
                    <Badge variant={isOperational ? 'green' : 'amber'}>
                      {isOperational ? t('Inafanya Kazi', 'Operational') : t('Matengenezoni', 'Under Maintenance')}
                    </Badge>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('Umiliki:', 'Ownership:')}</span>
                      <b className="text-slate-800">{boat.ownerType}</b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('Nahodha / Mmiliki:', 'Captain / Assigned:')}</span>
                      <b className="text-slate-900">{boat.captain || owner?.name || t('Mabaharia', 'Assigned Crew')}</b>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5">
                      <span className="text-slate-500">{t('Injini:', 'Outboard Engine:')}</span>
                      <b className="font-mono text-slate-900">{boat.engine}</b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('Saa za Injini:', 'Engine Hours:')}</span>
                      <b className="font-mono text-blue-950">{boat.engineHours || 0} {t('Saa', 'Hours')}</b>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1">
                      <span className="text-slate-500">{t('Matengenezo ya Mwisho:', 'Last Service Date:')}</span>
                      <span className="font-mono text-slate-700">{boat.lastService || '-'}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1">
                      <span className="text-slate-500">{t('Mabaharia Waliosajiliwa:', 'Assigned Crew Members:')}</span>
                      <b className="text-blue-900 font-semibold">{(boat.crewMembers || []).length} {t('Wavuvi', 'Fishermen')}</b>
                    </div>
                  </div>

                  {activeWO && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                      <span className="truncate">
                        <b>{activeWO.no}:</b> {activeWO.title}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setWoForm(prev => ({
                        ...prev,
                        boatId: boat.id,
                        supId: boat.ownerId || '',
                        title: `Routine Inspection for ${boat.name}`
                      }))
                      setNewOrderModal(true)
                    }}
                    className="flex-1 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition text-center"
                  >
                    + {t('Oda ya Matengenezo', 'Work Order')}
                  </button>
                  <button
                    onClick={() => {
                      const nextStatus = isOperational ? 'Under Maintenance' : 'Operational'
                      a.updateBoat(boat.id, { status: nextStatus })
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    {t('Badili Hali', 'Toggle Status')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB 3: MARINE SPARE PARTS */}
      {tab === 'spares' && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">
              {t('Stoo ya vipuri vya injini hupungua moja kwa moja oda ya matengenezo inapotolewa.', 'Marine engine parts inventory automatically deducts stock when work orders are issued.')}
            </span>
            <button
              onClick={() => setNewSpareModal(true)}
              className="btn-primary text-xs"
            >
              <Plus size={14} /> {t('Ongeza Kipuri Kipya', 'Add Marine Spare Part')}
            </button>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Namba ya Kipuri', 'Part #')}</th>
                  <th>{t('Jina la Kipuri', 'Part Description')}</th>
                  <th>{t('Kundi', 'Category')}</th>
                  <th>{t('Stoo Iliyopo', 'Stock on Hand')}</th>
                  <th>{t('Bei ya Kununua', 'Cost Price')}</th>
                  <th>{t('Bei ya Kuuzia', 'Vessel Sell Price')}</th>
                  <th>{t('Hali', 'Status')}</th>
                  <th className="text-right">{t('Ongeza Stoo', 'Restock')}</th>
                </tr>
              </thead>
              <tbody>
                {spareParts.map(item => {
                  const isLow = (item.stock || 0) <= (item.minStock || 5)
                  return (
                    <tr key={item.id}>
                      <td className="font-mono font-bold text-blue-900">{item.partNo}</td>
                      <td>
                        <b className="text-slate-900 block">{item.name}</b>
                        <span className="text-[11px] text-slate-400">{t('Kipimo:', 'Unit:')} {item.unit}</span>
                      </td>
                      <td>
                        <Badge variant="blue">{item.category}</Badge>
                      </td>
                      <td>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {item.stock} {item.unit}
                        </span>
                        <span className="text-[11px] text-slate-400 block">{t('Kiwango cha chini:', 'Min:')} {item.minStock}</span>
                      </td>
                      <td className="font-mono">{tzs(item.unitCost)}</td>
                      <td className="font-mono font-bold text-slate-900">{tzs(item.sellPrice)}</td>
                      <td>
                        {isLow ? (
                          <Badge variant="red">{t('Stoo Ndogo', 'Low Stock')}</Badge>
                        ) : (
                          <Badge variant="green">{t('Ipo Stoo', 'In Stock')}</Badge>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <ViewBtn onClick={() => setViewSpare(item)} />
                          <button
                            onClick={() => {
                              a.addSparePart({ partNo: item.partNo, stock: 10 })
                            }}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition"
                          >
                            <Plus size={12} /> +10 {t('Vipande', 'Pcs')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {viewSpare && (
            <DetailModal
              title={`${t('Maelezo ya Kipuri:', 'Spare Part Details:')} ${viewSpare.name}`}
              subtitle={`${viewSpare.partNo} · ${viewSpare.category}`}
              badge={
                (viewSpare.stock || 0) <= (viewSpare.minStock || 5) ? (
                  <Badge variant="red">{t('Stoo Ndogo', 'Low Stock')}</Badge>
                ) : (
                  <Badge variant="green">{t('Ipo Stoo', 'In Stock')}</Badge>
                )
              }
              onClose={() => setViewSpare(null)}
              fields={[
                { label: t('Namba ya Kipuri', 'Part Number'), value: viewSpare.partNo, mono: true },
                { label: t('Jina la Kipuri', 'Part Name'), value: viewSpare.name },
                { label: t('Kundi', 'Category'), value: viewSpare.category },
                { label: t('Kipimo', 'Unit'), value: viewSpare.unit },
                { label: t('Stoo Iliyopo', 'Stock on Hand'), value: `${viewSpare.stock} ${viewSpare.unit}`, mono: true, highlight: true },
                { label: t('Kiwango cha Chini', 'Minimum Stock'), value: `${viewSpare.minStock} ${viewSpare.unit}`, mono: true },
                { label: t('Bei ya Kununua', 'Unit Cost Price'), value: tzs(viewSpare.unitCost), mono: true },
                { label: t('Bei ya Kuuzia Boti', 'Vessel Sell Price'), value: tzs(viewSpare.sellPrice), mono: true, highlight: true },
              ]}
              actions={
                <button
                  type="button"
                  onClick={() => {
                    a.addSparePart({ partNo: viewSpare.partNo, stock: 10 })
                    setViewSpare(null)
                  }}
                  className="btn-primary text-xs"
                >
                  <Plus size={13} /> {t('Ongeza Vipande +10', 'Restock +10 Pcs')}
                </button>
              }
            />
          )}
        </div>
      )}

      {/* TAB 4: ENGINE HOUR SCHEDULES */}
      {tab === 'schedules' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              interval: t('Saa 100 za Injini', '100 Engine Hours'),
              title: t('Matengenezo Madogo & Plagi', 'Minor Service & Spark Plugs'),
              items: [
                t('Kagua na badilisha plagi (NGK spark plugs)', 'Inspect & replace NGK spark plugs'),
                t('Kagua oili ya gia kama ina maji', 'Check gearcase oil for water intrusion'),
                t('Safisha kabureta na chujio la mafuta', 'Clean carburetor float chambers & fuel filter'),
                t('Kagua mapanga ya propela', 'Inspect propeller blades for bending or nicks')
              ],
              boatsDue: boats.filter(b => (b.engineHours || 0) >= 100 && (b.engineHours || 0) < 250)
            },
            {
              interval: t('Saa 250 za Injini', '250 Engine Hours'),
              title: t('Matengenezo ya Kati & Impela', 'Intermediate Service & Impeller'),
              items: [
                t('Badilisha oili ya gia (Yamalube gear oil)', 'Drain & refill lower unit Yamalube gear oil'),
                t('Badilisha impela ya pampu ya maji', 'Replace water pump impeller & gasket'),
                t('Kagua zinki za kuzuia kutu', 'Inspect sacrificial zinc anodes against electrolysis'),
                t('Paka grisi kwenye usukani na nyaya', 'Grease steering pivot & throttle cables')
              ],
              boatsDue: boats.filter(b => (b.engineHours || 0) >= 250 && (b.engineHours || 0) < 500)
            },
            {
              interval: t('Saa 500 za Injini', '500 Engine Hours'),
              title: t('Matengenezo Makubwa ya Injini', 'Major Overhaul & Compression'),
              items: [
                t('Pima mgandamizo wa silinda na safisha kaboni', 'Cylinder head compression test & decarbonizing'),
                t('Kagua valvu na sili za injini', 'Inspect reed valves and crankcase seals'),
                t('Kagua mhimili wa propela na beringi', 'Full propeller shaft alignment & bearing check'),
                t('Safisha kabureta kwa kina', 'Ultrasonic carburetor cleaning & jet replacement')
              ],
              boatsDue: boats.filter(b => (b.engineHours || 0) >= 500)
            }
          ].map(sched => (
            <div key={sched.interval} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block font-mono">
                {sched.interval}
              </span>
              <h3 className="text-base font-bold text-slate-900 m-0 mt-1">{sched.title}</h3>

              <ul className="mt-3 space-y-1.5 text-xs text-slate-600 pl-4 list-disc">
                {sched.items.map((it, idx) => (
                  <li key={idx}>{it}</li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {t('Boti Zilizofikia Hatua Hii', 'Boats In This Service Tier')} ({sched.boatsDue.length})
                </span>
                <div className="space-y-1.5">
                  {sched.boatsDue.map(b => (
                    <div
                      key={b.id}
                      className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <b className="text-slate-900 block">{b.name} ({b.regNo})</b>
                        <span className="text-slate-500 font-mono">{b.engineHours} {t('Saa', 'Hours')}</span>
                      </div>
                      <Badge variant="amber">{t('Inahitaji Huduma', 'Tier Active')}</Badge>
                    </div>
                  ))}
                  {sched.boatsDue.length === 0 && (
                    <span className="text-xs text-slate-400 italic block">{t('Hakuna boti katika hatua hii kwa sasa.', 'No boats currently in this bracket.')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: NEW WORK ORDER */}
      {newOrderModal && (
        <Modal title={t('Fungua Oda Mpya ya Matengenezo', 'Create Marine Fleet Work Order')} close={() => setNewOrderModal(false)}>
          <div className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Chombo / Boti', 'Vessel / Boat')}>
                <select
                  value={woForm.boatId}
                  onChange={e => {
                    const b = boats.find(x => x.id === e.target.value)
                    setWoForm({
                      ...woForm,
                      boatId: e.target.value,
                      supId: b?.ownerId || woForm.supId
                    })
                  }}
                  className="input-field"
                >
                  {boats.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.regNo}) · {b.engine}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t('Mvuvi / Mmiliki wa Boti', 'Fisherman / Boat Owner')}>
                <select
                  value={woForm.supId}
                  onChange={e => setWoForm({ ...woForm, supId: e.target.value })}
                  className="input-field"
                >
                  <option value="company">{t('Boti ya Kampuni', 'Company Owned Fleet')}</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.cat})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={t('Kichwa cha Matengenezo', 'Maintenance Title / Scope')}>
              <input
                type="text"
                value={woForm.title}
                onChange={e => setWoForm({ ...woForm, title: e.target.value })}
                className="input-field font-semibold"
              />
            </Field>

            <Field label={t('Maelezo ya Tatizo / Hitilafu', 'Fault Description / Symptoms')}>
              <textarea
                rows={2}
                value={woForm.fault}
                onChange={e => setWoForm({ ...woForm, fault: e.target.value })}
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Fundi / Karakana', 'Assigned Mechanic / Marine Workshop')}>
                <input
                  type="text"
                  value={woForm.mechanic}
                  onChange={e => setWoForm({ ...woForm, mechanic: e.target.value })}
                  className="input-field"
                />
              </Field>

              <Field label={t('Utaratibu wa Malipo', 'Financial Arrangement')}>
                <select
                  value={woForm.arrangement}
                  onChange={e => setWoForm({ ...woForm, arrangement: e.target.value })}
                  className="input-field"
                >
                  <option value="Company-assisted (Deduct from fish)">{t('Kampuni inasaidia (Kata kwenye samaki)', 'Company-assisted (Deduct from fish)')}</option>
                  <option value="Company-paid">{t('Inalipwa na Kampuni', 'Company-paid')}</option>
                  <option value="Fisherman-paid (Cash)">{t('Mvuvi analipa Taslimu', 'Fisherman-paid (Cash)')}</option>
                  <option value="Fisherman-paid (Credit)">{t('Mvuvi kwa Mkopo', 'Fisherman-paid (Credit)')}</option>
                </select>
              </Field>
            </div>

            {/* Spare Parts Usage Picker */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-800 block mb-2">{t('Chagua Vipuri Vilivyotumika', 'Marine Spare Parts Requisition')}</span>
              <div className="flex gap-2">
                <select
                  value={woForm.selectedPartId}
                  onChange={e => setWoForm({ ...woForm, selectedPartId: e.target.value })}
                  className="input-field flex-1"
                >
                  {spareParts.map(sp => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} ({sp.partNo}) · {t('Stoo:', 'Stock:')} {sp.stock} {sp.unit} · TZS {f(sp.sellPrice)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={woForm.selectedPartQty}
                  onChange={e => setWoForm({ ...woForm, selectedPartQty: e.target.value })}
                  className="input-field w-20 font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleAddPartToOrder}
                  className="btn-secondary text-xs"
                >
                  + {t('Ongeza', 'Add Part')}
                </button>
              </div>

              {/* Added parts list */}
              {woForm.addedParts.length > 0 && (
                <div className="mt-2 space-y-1">
                  {woForm.addedParts.map((pt, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs bg-white p-1.5 rounded border border-slate-200"
                    >
                      <span>
                        {pt.name} × {pt.qty}
                      </span>
                      <b className="font-mono text-slate-900">{tzs(pt.cost)}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cost Summary Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Gharama ya Vipuri (TZS)', 'Spare Parts Cost (TZS)')}>
                <input
                  type="number"
                  value={woForm.partsCost}
                  onChange={e => setWoForm({ ...woForm, partsCost: e.target.value })}
                  className="input-field font-mono font-bold"
                />
              </Field>

              <Field label={t('Gharama ya Ufundi (TZS)', 'Labor & Service Fee (TZS)')}>
                <input
                  type="number"
                  value={woForm.laborCost}
                  onChange={e => setWoForm({ ...woForm, laborCost: e.target.value })}
                  className="input-field font-mono font-bold"
                />
              </Field>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">{t('Jumla ya Gharama ya Matengenezo:', 'Total Work Order Cost:')}</span>
                <b className="text-lg font-mono text-blue-950 font-bold">
                  {tzs((+woForm.partsCost || 0) + (+woForm.laborCost || 0))}
                </b>
              </div>
              {woForm.arrangement.includes('Deduct') && (
                <Badge variant="amber">{t('Itakatwa Kwenye Samaki', 'Recoverable from Fish Catch')}</Badge>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={() => setNewOrderModal(false)} className="btn-secondary">
                {t('Ghairi', 'Cancel')}
              </button>
              <button type="button" onClick={submitWorkOrder} className="btn-primary">
                <CheckCircle2 size={16} /> {t('Fungua Oda', 'Open Work Order')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: REGISTER BOAT */}
      {newBoatModal && (
        <Modal title={t('Sajili Boti / Chombo cha Uvuvi', 'Register Fishing Boat / Marine Vessel')} close={() => setNewBoatModal(false)}>
          <div className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Namba ya Usajili wa Boti #', 'Boat Registration #')}>
                <input
                  type="text"
                  value={boatForm.regNo}
                  onChange={e => setBoatForm({ ...boatForm, regNo: e.target.value })}
                  className="input-field font-mono font-bold"
                />
              </Field>

              <Field label={t('Jina la Boti', 'Vessel Name')}>
                <input
                  type="text"
                  value={boatForm.name}
                  onChange={e => setBoatForm({ ...boatForm, name: e.target.value })}
                  className="input-field font-bold"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Aina ya Umiliki', 'Ownership Structure')}>
                <select
                  value={boatForm.ownerType}
                  onChange={e => setBoatForm({ ...boatForm, ownerType: e.target.value })}
                  className="input-field"
                >
                  <option value="Fisherman-owned">{t('Inamilikiwa na Mvuvi', 'Fisherman-owned')}</option>
                  <option value="Company-owned">{t('Inamilikiwa na Kampuni', 'Company-owned')}</option>
                  <option value="BMU-owned">{t('Inamilikiwa na BMU', 'BMU-owned')}</option>
                  <option value="Joint Venture">{t('Ubia', 'Joint Venture')}</option>
                </select>
              </Field>

              <Field label={t('Mvuvi / Mmiliki Aliyesajiliwa', 'Registered Fisherman / Owner')}>
                <select
                  value={boatForm.ownerId}
                  onChange={e => setBoatForm({ ...boatForm, ownerId: e.target.value })}
                  className="input-field"
                >
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.cat})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Aina ya Injini', 'Engine Specifications')}>
                <input
                  type="text"
                  value={boatForm.engine}
                  onChange={e => setBoatForm({ ...boatForm, engine: e.target.value })}
                  className="input-field"
                />
              </Field>

              <Field label={t('Aina ya Boti / Muundo', 'Hull / Boat Type')}>
                <input
                  type="text"
                  value={boatForm.boatType}
                  onChange={e => setBoatForm({ ...boatForm, boatType: e.target.value })}
                  className="input-field"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Saa za Injini za Sasa', 'Current Engine Hours')}>
                <input
                  type="number"
                  value={boatForm.engineHours}
                  onChange={e => setBoatForm({ ...boatForm, engineHours: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>

              <Field label={t('Nahodha', 'Captain / Skipper')}>
                <input
                  type="text"
                  value={boatForm.captain}
                  onChange={e => setBoatForm({ ...boatForm, captain: e.target.value })}
                  className="input-field"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewBoatModal(false)} className="btn-secondary">
                {t('Ghairi', 'Cancel')}
              </button>
              <button type="button" onClick={submitBoat} className="btn-primary">
                {t('Hifadhi Boti', 'Save Boat Profile')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: ADD MARINE SPARE PART */}
      {newSpareModal && (
        <Modal title={t('Sajili Kipuri Kipya cha Boti', 'Register Marine Spare Part')} close={() => setNewSpareModal(false)}>
          <div className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Jina la Kipuri', 'Part Name')}>
                <input
                  type="text"
                  placeholder={t('mf. Impela ya Pampu ya Maji', 'e.g. Yamaha Water Pump Impeller')}
                  value={partForm.name}
                  onChange={e => setPartForm({ ...partForm, name: e.target.value })}
                  className="input-field font-bold"
                />
              </Field>

              <Field label={t('Namba ya Kipuri / SKU', 'Part Number / SKU')}>
                <input
                  type="text"
                  placeholder="e.g. YAM-IMP-40"
                  value={partForm.partNo}
                  onChange={e => setPartForm({ ...partForm, partNo: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label={t('Kundi', 'Category')}>
                <select
                  value={partForm.category}
                  onChange={e => setPartForm({ ...partForm, category: e.target.value })}
                  className="input-field"
                >
                  <option>Ignition</option>
                  <option>Lubricants</option>
                  <option>Propulsion</option>
                  <option>Electrical</option>
                  <option>Rigging</option>
                  <option>Cooling</option>
                </select>
              </Field>

              <Field label={t('Stoo ya Awali', 'Initial Stock')}>
                <input
                  type="number"
                  value={partForm.stock}
                  onChange={e => setPartForm({ ...partForm, stock: e.target.value })}
                  className="input-field font-mono font-bold"
                />
              </Field>

              <Field label={t('Kipimo', 'Unit of Measure')}>
                <input
                  type="text"
                  value={partForm.unit}
                  onChange={e => setPartForm({ ...partForm, unit: e.target.value })}
                  className="input-field"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Bei ya Kununulia (TZS)', 'Wholesale Cost Price (TZS)')}>
                <input
                  type="number"
                  value={partForm.unitCost}
                  onChange={e => setPartForm({ ...partForm, unitCost: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>

              <Field label={t('Bei ya Kuuzia (TZS)', 'Vessel Sell Price (TZS)')}>
                <input
                  type="number"
                  value={partForm.sellPrice}
                  onChange={e => setPartForm({ ...partForm, sellPrice: e.target.value })}
                  className="input-field font-mono font-bold text-blue-900"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewSpareModal(false)} className="btn-secondary">
                {t('Ghairi', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={submitSpare}
                disabled={!partForm.name || !partForm.partNo}
                className="btn-primary"
              >
                {t('Hifadhi Kipuri', 'Save Spare Part')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: VIEW WORK ORDER DETAILS */}
      {viewOrder && (
        <Modal title={`${t('Maelezo ya Oda:', 'Work Order Details:')} ${viewOrder.no}`} close={() => setViewOrder(null)}>
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">{viewOrder.title}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">{t('Tarehe:', 'Date:')} {viewOrder.date}</span>
                </div>
                <Badge
                  variant={
                    viewOrder.status === 'Completed'
                      ? 'green'
                      : viewOrder.status === 'In Progress'
                        ? 'amber'
                        : 'blue'
                  }
                >
                  {viewOrder.status === 'Completed' ? t('Imekamilika', 'Completed') : viewOrder.status === 'In Progress' ? t('Inaendelea', 'In Progress') : t('Imeripotiwa', 'Reported')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">{t('BOTI / CHOMBO:', 'VESSEL:')}</span>
                  <b className="text-slate-900">
                    {boats.find(b => b.id === viewOrder.boatId)?.name || t('Boti', 'Vessel')} (
                    {boats.find(b => b.id === viewOrder.boatId)?.regNo})
                  </b>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{t('FUNDI:', 'MECHANIC:')}</span>
                  <b className="text-slate-900">{viewOrder.mechanic}</b>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-slate-400 block text-[10px]">{t('TATIZO LILILORIPOTIWA:', 'REPORTED FAULT:')}</span>
                <p className="text-slate-800 m-0 mt-0.5">{viewOrder.fault}</p>
              </div>

              {viewOrder.parts && viewOrder.parts.length > 0 && (
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-slate-400 block text-[10px] mb-1">{t('VIPURI VILIVYOTUMIKA:', 'PARTS USED:')}</span>
                  <div className="space-y-1">
                    {viewOrder.parts.map((p, idx) => (
                      <div key={idx} className="flex justify-between bg-white p-1.5 rounded border border-slate-200">
                        <span>{p.name} × {p.qty}</span>
                        <b className="font-mono">{tzs(p.cost)}</b>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span>{t('Jumla ya Vipuri:', 'Parts Total:')}</span>
                <b className="font-mono">{tzs(viewOrder.partsCost)}</b>
              </div>
              <div className="flex justify-between">
                <span>{t('Jumla ya Ufundi:', 'Labor Total:')}</span>
                <b className="font-mono">{tzs(viewOrder.laborCost)}</b>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>{t('JUMLA KUU YA GHARAMA:', 'TOTAL JOB COST:')}</span>
                <span className="font-mono text-blue-950">{tzs(viewOrder.totalCost)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              {viewOrder.status !== 'Completed' ? (
                <button
                  type="button"
                  onClick={() => {
                    updateOrderStatus(viewOrder.id, 'Completed')
                    setViewOrder(null)
                  }}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs"
                >
                  <Check size={14} /> {t('Kamilisha & Thibitisha Oda', 'Complete & Sign-off Work Order')}
                </button>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 size={16} /> {t('Kazi Imekamilika & Imethibitishwa', 'Job Completed & Verified')}
                </span>
              )}
              <button
                type="button"
                onClick={() => setViewOrder(null)}
                className="btn-secondary text-xs"
              >
                {t('Funga', 'Close')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

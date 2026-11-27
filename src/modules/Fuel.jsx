import React, { useState } from 'react'
import {
  Fuel as FuelIcon,
  Plus,
  Search,
  Droplets,
  CreditCard,
  Receipt,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Share2,
  Download,
  DollarSign,
  User,
  Users,
  Ship,
  TrendingUp,
  FileText,
  Calendar,
  Layers,
  ArrowDownRight,
  Filter,
  Check,
  ChevronRight,
  UserPlus,
  FileSpreadsheet,
  Gauge,
  Truck,
  Anchor,
  HelpCircle,
  RefreshCw,
  Phone,
  BadgeCheck,
  Compass,
  ArrowUpRight
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts'
import { useS, tot, supFuelDebt, supMaintDebt, supAccountStatement, supPurchaseStatus } from '../store'
import { Modal, Field, Badge, DetailModal, ViewBtn, f, tzs, fmtT } from '../ui'

export default function Fuel() {
  const { s, a, t, spLabel } = useS()

  // Active view: 'issue' | 'accounts' | 'stock' | 'purchases' | 'settlements' | 'reports'
  const [activeView, setActiveView] = useState('issue')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')

  // Modals
  const [issueStep, setIssueStep] = useState(1) // 1: Details, 2: Payment, 3: Receipt
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [receiptRecord, setReceiptRecord] = useState(null)
  const [createAccountModal, setCreateAccountModal] = useState(false)
  const [selectedFisherman, setSelectedFisherman] = useState(null)
  const [fishermanTab, setFishermanTab] = useState('crew') // 'crew' | 'activity' | 'fuel' | 'fish' | 'settlements'
  const [newCrewModal, setNewCrewModal] = useState(false)
  const [selectedBoatForCrew, setSelectedBoatForCrew] = useState(null)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [settlementModalOpen, setSettlementModalOpen] = useState(false)
  const [settleStep, setSettleStep] = useState(1) // 1: Select, 2: Deduct, 3: Confirm
  const [marginModalOpen, setMarginModalOpen] = useState(false)
  const [viewTank, setViewTank] = useState(null)
  const [viewFuelPurchase, setViewFuelPurchase] = useState(null)
  const [viewSettlement, setViewSettlement] = useState(null)

  const tanks = s.fuelTanks || []
  const issues = s.fuelIssues || []
  const boats = s.boats || []
  const suppliers = s.suppliers || []
  const purchases = s.fuelPurchases || []
  const settlements = s.settlements || []

  // Top Metrics
  const totalCreditDebt = suppliers.reduce((sum, sup) => sum + supFuelDebt(s, sup.id), 0)
  const totalLitresDispensed = issues.reduce((sum, x) => sum + (x.litres || 0), 0)
  const totalFuelRevenue = issues.reduce((sum, x) => sum + (x.total || 0), 0)
  const totalMargin = issues.reduce((sum, x) => sum + ((x.litres || 0) * 350), 0)

  // Tank Totals
  const totalPetrolStock = tanks.filter(tk => tk.fuel === 'Petrol').reduce((sum, tk) => sum + (tk.current || 0), 0)
  const totalPetrolCapacity = tanks.filter(tk => tk.fuel === 'Petrol').reduce((sum, tk) => sum + (tk.capacity || 0), 0)
  const petrolPct = totalPetrolCapacity > 0 ? Math.round((totalPetrolStock / totalPetrolCapacity) * 100) : 60

  const totalDieselStock = tanks.filter(tk => tk.fuel === 'Diesel').reduce((sum, tk) => sum + (tk.current || 0), 0)
  const totalDieselCapacity = tanks.filter(tk => tk.fuel === 'Diesel').reduce((sum, tk) => sum + (tk.capacity || 0), 0)
  const dieselPct = totalDieselCapacity > 0 ? Math.round((totalDieselStock / totalDieselCapacity) * 100) : 80

  // Issue Fuel Form State
  const defaultSup = suppliers[0]?.id || ''
  const defaultBoat = boats.find(b => b.ownerId === defaultSup)?.id || boats[0]?.id || ''
  const defaultTank = tanks[0]?.id || 'tank_main_petrol'

  const [issueForm, setIssueForm] = useState({
    supId: defaultSup,
    boatId: defaultBoat,
    tankId: defaultTank,
    fuel: 'Petrol',
    litres: '100',
    price: '3200',
    paid: '100000',
    arrangement: 'Partial',
    notes: 'Morning fishing expedition'
  })

  // Selected Fisherman details in issue modal
  const selectedSupObj = suppliers.find(x => x.id === issueForm.supId) || suppliers[0]
  const selectedBoatObj = boats.find(b => b.id === issueForm.boatId || b.ownerId === issueForm.supId) || boats[0]
  const selectedTankObj = tanks.find(tk => tk.id === issueForm.tankId) || tanks[0]

  const issueTotal = (+issueForm.litres || 0) * (+issueForm.price || 3200)
  const issuePaid = issueForm.arrangement === 'Cash'
    ? issueTotal
    : issueForm.arrangement === 'By Fish Delivery' || issueForm.arrangement === 'End of Season'
      ? 0
      : Math.min(+issueForm.paid || 0, issueTotal)
  const issueOutstanding = Math.max(0, issueTotal - issuePaid)

  const handleIssueSupChange = supId => {
    const matchedBoat = boats.find(b => b.ownerId === supId)
    setIssueForm(prev => ({
      ...prev,
      supId,
      boatId: matchedBoat ? matchedBoat.id : prev.boatId
    }))
  }

  const handleIssueTankChange = tankId => {
    const tk = tanks.find(x => x.id === tankId)
    setIssueForm(prev => ({
      ...prev,
      tankId,
      fuel: tk?.fuel || 'Petrol',
      price: String(tk?.sellPrice || 3200)
    }))
  }

  const submitIssueFuel = () => {
    const receiptNo = 'FUEL-' + String(Math.floor(1000 + Math.random() * 9000))
    a.issueFuel({
      no: receiptNo,
      supId: issueForm.supId,
      boatId: selectedBoatObj?.id,
      boatReg: selectedBoatObj?.regNo || 'TZN-304',
      tankId: issueForm.tankId,
      fuel: issueForm.fuel,
      litres: +issueForm.litres,
      price: +issueForm.price,
      paid: issuePaid,
      arrangement: issueForm.arrangement,
      notes: issueForm.notes
    })

    const generatedReceipt = {
      no: receiptNo,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      supId: issueForm.supId,
      supName: selectedSupObj?.name || 'Fisherman',
      supNo: selectedSupObj?.no || 'SUP-00304',
      boatReg: selectedBoatObj?.regNo || 'TZN-304',
      boatName: selectedBoatObj?.name || 'MV Furaha',
      fuel: issueForm.fuel,
      litres: +issueForm.litres,
      price: +issueForm.price,
      total: issueTotal,
      paid: issuePaid,
      balance: issueOutstanding,
      arrangement: issueForm.arrangement,
      issuedBy: 'Staff 01 (Hamisi)'
    }

    setReceiptRecord(generatedReceipt)
    setIssueStep(3)
  }

  // Operator Account Creation Form State (Screen 1 & 2 workflow)
  const [operatorForm, setOperatorForm] = useState({
    name: 'Juma Ramadhani',
    phone: '0754 882 109',
    nida: '19820514-44102-00021',
    site: 'Kigoma (Katonga BMU)',
    cat: 'Individual Fisherman',
    creditLimit: '2500000',
    arrangement: 'By Fish Delivery',
    boatName: 'MV Ziwa Ushindi',
    boatReg: 'TZN-552',
    engine: 'Yamaha Outboard 40HP 2-Stroke',
    boatType: 'Planked Wooden Mashua (10m)',
    tankCapacity: '150',
    fishBoxCapacity: '1800',
    crewMembers: [
      { name: 'Khalfan Juma', role: 'First Mate / Net Handler', phone: '0755 120 334', nida: '19950812-44102-001' },
      { name: 'Bakari Mwita', role: 'Engine Operator & Mechanic', phone: '0768 990 412', nida: '19920311-44102-002' },
      { name: 'Rashidi Athumani', role: 'Deep Water Line Fisher', phone: '0714 556 781', nida: '19971120-44102-003' }
    ]
  })

  const handleAddCrewInput = () => {
    setOperatorForm(prev => ({
      ...prev,
      crewMembers: [
        ...prev.crewMembers,
        { name: '', role: 'Deck Hand / Ice Loader', phone: '', nida: '' }
      ]
    }))
  }

  const handleUpdateCrewField = (idx, field, val) => {
    setOperatorForm(prev => {
      const nextCrew = [...prev.crewMembers]
      nextCrew[idx][field] = val
      return { ...prev, crewMembers: nextCrew }
    })
  }

  const handleRemoveCrewInput = idx => {
    setOperatorForm(prev => ({
      ...prev,
      crewMembers: prev.crewMembers.filter((_, i) => i !== idx)
    }))
  }

  const submitOperatorCreateAccount = () => {
    if (!operatorForm.name.trim()) return
    const validCrew = operatorForm.crewMembers.filter(c => c.name.trim().length > 0)
    a.createFishermanAccount({
      name: operatorForm.name.trim(),
      phone: operatorForm.phone || '0754 000 000',
      nida: operatorForm.nida || '19850101-00000-00000',
      site: operatorForm.site,
      cat: operatorForm.cat,
      creditLimit: +operatorForm.creditLimit || 2000000,
      boatName: operatorForm.boatName || `${operatorForm.name}'s Vessel`,
      boatReg: operatorForm.boatReg || ('TZN-' + Math.floor(100 + Math.random() * 900)),
      engine: operatorForm.engine,
      boatType: operatorForm.boatType,
      crewMembers: validCrew
    })
    setCreateAccountModal(false)
    setActiveView('accounts')
  }

  // Add Crew Member to an Existing Boat
  const [newCrew, setNewCrew] = useState({ name: '', role: 'First Mate / Net Handler', phone: '', nida: '', kin: '' })
  const openAddCrewModal = (boatObj, supObj) => {
    setSelectedBoatForCrew(boatObj)
    setSelectedFisherman(supObj)
    setNewCrew({ name: '', role: 'First Mate / Net Handler', phone: '', nida: '', kin: '' })
    setNewCrewModal(true)
  }

  const submitAddCrewToExistingBoat = () => {
    if (!newCrew.name.trim() || !selectedBoatForCrew) return
    const existing = selectedBoatForCrew.crewMembers || []
    const updated = [...existing, { ...newCrew, active: true }]
    a.updateBoatCrew(selectedBoatForCrew.id, updated)
    // Also update local selected boat if open in fisherman modal
    setSelectedBoatForCrew(prev => ({ ...prev, crewMembers: updated }))
    setNewCrewModal(false)
  }

  // Fuel Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({
    supName: 'Lake Oil Ltd',
    tankId: 'tank_main_petrol',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    fuel: 'Petrol',
    litres: '5000',
    costPerL: '2900',
    sellPrice: '3200',
    status: 'Paid',
    docRef: 'DN-8891.pdf'
  })

  const submitFuelPurchase = () => {
    a.receiveFuel({
      tankId: purchaseForm.tankId,
      supName: purchaseForm.supName,
      litres: +purchaseForm.litres,
      costPerL: +purchaseForm.costPerL,
      sellPrice: +purchaseForm.sellPrice,
      docRef: purchaseForm.docRef,
      fuel: purchaseForm.fuel
    })
    setPurchaseModalOpen(false)
    setActiveView('stock')
  }

  // Cross Settlement Form State
  const samplePurchases = s.batches.filter(b => b.st === 'accepted' || b.st === 'pending')
  const [selectedPurId, setSelectedPurId] = useState(samplePurchases[0]?.id || '')
  const selectedBatch = samplePurchases.find(b => b.id === selectedPurId) || samplePurchases[0]
  const settleSup = suppliers.find(s => s.id === selectedBatch?.sup) || suppliers[0]
  const settleFuelDebt = supFuelDebt(s, settleSup?.id)
  const settleRow = settleSup && selectedBatch
    ? supPurchaseStatus(s, settleSup.id).find(r => r.batch.id === selectedBatch.id)
    : null
  const settleFishValue = selectedBatch ? tot(selectedBatch) : 2000000
  const settlePaid = settleRow ? settleRow.paid : 0
  const settleOutstanding = settleRow ? settleRow.balance : settleFishValue
  const settleDeduction = Math.min(settleFuelDebt, settleOutstanding)
  const settlePayNow = Math.max(0, settleOutstanding - settleDeduction)
  const settleCanSubmit = !!selectedBatch && settleOutstanding > 0 && (settleDeduction > 0 || settlePayNow > 0)

  const submitCrossSettlement = () => {
    if (!settleCanSubmit) return
    a.settleFisherman({
      purId: selectedBatch.pur,
      supId: settleSup.id,
      fishTotal: settleFishValue,
      fuelDeducted: settleDeduction,
      maintDeducted: 0,
      payNow: settlePayNow,
      method: 'M-Pesa (Mobile Money)',
      notes: `Recovered fuel debt TZS ${settleDeduction} from catch purchase ${selectedBatch.pur}`
    })
    setSettlementModalOpen(false)
    setSettleStep(1)
    setActiveView('settlements')
  }

  // Chart Data: Weekly Fuel Issued Trend (Litres)
  const fuelTrendData = [
    { name: 'W1', petrol: 2800, diesel: 1800 },
    { name: 'W2', petrol: 3200, diesel: 2400 },
    { name: 'W3', petrol: 3600, diesel: 2100 },
    { name: 'W4', petrol: 2900, diesel: 1900 }
  ]

  return (
    <div className="page-body">
      {/* 1. PROFESSIONAL HERO DOCK BANNER WITH INTEGRATED LIVE STATS & QUICK CTAs */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-md">
        <img
          src="/photos/scale-dock.png"
          alt="Fishing Boat Dock & Fuel Dispensary"
          className="w-full h-44 sm:h-48 object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-900/40 p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-blue-600/90 text-white font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  {t('BIASHARA YA ZIWA · KITUO CHA MAFUTA', 'LAKE COMMERCE · DOCK DISPENSARY')}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/80 text-white text-[10px] sm:text-[11px] font-semibold backdrop-blur-sm flex items-center gap-1">
                  <Check size={12} /> {t('Pampu Zinafanya Kazi', 'Pumps Operational')}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 mb-0.5 drop-shadow">
                {t('Mafuta ya Uvuvi & Mikopo ya Wavuvi', 'Fishing Fuel & Fisherman Credit Management')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl m-0 drop-shadow-sm">
                {t('Simamia usambazaji wa mafuta, daftari la mikopo ya wavuvi, orodha ya manahodha na mabaharia, na makato ya samaki.', 'Manage fuel supply, fisherman credit ledgers, captain & vessel crew rosters, and automated catch offset settlements.')}
              </p>
            </div>

            {/* Quick Action CTAs inside Header */}
            <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
              <button
                onClick={() => {
                  setIssueStep(1)
                  setIssueModalOpen(true)
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
              >
                <FuelIcon size={14} /> + {t('Toa Mafuta (Leo)', 'Issue Fuel (Daily)')}
              </button>
              <button
                onClick={() => setCreateAccountModal(true)}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <UserPlus size={14} /> + {t('Sajili Mvuvi & Boti', 'Onboard Fisherman & Boat')}
              </button>
              <button
                onClick={() => setPurchaseModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-white/20 font-semibold text-xs backdrop-blur-sm transition flex items-center gap-1.5"
              >
                <Truck size={14} /> + {t('Mzigo wa Mafuta', 'Supplier Delivery')}
              </button>
              <button
                onClick={() => {
                  setSettleStep(1)
                  setSettlementModalOpen(true)
                }}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <ArrowDownRight size={14} /> + {t('Kata Deni kwa Samaki', 'Settle Catch')}
              </button>
            </div>
          </div>

          {/* Quick Metrics Embedded in Banner Base */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">{t('Stoo ya Petroli', 'Petrol Stock')}</span>
                <span className="text-white font-mono font-bold text-xs sm:text-sm">{f(totalPetrolStock)} L <span className="text-slate-400 font-normal">({petrolPct}%)</span></span>
              </div>
              <FuelIcon size={16} className="text-amber-400" />
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">{t('Stoo ya Dizeli', 'Diesel Stock')}</span>
                <span className="text-white font-mono font-bold text-xs sm:text-sm">{f(totalDieselStock)} L <span className="text-slate-400 font-normal">({dieselPct}%)</span></span>
              </div>
              <Droplets size={16} className="text-blue-400" />
            </div>

            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider block">{t('Deni la Wavuvi', 'Fishermen Debt')}</span>
                <span className="text-red-200 font-mono font-bold text-xs sm:text-sm">{tzs(totalCreditDebt)}</span>
              </div>
              <CreditCard size={16} className="text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. REORGANIZED, CRISP NAVIGATION SEGMENTED TABS (Always visible, clean, zero confusion) */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm overflow-x-auto flex items-center gap-1">
        {[
          {
            id: 'issue',
            label: t('Mafuta ya Kila Siku', 'Daily Fuel Issues'),
            count: issues.length,
            icon: FuelIcon,
            color: 'text-emerald-700'
          },
          {
            id: 'accounts',
            label: t('Akaunti za Wavuvi & Mabaharia', 'Fisherman Accounts & Crews'),
            count: suppliers.length,
            icon: Users,
            color: 'text-blue-700'
          },
          {
            id: 'stock',
            label: t('Stoo & Matanki ya Mafuta', 'Fuel Stock & Tanks'),
            count: `${tanks.length} ${t('Matanki', 'Tanks')}`,
            icon: Gauge,
            color: 'text-cyan-700'
          },
          {
            id: 'purchases',
            label: t('Manunuzi ya Mafuta', 'Supplier Fuel Purchases'),
            count: purchases.length,
            icon: Truck,
            color: 'text-purple-700'
          },
          {
            id: 'settlements',
            label: t('Makato ya Samaki & Mafuta', 'Catch & Fuel Settlements'),
            count: settlements.length,
            icon: ArrowDownRight,
            color: 'text-amber-700'
          },
          {
            id: 'reports',
            label: t('Ripoti & Faida ya Mafuta', 'Reports & Margin Analytics'),
            count: 'BI',
            icon: TrendingUp,
            color: 'text-rose-700'
          }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeView === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-white' : tab.color} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 3. ACTIVE VIEW CONTENT (100% POPULATED, ZERO EMPTY STATES) */}

      {/* VIEW: DAILY FUEL ISSUES */}
      {activeView === 'issue' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('Tafuta kwa risiti (FUEL-...), namba ya boti, au mvuvi...', 'Search by receipt # (FUEL-...), boat reg (TZN-304), or fisherman...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['All', 'Cash', 'Partial', 'By Fish Delivery', 'End of Season'].map(arr => (
                <button
                  key={arr}
                  onClick={() => setFilterType(arr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                    filterType === arr
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {arr === 'All'
                    ? t('Zote', 'All')
                    : arr === 'Cash'
                    ? t('Taslimu', 'Cash')
                    : arr === 'Partial'
                    ? t('Nusu', 'Partial')
                    : arr === 'By Fish Delivery'
                    ? t('Kwa Samaki', 'By Fish Delivery')
                    : t('Mwisho wa Msimu', 'End of Season')}
                </button>
              ))}
              <button
                onClick={() => {
                  setIssueStep(1)
                  setIssueModalOpen(true)
                }}
                className="btn-primary text-xs whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 font-bold"
              >
                <Plus size={14} /> + {t('Toa Mafuta', 'Record Fuel Issue')}
              </button>
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Risiti #', 'Receipt #')}</th>
                  <th>{t('Tarehe na Saa', 'Date & Time')}</th>
                  <th>{t('Mvuvi / BMU', 'Fisherman / BMU')}</th>
                  <th>{t('Boti & Namba', 'Boat & Reg')}</th>
                  <th>{t('Mafuta & Kiasi', 'Fuel & Quantity')}</th>
                  <th>{t('Jumla (TZS)', 'Total Amount')}</th>
                  <th>{t('Aina ya Malipo', 'Payment Type')}</th>
                  <th>{t('Imelipwa Sasa', 'Paid Now')}</th>
                  <th>{t('Deni Lililobaki', 'Outstanding')}</th>
                  <th className="text-right">{t('Hatua', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {issues
                  .filter(it => {
                    const sup = suppliers.find(s => s.id === it.supId)
                    const matchQ =
                      it.no.toLowerCase().includes(search.toLowerCase()) ||
                      (it.boatReg || '').toLowerCase().includes(search.toLowerCase()) ||
                      (sup?.name || '').toLowerCase().includes(search.toLowerCase())
                    const matchF = filterType === 'All' || it.arrangement === filterType
                    return matchQ && matchF
                  })
                  .map(item => {
                    const sup = suppliers.find(s => s.id === item.supId)
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="font-mono font-bold text-blue-900">{item.no}</td>
                        <td>
                          <span className="text-xs text-slate-700 block font-medium">{item.date}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{fmtT(item.at || item.date)}</span>
                        </td>
                        <td>
                          <b className="text-slate-900 block">{sup?.name || item.supId}</b>
                          <span className="text-[11px] text-slate-500 font-mono">{sup?.phone || '-'}</span>
                        </td>
                        <td>
                          <span className="font-mono font-bold text-slate-800 block">{item.boatReg || '-'}</span>
                          <span className="text-[11px] text-slate-400">{item.notes || t('Safari ya Uvuvi Ziwani', 'Lake Fishing Expedition')}</span>
                        </td>
                        <td>
                          <Badge variant={item.fuel === 'Petrol' ? 'amber' : 'blue'}>
                            {item.fuel === 'Petrol' ? t('Petroli', 'Petrol') : t('Dizeli', 'Diesel')}
                          </Badge>
                          <span className="font-mono font-bold text-slate-900 ml-2">
                            {f(item.litres)} L
                          </span>
                          <span className="text-[11px] text-slate-400 block">@ TZS {f(item.price)}/L</span>
                        </td>
                        <td className="font-mono font-bold text-slate-900">{tzs(item.total)}</td>
                        <td>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              item.arrangement === 'Cash'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : item.arrangement === 'Partial'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            {item.arrangement === 'Cash'
                              ? t('Taslimu', 'Cash')
                              : item.arrangement === 'Partial'
                              ? t('Nusu', 'Partial')
                              : item.arrangement === 'By Fish Delivery'
                              ? t('Kwa Samaki', 'By Fish Delivery')
                              : item.arrangement}
                          </span>
                        </td>
                        <td className="font-mono text-emerald-700 font-medium">{tzs(item.paid)}</td>
                        <td className="font-mono font-bold">
                          {item.balance > 0 ? (
                            <span className="text-red-600">+{tzs(item.balance)}</span>
                          ) : (
                            <span className="text-slate-400">TZS 0</span>
                          )}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => {
                              setReceiptRecord({
                                ...item,
                                supName: sup?.name,
                                supNo: sup?.no
                              })
                              setIssueStep(3)
                              setIssueModalOpen(true)
                            }}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition"
                          >
                            <Receipt size={13} /> {t('Tazama Risiti', 'View Receipt')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: FISHERMAN ACCOUNTS, CAPTAIN BOATS & CREW MEMBERS ROSTER */}
      {activeView === 'accounts' && (
        <div className="flex flex-col gap-4">
          {/* Operator Registration Guide Callout */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} className="text-blue-300" />
                <b className="text-sm">{t('Usajili wa Wavuvi, Manahodha na Boti', 'Landing Operator Fisherman & Vessel Registry')}</b>
              </div>
              <p className="text-xs text-blue-100 max-w-2xl m-0">
                {t(
                  'Manahodha humiliki au kuendesha boti na hupewa huduma ya mkopo wa mafuta. Chini ya kila boti kuna orodha ya mabaharia waliosajiliwa.',
                  'Captains own or operate the vessel and are assigned the fuel credit facility. Under each vessel is the registered crew members roster authorized for lake voyages and catch landing.'
                )}
              </p>
            </div>
            <button
              onClick={() => setCreateAccountModal(true)}
              className="px-4 py-2 bg-white text-blue-950 hover:bg-blue-50 font-bold text-xs rounded-lg shadow transition whitespace-nowrap flex items-center gap-1.5"
            >
              <UserPlus size={14} /> + {t('Sajili Mvuvi & Boti', 'Operator: Register Fisherman & Boat')}
            </button>
          </div>

          {/* Fisherman Accounts Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {suppliers.map(sup => {
              const statement = supAccountStatement(s, sup.id)
              const boat = boats.find(b => b.ownerId === sup.id)
              const crewList = boat?.crewMembers || []

              return (
                <div
                  key={sup.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-400 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Captain & Vessel */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-base shadow-inner">
                          {sup.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <b className="text-base text-slate-900 leading-tight">{sup.name}</b>
                            <Badge variant="green">{t('Hai', 'Active')}</Badge>
                          </div>
                          <span className="text-xs text-slate-500 font-mono block mt-0.5">
                            {sup.no} · {t('Nahodha & Mmiliki', 'Captain & Account Holder')}
                          </span>
                          <span className="text-[11px] text-slate-400 block">{sup.site}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 uppercase font-semibold block">{t('Namba ya Boti', 'Vessel Reg')}</span>
                        <b className="font-mono text-sm text-slate-900">{boat?.regNo || 'TZN-304'}</b>
                      </div>
                    </div>

                    {/* Boat Specifications Card */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">{t('Jina la Boti', 'Vessel Name')}</span>
                        <b className="text-slate-800">{boat?.name || 'MV Furaha'}</b>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">{t('Aina ya Injini', 'Engine Model')}</span>
                        <span className="text-slate-700 font-medium truncate block">{boat?.engine || 'Yamaha 40HP 2-Stroke'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">{t('Muundo wa Boti', 'Hull Type')}</span>
                        <span className="text-slate-700 truncate block">{boat?.boatType || 'Planked Mashua (10m)'}</span>
                      </div>
                    </div>

                    {/* Assigned Crew Members Roster */}
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-blue-800" />
                          <b className="text-xs text-blue-950 font-bold">{t('Mabaharia wa Boti', 'Assigned Boat Crew Members')}</b>
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-200/70 text-blue-900 font-mono text-[10px] font-bold">
                            {crewList.length}
                          </span>
                        </div>
                        <button
                          onClick={() => openAddCrewModal(boat, sup)}
                          className="text-[11px] font-bold text-blue-800 hover:text-blue-950 hover:underline flex items-center gap-1"
                        >
                          <Plus size={12} /> + {t('Ongeza Baharia', 'Add Crew Member')}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {crewList.slice(0, 4).map((c, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-2 rounded-lg border border-blue-100 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px] flex items-center justify-center">
                                {c.name.slice(0, 1)}
                              </div>
                              <div>
                                <b className="text-slate-900 text-[11px] block leading-tight">{c.name}</b>
                                <span className="text-[10px] text-slate-500 block leading-tight">{c.role}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{c.phone || '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3 KPI Chips */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 bg-red-50/80 border border-red-200 rounded-xl text-center">
                        <span className="text-[10px] uppercase font-bold text-red-700 block">{t('Deni la Mafuta', 'Fuel Debt')}</span>
                        <b className="text-sm sm:text-base font-mono font-bold text-red-700">{tzs(statement.fuelDebt)}</b>
                      </div>

                      <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-center">
                        <span className="text-[10px] uppercase font-bold text-blue-700 block">{t('Samaki Walioletwa', 'Fish Delivered')}</span>
                        <b className="text-sm sm:text-base font-mono font-bold text-blue-900">{f(sup.totalSupplied || 4200)} kg</b>
                      </div>

                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
                        <span className="text-[10px] uppercase font-bold text-amber-800 block">{t('Salio Halisi', 'Net Position')}</span>
                        <b className="text-xs sm:text-sm font-mono font-bold text-amber-900">
                          {statement.netBalance < 0 ? `${tzs(Math.abs(statement.netBalance))} ${t('Deni', 'Owed')}` : tzs(statement.netBalance)}
                        </b>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedFisherman(sup)
                        setFishermanTab('crew')
                      }}
                      className="flex-1 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition text-center flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <User size={13} /> {t('Tazama Akaunti & Mabaharia', 'View Account & Full Roster')}
                    </button>
                    <button
                      onClick={() => {
                        setIssueForm(prev => ({
                          ...prev,
                          supId: sup.id,
                          boatId: boat?.id || prev.boatId
                        }))
                        setIssueStep(1)
                        setIssueModalOpen(true)
                      }}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      title={t('Toa mafuta kwa boti hii', 'Issue fuel to this boat')}
                    >
                      <FuelIcon size={14} /> {t('Toa Mafuta', 'Issue Fuel')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW: FUEL STOCK & STORAGE TANKS */}
      {activeView === 'stock' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">{t('Stoo ya Mafuta & Matanki ya Kuhifadhia', 'Fuel Stock & Storage Dispensary Tanks')}</h3>
              <p className="text-xs text-slate-500 m-0">
                {t('Matanki ya mafuta kwa eneo, asilimia ya ujazo, bei ya pampu, na rekodi za kujaza.', 'Dispensary tanks by location, current capacity percentages, pump prices, and restock records.')}
              </p>
            </div>
            <button
              onClick={() => setPurchaseModalOpen(true)}
              className="btn-primary text-xs"
            >
              <Plus size={14} /> + {t('Sajili Manunuzi ya Mafuta', 'Record Fuel Purchase (Restock)')}
            </button>
          </div>

          {/* Tank Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tanks.map(tank => {
              const pct = Math.round(((tank.current || 0) / (tank.capacity || 5000)) * 100)
              const isPetrol = tank.fuel === 'Petrol'
              return (
                <div key={tank.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-slate-400 block">{tank.location}</span>
                        <h4 className="text-sm font-bold text-slate-900 m-0 mt-0.5">{tank.name}</h4>
                      </div>
                      <Badge variant={isPetrol ? 'amber' : 'blue'}>{isPetrol ? t('Petroli', 'Petrol') : t('Dizeli', 'Diesel')}</Badge>
                    </div>

                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-2xl font-black font-mono text-slate-900">{f(tank.current)}</span>
                      <span className="text-xs text-slate-500 font-medium">/ {f(tank.capacity)} L</span>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between text-[11px] mb-1 font-semibold">
                        <span className="text-slate-500">{t('Kipimo cha Tanki', 'Level Gauge')}</span>
                        <span className={pct < 20 ? 'text-red-600 font-bold' : 'text-slate-700'}>{pct}% {t('Imejaa', 'Full')}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct < 20
                              ? 'bg-red-500'
                              : isPetrol
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                : 'bg-gradient-to-r from-blue-500 to-blue-700'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{t('Bei ya Pampu:', 'Pump Sell Price:')}</span>
                    <b className="font-mono text-slate-900">TZS {f(tank.sellPrice)} / L</b>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tanks Table Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">{t('Stoo ya Mafuta kwa Eneo & Thamani', 'Fuel Stock by Location & Pump Valuation')}</h4>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Eneo', 'Location')}</th>
                    <th>{t('Jina la Tanki', 'Tank Name')}</th>
                    <th>{t('Aina ya Mafuta', 'Fuel Type')}</th>
                    <th>{t('Stoo (L)', 'Stock (L)')}</th>
                    <th>{t('Ujazo', 'Capacity')}</th>
                    <th>{t('Kiwango (%)', 'Level (%)')}</th>
                    <th>{t('Bei ya Kununua / L', 'Purchase Cost / L')}</th>
                    <th>{t('Bei ya Kuuzia / L', 'Selling Price / L')}</th>
                    <th>{t('Hali', 'Status')}</th>
                    <th className="text-right">{t('Vitendo', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tanks.map(tk => {
                    const pct = Math.round(((tk.current || 0) / (tk.capacity || 5000)) * 100)
                    return (
                      <tr key={tk.id}>
                        <td className="font-semibold text-slate-900">{tk.location}</td>
                        <td className="font-medium text-slate-800">{tk.name}</td>
                        <td><Badge variant={tk.fuel === 'Petrol' ? 'amber' : 'blue'}>{tk.fuel === 'Petrol' ? t('Petroli', 'Petrol') : t('Dizeli', 'Diesel')}</Badge></td>
                        <td className="font-mono font-bold text-slate-900">{f(tk.current)} L</td>
                        <td className="font-mono text-slate-500">{f(tk.capacity)} L</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs">{pct}%</span>
                            <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${pct < 20 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-xs">TZS {f(tk.buyPrice)}</td>
                        <td className="font-mono font-bold text-blue-900 text-xs">TZS {f(tk.sellPrice)}</td>
                        <td>
                          <Badge variant={pct < 20 ? 'red' : 'green'}>
                            {pct < 20 ? t('Inahitaji Kujazwa', 'Refill Required') : t('Sawa', 'Optimal')}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <ViewBtn onClick={() => setViewTank({ ...tk, pct })} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BULK FUEL SUPPLIER PURCHASES */}
      {activeView === 'purchases' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">{t('Manunuzi ya Mafuta kwa Jumla', 'Bulk Fuel Supplier Deliveries')}</h3>
              <p className="text-xs text-slate-500 m-0">
                {t('Mafuta yaliyopokelewa kutoka Lake Oil Ltd, Oryx Energies, na TotalEnergies.', 'Purchases received from Lake Oil Ltd, Oryx Energies, and TotalEnergies depots with delivery note verification.')}
              </p>
            </div>
            <button
              onClick={() => setPurchaseModalOpen(true)}
              className="btn-primary text-xs"
            >
              <Plus size={14} /> + {t('Sajili Manunuzi ya Mafuta', 'Record Fuel Purchase')}
            </button>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Manunuzi #', 'Purchase #')}</th>
                  <th>{t('Tarehe', 'Date')}</th>
                  <th>{t('Msambazaji wa Mafuta', 'Fuel Supplier')}</th>
                  <th>{t('Aina ya Mafuta', 'Fuel Type')}</th>
                  <th>{t('Kiasi (L)', 'Quantity (L)')}</th>
                  <th>{t('Bei / Lita', 'Purchase Price / L')}</th>
                  <th>{t('Jumla ya Gharama', 'Total Cost')}</th>
                  <th>{t('Hali ya Malipo', 'Payment Status')}</th>
                  <th>{t('Hati ya Kupokelea', 'Delivery Note')}</th>
                  <th className="text-right">{t('Vitendo', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono font-bold text-blue-900">{p.no}</td>
                    <td>{p.date}</td>
                    <td className="font-semibold text-slate-900">{p.supName || 'Lake Oil Ltd'}</td>
                    <td><Badge variant={p.fuel === 'Petrol' ? 'amber' : 'blue'}>{p.fuel === 'Petrol' ? t('Petroli', 'Petrol') : t('Dizeli', 'Diesel')}</Badge></td>
                    <td className="font-mono font-bold">{f(p.litres)} L</td>
                    <td className="font-mono text-xs">TZS {f(p.costPerL)}</td>
                    <td className="font-mono font-bold text-slate-900">{tzs(p.total)}</td>
                    <td>
                      <Badge variant={p.status === 'Paid' ? 'green' : p.status === 'Partial' ? 'amber' : 'blue'}>
                        {p.status === 'Paid' ? t('Imelipwa', 'Paid') : p.status === 'Partial' ? t('Nusu', 'Partial') : t('Inasubiri', 'Pending')}
                      </Badge>
                    </td>
                    <td className="font-mono text-xs text-blue-800 underline cursor-pointer">{p.docRef || 'DN-8891.pdf'}</td>
                    <td className="text-right">
                      <ViewBtn onClick={() => setViewFuelPurchase(p)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: CATCH & FUEL CROSS-SETTLEMENTS */}
      {activeView === 'settlements' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">{t('Makato ya Deni la Mafuta Kwenye Samaki', 'Catch & Fuel Cross-Settlement')}</h3>
              <p className="text-xs text-slate-500 m-0">
                {t('Makato ya moja kwa moja ya deni la mafuta mvuvi anapoleta samaki (Thamani ya Samaki - Deni la Mafuta = Malipo Halisi).', 'Automatic deduction of outstanding fuel debt when fishermen land fish batches (Fish Value - Fuel Debt = Net Payout).')}
              </p>
            </div>
            <button
              onClick={() => {
                setSettleStep(1)
                setSettlementModalOpen(true)
              }}
              className="btn-primary text-xs bg-amber-600 hover:bg-amber-500 font-bold"
            >
              <Plus size={14} /> + {t('Fanya Makato ya Samaki', 'Execute Catch Settlement')}
            </button>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Makato #', 'Settlement #')}</th>
                  <th>{t('Tarehe na Saa', 'Date & Time')}</th>
                  <th>{t('Mvuvi / Nahodha', 'Fisherman / Captain')}</th>
                  <th>{t('Thamani ya Samaki', 'Gross Fish Value')}</th>
                  <th>{t('Deni Lililokatwa', 'Fuel Debt Recovered')}</th>
                  <th>{t('Malipo Halisi kwa Mvuvi', 'Net Paid to Fisherman')}</th>
                  <th>{t('Njia ya Malipo', 'Disbursement Method')}</th>
                  <th>{t('Mzigo Husika', 'Linked Batch')}</th>
                  <th>{t('Maelezo', 'Notes')}</th>
                  <th className="text-right">{t('Vitendo', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map(item => {
                  const sup = suppliers.find(x => x.id === item.supId)
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="font-mono font-bold text-blue-900">{item.no}</td>
                      <td>
                        <span className="text-xs text-slate-800 block">{item.date}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{fmtT(item.at || item.date)}</span>
                      </td>
                      <td>
                        <b className="text-slate-900 block">{sup?.name || item.supId}</b>
                        <span className="text-[11px] text-slate-500 font-mono">{sup?.no || '-'}</span>
                      </td>
                      <td className="font-mono text-slate-800 font-semibold">{tzs(item.fishTotal)}</td>
                      <td className="font-mono text-red-600 font-bold">
                        -{tzs(item.fuelDeducted || 0)}
                      </td>
                      <td className="font-mono font-black text-emerald-700 text-sm">
                        {tzs(item.netPayable)}
                      </td>
                      <td>
                        <Badge variant="blue">{item.method}</Badge>
                      </td>
                      <td className="font-mono text-xs text-slate-600">{item.purId || '-'}</td>
                      <td className="text-xs text-slate-500 max-w-xs truncate">{item.notes}</td>
                      <td className="text-right">
                        <ViewBtn onClick={() => setViewSettlement({ ...item, supName: sup?.name || item.supId })} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewTank && (
        <DetailModal
          title={`${t('Taarifa za Tanki la Mafuta:', 'Fuel Tank Details:')} ${viewTank.name}`}
          subtitle={`${viewTank.location} · ${viewTank.fuel === 'Petrol' ? t('Petroli', 'Petrol') : t('Dizeli', 'Diesel')}`}
          badge={
            <Badge variant={viewTank.pct < 20 ? 'red' : 'green'}>
              {viewTank.pct < 20 ? t('Inahitaji Kujazwa', 'Refill Required') : t('Sawa', 'Optimal')}
            </Badge>
          }
          onClose={() => setViewTank(null)}
          fields={[
            { label: t('Eneo / Mwalo', 'Location'), value: viewTank.location },
            { label: t('Jina la Tanki', 'Tank Name'), value: viewTank.name },
            { label: t('Aina ya Mafuta', 'Fuel Type'), value: viewTank.fuel === 'Petrol' ? t('Petroli', 'Petrol') : t('Dizeli', 'Diesel') },
            { label: t('Kiwango Kilichopo', 'Fill Level'), value: `${viewTank.pct}%`, mono: true },
            { label: t('Stoo Iliyopo', 'Current Stock'), value: `${f(viewTank.current)} L`, mono: true, highlight: true },
            { label: t('Ujazo wa Tanki', 'Tank Capacity'), value: `${f(viewTank.capacity)} L`, mono: true },
            { label: t('Bei ya Kununua / Lita', 'Purchase Cost / L'), value: tzs(viewTank.buyPrice), mono: true },
            { label: t('Bei ya Kuuzia / Lita', 'Selling Price / L'), value: tzs(viewTank.sellPrice), mono: true, highlight: true },
          ]}
        />
      )}

      {viewFuelPurchase && (
        <DetailModal
          title={`${t('Manunuzi ya Mafuta:', 'Fuel Purchase Details:')} ${viewFuelPurchase.no}`}
          subtitle={`${viewFuelPurchase.supName || 'Lake Oil Ltd'} · ${viewFuelPurchase.date}`}
          badge={
            <Badge variant={viewFuelPurchase.status === 'Paid' ? 'green' : viewFuelPurchase.status === 'Partial' ? 'amber' : 'blue'}>
              {viewFuelPurchase.status === 'Paid' ? t('Imelipwa', 'Paid') : viewFuelPurchase.status === 'Partial' ? t('Nusu', 'Partial') : t('Inasubiri', 'Pending')}
            </Badge>
          }
          onClose={() => setViewFuelPurchase(null)}
          fields={[
            { label: t('Namba ya Manunuzi', 'Purchase #'), value: viewFuelPurchase.no, mono: true },
            { label: t('Tarehe', 'Date'), value: viewFuelPurchase.date, mono: true },
            { label: t('Msambazaji wa Mafuta', 'Fuel Supplier'), value: viewFuelPurchase.supName || 'Lake Oil Ltd' },
            { label: t('Aina ya Mafuta', 'Fuel Type'), value: viewFuelPurchase.fuel === 'Petrol' ? t('Petroli', 'Petrol') : t('Dizeli', 'Diesel') },
            { label: t('Kiasi Kilichonunuliwa', 'Quantity Purchased'), value: `${f(viewFuelPurchase.litres)} L`, mono: true },
            { label: t('Bei kwa Lita', 'Unit Cost / L'), value: tzs(viewFuelPurchase.costPerL), mono: true },
            { label: t('Jumla ya Gharama', 'Total Cost'), value: tzs(viewFuelPurchase.total), mono: true, highlight: true },
            { label: t('Hati ya Kupokelea', 'Delivery Note'), value: viewFuelPurchase.docRef || 'DN-8891.pdf', mono: true },
          ]}
        />
      )}

      {viewSettlement && (
        <DetailModal
          title={`${t('Taarifa za Makato ya Samaki:', 'Catch Settlement Details:')} ${viewSettlement.no}`}
          subtitle={`${viewSettlement.supName} · ${viewSettlement.date}`}
          badge={<Badge variant="blue">{viewSettlement.method}</Badge>}
          onClose={() => setViewSettlement(null)}
          fields={[
            { label: t('Namba ya Makato', 'Settlement #'), value: viewSettlement.no, mono: true },
            { label: t('Tarehe', 'Date'), value: viewSettlement.date, mono: true },
            { label: t('Mvuvi / Nahodha', 'Fisherman / Captain'), value: viewSettlement.supName },
            { label: t('Mzigo Husika', 'Linked Batch'), value: viewSettlement.purId || '-', mono: true },
            { label: t('Thamani ya Samaki', 'Gross Fish Value'), value: tzs(viewSettlement.fishTotal), mono: true },
            { label: t('Deni la Mafuta Lililokatwa', 'Fuel Debt Recovered'), value: `-${tzs(viewSettlement.fuelDeducted || 0)}`, mono: true },
            { label: t('Malipo Halisi kwa Mvuvi', 'Net Paid to Fisherman'), value: tzs(viewSettlement.netPayable), mono: true, highlight: true },
            { label: t('Njia ya Malipo', 'Disbursement Method'), value: viewSettlement.method },
            { label: t('Maelezo', 'Notes'), value: viewSettlement.notes || '-', fullWidth: true },
          ]}
        />
      )}

      {/* VIEW: REPORTS & MARGIN ANALYTICS */}
      {activeView === 'reports' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">{t('Ripoti za Mafuta & Uchambuzi wa Faida', 'Fuel Reports & Profit Margin Analytics')}</h3>
              <p className="text-xs text-slate-500 m-0">
                {t('Lita zilizotolewa kwa wiki, mapato ya mauzo ya mafuta, na faida ya pampu.', 'Weekly litres issued, gross sales revenue, pump margins, and automated reconciliation reports.')}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
              {['This Month', 'Last 3 Months', 'Custom'].map(period => (
                <button
                  key={period}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    period === 'This Month' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {period === 'This Month' ? t('Mwezi Huu', 'This Month') : period === 'Last 3 Months' ? t('Miezi 3 Iliyopita', 'Last 3 Months') : t('Maalum', 'Custom')}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('Jumla ya Mafuta Yaliyotolewa', 'Total Fuel Issued')}</span>
                <b className="text-2xl font-black font-mono text-slate-900 mt-1 block">12,500 L</b>
                <span className="text-[11px] text-emerald-600 font-medium">↑ +14% {t('kuliko mwezi uliopita', 'vs last month')}</span>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-800 rounded-xl">
                <FuelIcon size={22} />
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('Thamani ya Mauzo ya Mafuta', 'Fuel Sales Value')}</span>
                <b className="text-2xl font-black font-mono text-emerald-700 mt-1 block">TZS 40.0M</b>
                <span className="text-[11px] text-slate-500">{t('Jumla ya mapato yaliyotozwa', 'Gross revenue invoiced')}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                <DollarSign size={22} />
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">{t('Faida Halisi ya Mafuta', 'Net Fuel Margin')}</span>
                <b className="text-2xl font-black font-mono text-amber-700 mt-1 block">TZS 3.8M</b>
                <span className="text-[11px] text-amber-600 font-medium">9.5% {t('faida ghafi', 'gross profit margin')}</span>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>

          {/* Weekly Fuel Issued Trend (Litres) Bar Chart */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 m-0">{t('Mwenendo wa Mafuta Yaliyotolewa (Lita)', 'Fuel Issued Trend (Litres)')}</h4>
                <span className="text-xs text-slate-500">{t('Mgawanyo wa kila wiki kwa Petroli & Dizeli', 'Weekly breakdown by Petrol & Diesel')}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> {t('Petroli', 'Petrol')}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> {t('Dizeli', 'Diesel')}</span>
              </div>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={val => `${f(val)} L`} />
                  <Bar dataKey="petrol" fill="#f59e0b" radius={[4, 4, 0, 0]} name={t('Petroli', 'Petrol')} />
                  <Bar dataKey="diesel" fill="#2563eb" radius={[4, 4, 0, 0]} name={t('Dizeli', 'Diesel')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Report Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: t('Ripoti ya Utoaji Mafuta', 'Fuel Issue Report'),
                desc: t('Daftari la kila siku la lita zilizotolewa kwa boti', 'Daily log of litres issued to fishing vessels & thermal vouchers'),
                action: () => setActiveView('issue')
              },
              {
                title: t('Ripoti ya Mikopo ya Wavuvi & Mabaharia', 'Fisherman Credit & Crew Report'),
                desc: t('Madeni yanayodaiwa, taarifa za boti na mabaharia', 'Outstanding balances, boat specs & registered crew rosters'),
                action: () => setActiveView('accounts')
              },
              {
                title: t('Ripoti ya Stoo & Matanki', 'Fuel Stock & Tanks Report'),
                desc: t('Vipimo vya matanki na uhakiki wa stoo', 'Readings, tank dips, and location reconciliation'),
                action: () => setActiveView('stock')
              },
              {
                title: t('Uchambuzi wa Faida ya Mafuta', 'Fuel Margin & Profitability'),
                desc: t('Ulinganisho wa bei ya kununua na kuuza (TZS 350/L)', 'Cost vs selling price analysis, margin per litre (TZS 350/L)'),
                action: () => setMarginModalOpen(true)
              }
            ].map(r => (
              <button
                key={r.title}
                onClick={r.action}
                className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-blue-500 hover:shadow-sm transition text-left"
              >
                <div>
                  <b className="text-xs text-slate-900 block">{r.title}</b>
                  <span className="text-[11px] text-slate-500">{r.desc}</span>
                </div>
                <ChevronRight size={16} className="text-blue-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. MODAL: ISSUE FUEL (DAILY) */}
      {issueModalOpen && (
        <Modal
          title={issueStep === 3 ? t('Risiti ya Mafuta', 'Fuel Issue Receipt') : t('Toa Mafuta kwa Boti ya Uvuvi', 'Issue Fuel to Fishing Boat')}
          subtitle={issueStep === 3 ? t('FishTrade ERP · Kituo cha Mafuta Mwalo', 'FishTrade ERP · Dock Dispensary') : `${t('Hatua ya', 'Step')} ${issueStep} / 2`}
          close={() => {
            setIssueModalOpen(false)
            setIssueStep(1)
          }}
        >
          {/* STEP 1: DETAILS */}
          {issueStep === 1 && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('Mvuvi / Nahodha *', 'Fisherman / Captain *')}>
                  <select
                    value={issueForm.supId}
                    onChange={e => handleIssueSupChange(e.target.value)}
                    className="input-field font-semibold"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.no}) · {s.boat || t('Boti', 'Boat')}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={t('Boti / Chombo *', 'Boat / Vessel *')}>
                  <select
                    value={issueForm.boatId}
                    onChange={e => setIssueForm({ ...issueForm, boatId: e.target.value })}
                    className="input-field font-mono font-bold"
                  >
                    {boats.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.regNo}) · {b.captain}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('Aina ya Mafuta & Tanki *', 'Fuel Type & Dispensary Tank *')}>
                  <select
                    value={issueForm.tankId}
                    onChange={e => handleIssueTankChange(e.target.value)}
                    className="input-field"
                  >
                    {tanks.map(tk => (
                      <option key={tk.id} value={tk.id}>
                        {tk.fuel === 'Petrol' ? t('Petroli', 'Petrol') : t('Dizeli', 'Diesel')} ({tk.name} - {tk.location}) · TZS {f(tk.sellPrice)}/L
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label={t('Kiasi (Lita) *', 'Quantity (Litres) *')}>
                    <input
                      type="number"
                      value={issueForm.litres}
                      onChange={e => setIssueForm({ ...issueForm, litres: e.target.value })}
                      className="input-field font-mono font-bold"
                    />
                  </Field>
                  <Field label={t('Bei / Lita (TZS) *', 'Price / Litre (TZS) *')}>
                    <input
                      type="number"
                      value={issueForm.price}
                      onChange={e => setIssueForm({ ...issueForm, price: e.target.value })}
                      className="input-field font-mono"
                    />
                  </Field>
                </div>
              </div>

              {/* Total Amount Green Card */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg">
                    <FuelIcon size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-800 font-semibold block uppercase">{t('Jumla ya Gharama', 'Total Amount')}</span>
                    <b className="text-xl font-black font-mono text-emerald-950">{tzs(issueTotal)}</b>
                  </div>
                </div>
                <span className="text-xs text-emerald-700 font-medium">
                  {issueForm.litres} L @ TZS {f(issueForm.price)}
                </span>
              </div>

              {/* Payment Arrangement Selector */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-1.5">{t('Utaratibu wa Malipo', 'Payment Arrangement')}</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Cash', label: t('Taslimu', 'Cash') },
                    { id: 'Partial', label: t('Nusu', 'Partial') },
                    { id: 'By Fish Delivery', label: t('Kwa Samaki', 'By Fish Delivery') },
                    { id: 'End of Season', label: t('Mwisho wa Msimu', 'End of Season') }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setIssueForm({ ...issueForm, arrangement: opt.id })}
                      className={`py-2 px-1.5 rounded-lg border text-center text-xs font-bold transition ${
                        issueForm.arrangement === opt.id
                          ? 'border-blue-900 bg-blue-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIssueStep(2)}
                  disabled={!(+issueForm.litres > 0)}
                  className="btn-primary"
                >
                  {t('Endelea: Malipo', 'Next: Payment')} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT DETAILS & CONFIRMATION */}
          {issueStep === 2 && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-600 font-semibold">{t('Jumla ya Gharama', 'Total Amount')}</span>
                <b className="text-base font-mono font-bold text-slate-900">{tzs(issueTotal)}</b>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('Kiasi Kinacholipwa Sasa (TZS) *', 'Amount Paid Now (TZS) *')}>
                  <input
                    type="number"
                    value={issueForm.paid}
                    onChange={e => setIssueForm({ ...issueForm, paid: e.target.value })}
                    className="input-field font-mono font-bold text-base"
                  />
                </Field>
                <div className="flex flex-col justify-center">
                  <span className="text-xs text-slate-500 font-semibold">{t('Deni Linalobaki (Otomatiki)', 'Outstanding Debt (Auto)')}</span>
                  <b className="text-lg font-mono font-black text-red-600 mt-1">{tzs(issueOutstanding)}</b>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-blue-950 block">{t('Hatua hii itafanya:', 'This will:')}</span>
                <div className="space-y-1.5 text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>{t(`Punguza lita ${issueForm.litres} kutoka kwenye stoo ya mafuta`, `Deduct ${issueForm.litres} litres from fuel stock`)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>{t(`Ongeza ${tzs(issueTotal)} kwenye akaunti ya mafuta ya ${selectedSupObj?.name}`, `Add ${tzs(issueTotal)} to ${selectedSupObj?.name}'s fuel account`)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>{t(`Rekodi ${tzs(issuePaid)} kama malipo yaliyopokelewa`, `Record ${tzs(issuePaid)} as payment received`)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>{t(`Acha deni la ${tzs(issueOutstanding)}`, `Leave ${tzs(issueOutstanding)} outstanding`)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setIssueStep(1)}
                  className="btn-secondary"
                >
                  {t('Rudi', 'Back')}
                </button>
                <button
                  type="button"
                  onClick={submitIssueFuel}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  <Check size={16} /> {t('Thibitisha & Toa Mafuta', 'Record Fuel Issue')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FUEL ISSUE RECEIPT */}
          {issueStep === 3 && receiptRecord && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2 font-mono">
                <div className="text-center pb-2 border-b border-slate-200">
                  <b className="text-base font-bold text-blue-950 font-sans block">AquaCatch · FishTrade ERP</b>
                  <span className="text-xs text-slate-500 font-sans">Mwanza Fish Trading Co. Ltd.</span>
                  <div className="mt-1">
                    <Badge variant="green">{t('Imerekodiwa', 'Recorded')}</Badge>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Namba ya Risiti', 'Receipt No.')}</span>
                    <b className="text-slate-900">{receiptRecord.no}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Tarehe na Saa', 'Date & Time')}</span>
                    <span className="text-slate-800">{receiptRecord.date}, {receiptRecord.time || '08:32'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Mvuvi / Nahodha', 'Fisherman / Captain')}</span>
                    <b className="text-slate-900 font-sans">{receiptRecord.supName} ({receiptRecord.supNo})</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Boti / Namba', 'Boat / Reg')}</span>
                    <b className="text-slate-900">{receiptRecord.boatReg}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Aina ya Mafuta', 'Fuel Type')}</span>
                    <span className="text-slate-900">{receiptRecord.fuel === 'Petrol' ? t('Petroli', 'Petrol') : t('Dizeli', 'Diesel')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Kiasi', 'Quantity')}</span>
                    <b className="text-slate-900">{receiptRecord.litres} {t('Lita', 'Litres')}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Bei / Lita', 'Price / Litre')}</span>
                    <span>TZS {f(receiptRecord.price)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-sm">
                    <span className="text-slate-900">{t('Jumla ya Gharama', 'Total Amount')}</span>
                    <span className="text-slate-950">{tzs(receiptRecord.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Imelipwa Sasa', 'Paid Now')}</span>
                    <span className="text-emerald-700 font-bold">{tzs(receiptRecord.paid)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                    <span className="text-red-700">{t('Deni Lililobaki', 'Outstanding Balance')}</span>
                    <span className="text-red-700">{tzs(receiptRecord.balance)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 text-[11px] text-slate-500">
                    <span>{t('Imetolewa Na', 'Issued By')}</span>
                    <span>{receiptRecord.issuedBy}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Share, Print, Done */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => alert(t(`Maelezo ya risiti ${receiptRecord.no} yamenakiliwa!`, `Receipt ${receiptRecord.no} details copied to clipboard!`))}
                  className="btn-secondary text-xs flex items-center justify-center gap-1"
                >
                  <Share2 size={13} /> {t('Tuma', 'Share')}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-secondary text-xs flex items-center justify-center gap-1"
                >
                  <Printer size={13} /> {t('Chapa', 'Print')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIssueModalOpen(false)
                    setIssueStep(1)
                  }}
                  className="btn-primary text-xs flex items-center justify-center gap-1"
                >
                  <Check size={13} /> {t('Maliza', 'Done')}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* 5. MODAL: OPERATOR CREATES FISHERMAN ACCOUNT & BOAT & ASSIGNED CREW ROSTER */}
      {createAccountModal && (
        <Modal
          title={t('Sajili Mvuvi, Boti & Mabaharia', 'Operator: Onboard Fisherman & Vessel Account')}
          subtitle={t('Usajili wa Kituo cha Mwalo · Taarifa za Nahodha, Boti & Mabaharia', 'Landing Site Operator Registration · Captain KYC, Vessel Profile & Crew Members Roster')}
          close={() => setCreateAccountModal(false)}
        >
          <div className="flex flex-col gap-4 text-xs">
            {/* Operator Stamp */}
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between">
              <span className="font-semibold">{t('Mhudumu: Afisa wa Kituo cha Mwalo (Staff 01)', 'Operator: Landing Station Officer (Staff 01)')}</span>
              <span className="font-mono text-[11px]">{new Date().toLocaleDateString('en-GB')}</span>
            </div>

            {/* 1. Captain / Fisherman Profile */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                {t('1. Taarifa za Nahodha & Mmiliki wa Akaunti', '1. Captain & Account Holder Information')}
              </span>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('Jina Kamili la Mvuvi / Nahodha *', 'Fisherman / Captain Full Name *')}>
                  <input
                    type="text"
                    placeholder={t('mf. Mzee Juma', 'e.g. Mzee Juma')}
                    value={operatorForm.name}
                    onChange={e => setOperatorForm({ ...operatorForm, name: e.target.value })}
                    className="input-field font-bold"
                  />
                </Field>
                <Field label={t('Namba ya Simu (M-Pesa) *', 'Phone Number (M-Pesa Registered) *')}>
                  <input
                    type="tel"
                    placeholder="0754 123 456"
                    value={operatorForm.phone}
                    onChange={e => setOperatorForm({ ...operatorForm, phone: e.target.value })}
                    className="input-field font-mono"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <Field label={t('Kitambulisho cha Taifa (NIDA)', 'National ID (NIDA)')}>
                  <input
                    type="text"
                    placeholder="19820514-XXXXX"
                    value={operatorForm.nida}
                    onChange={e => setOperatorForm({ ...operatorForm, nida: e.target.value })}
                    className="input-field font-mono"
                  />
                </Field>
                <Field label={t('Kituo / Mwalo (BMU)', 'Landing BMU Station')}>
                  <select
                    value={operatorForm.site}
                    onChange={e => setOperatorForm({ ...operatorForm, site: e.target.value })}
                    className="input-field font-medium"
                  >
                    <option>Kigoma (Katonga BMU)</option>
                    <option>Mwanza (Kirumba Mwaloni)</option>
                    <option>Musoma (Mwigobero)</option>
                    <option>Ukerewe (Nansio)</option>
                  </select>
                </Field>
                <Field label={t('Kikomo cha Mkopo (TZS)', 'Credit Limit (TZS)')}>
                  <input
                    type="number"
                    value={operatorForm.creditLimit}
                    onChange={e => setOperatorForm({ ...operatorForm, creditLimit: e.target.value })}
                    className="input-field font-mono font-bold"
                  />
                </Field>
              </div>
            </div>

            {/* 2. Vessel Profile */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                {t('2. Taarifa za Boti ya Uvuvi', '2. Registered Fishing Vessel (Boat) Specifications')}
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label={t('Jina la Boti *', 'Boat Name *')}>
                  <input
                    type="text"
                    placeholder="e.g. MV Furaha"
                    value={operatorForm.boatName}
                    onChange={e => setOperatorForm({ ...operatorForm, boatName: e.target.value })}
                    className="input-field font-bold"
                  />
                </Field>
                <Field label={t('Namba ya Usajili (TZN-XXX) *', 'Registration # (TZN-XXX) *')}>
                  <input
                    type="text"
                    placeholder="e.g. TZN-304"
                    value={operatorForm.boatReg}
                    onChange={e => setOperatorForm({ ...operatorForm, boatReg: e.target.value })}
                    className="input-field font-mono font-bold"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label={t('Aina ya Injini', 'Engine Specifications')}>
                  <input
                    type="text"
                    value={operatorForm.engine}
                    onChange={e => setOperatorForm({ ...operatorForm, engine: e.target.value })}
                    className="input-field"
                  />
                </Field>
                <Field label={t('Muundo na Urefu wa Boti', 'Hull Construction & Length')}>
                  <input
                    type="text"
                    value={operatorForm.boatType}
                    onChange={e => setOperatorForm({ ...operatorForm, boatType: e.target.value })}
                    className="input-field"
                  />
                </Field>
              </div>
            </div>

            {/* 3. Assigned Crew Members Roster */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-950 uppercase tracking-wider block">
                    {t('3. Mabaharia wa Boti (Chini ya Nahodha)', '3. Assigned Boat Crew Members (Under Captain)')}
                  </span>
                  <span className="text-[11px] text-blue-800">
                    {t(`Sajili mabaharia wote wanaofanya kazi na Nahodha ${operatorForm.name || 'Mmiliki'}.`, `Register all crew members subordinate to Captain ${operatorForm.name || 'Owner'}.`)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCrewInput}
                  className="px-2.5 py-1 rounded bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  <Plus size={13} /> + {t('Ongeza Baharia', 'Add Crew Member')}
                </button>
              </div>

              <div className="space-y-2">
                {operatorForm.crewMembers.map((member, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-lg border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">{t('Jina la Baharia', 'Member Name')}</span>
                      <input
                        type="text"
                        placeholder="e.g. Hamisi Juma"
                        value={member.name}
                        onChange={e => handleUpdateCrewField(idx, 'name', e.target.value)}
                        className="input-field text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">{t('Wadhifa Kwenye Boti', 'Vessel Role')}</span>
                      <select
                        value={member.role}
                        onChange={e => handleUpdateCrewField(idx, 'role', e.target.value)}
                        className="input-field text-xs"
                      >
                        <option>First Mate / Net Handler</option>
                        <option>Engine Operator &amp; Mechanic</option>
                        <option>Deep Water Line Fisher</option>
                        <option>Boat Steersman / Navigator</option>
                        <option>Deck Hand / Ice Loader</option>
                        <option>Light Operator (Dagaa Night Fishing)</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">{t('Simu / NIDA', 'Phone / NIDA')}</span>
                        {operatorForm.crewMembers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCrewInput(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            {t('Ondoa', 'Remove')}
                          </button>
                        )}
                      </div>
                      <input
                        type="tel"
                        placeholder="0754 000 000"
                        value={member.phone}
                        onChange={e => handleUpdateCrewField(idx, 'phone', e.target.value)}
                        className="input-field text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateAccountModal(false)}
                className="btn-secondary"
              >
                {t('Ghairi', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={submitOperatorCreateAccount}
                disabled={!operatorForm.name.trim()}
                className="btn-primary bg-blue-900 hover:bg-blue-800 font-bold"
              >
                <Check size={16} /> {t('Thibitisha & Sajili Akaunti', 'Confirm & Register Account')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. MODAL: DETAILED FISHERMAN ACCOUNT WITH CREW MEMBERS & FULL LEDGER */}
      {selectedFisherman && (() => {
        const statement = supAccountStatement(s, selectedFisherman.id)
        const boat = boats.find(b => b.ownerId === selectedFisherman.id)
        const crewList = boat?.crewMembers || []
        const supIssues = issues.filter(x => x.supId === selectedFisherman.id)
        const supBatches = s.batches.filter(b => b.sup === selectedFisherman.id)
        const supSettlements = settlements.filter(st => st.supId === selectedFisherman.id)

        return (
          <Modal
            title={t('Wasifu wa Akaunti ya Mvuvi', 'Fisherman Account Profile')}
            subtitle={`${selectedFisherman.name} · ${selectedFisherman.no}`}
            close={() => setSelectedFisherman(null)}
          >
            <div className="flex flex-col gap-4 text-xs">
              {/* Header Profile Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-900 text-white font-black text-lg flex items-center justify-center">
                    {selectedFisherman.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 m-0">{selectedFisherman.name}</h3>
                      <Badge variant="green">{t('Akaunti Hai', 'Active Account')}</Badge>
                    </div>
                    <span className="text-xs text-slate-500 font-mono block mt-0.5">
                      {selectedFisherman.no} · {t('Nahodha & Mmiliki wa Boti', 'Captain & Boat Owner')}
                    </span>
                    <span className="text-[11px] text-slate-400 block">{selectedFisherman.site}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">{t('Boti Iliyosajiliwa', 'Registered Vessel')}</span>
                  <b className="text-sm font-mono text-slate-900">{boat?.name || 'MV Furaha'} ({boat?.regNo || 'TZN-304'})</b>
                </div>
              </div>

              {/* 3 Metric Chips */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-red-700 block">{t('Deni la Mafuta', 'Fuel Debt')}</span>
                  <b className="text-base font-mono font-bold text-red-700">{tzs(statement.fuelDebt)}</b>
                </div>

                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">{t('Samaki Walioletwa', 'Fish Delivered')}</span>
                  <b className="text-base font-mono font-bold text-blue-900">{f(selectedFisherman.totalSupplied || 4200)} kg</b>
                  <span className="text-[10px] text-slate-400 block">{t('Mwezi huu', 'This month')}</span>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">{t('Salio Halisi', 'Net Position')}</span>
                  <b className="text-base font-mono font-bold text-amber-900">
                    {statement.netBalance < 0 ? `${tzs(Math.abs(statement.netBalance))} ${t('Deni', 'Owed')}` : tzs(statement.netBalance)}
                  </b>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-slate-200 flex items-center gap-3 overflow-x-auto">
                {[
                  { id: 'crew', label: `${t('Mabaharia wa Boti', 'Boat Crew Members')} (${crewList.length})` },
                  { id: 'activity', label: t('Miamala ya Akaunti', 'Account Activity') },
                  { id: 'fuel', label: t('Historia ya Mafuta', 'Fuel Issues History') },
                  { id: 'fish', label: t('Samaki Walioletwa', 'Fish Catches Landed') },
                  { id: 'settlements', label: `${t('Makato ya Samaki', 'Settlement Vouchers')} (${supSettlements.length})` }
                ].map(tb => (
                  <button
                    key={tb.id}
                    onClick={() => setFishermanTab(tb.id)}
                    className={`pb-2 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                      fishermanTab === tb.id ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tb.label}
                  </button>
                ))}
              </div>

              {/* TAB: CREW MEMBERS */}
              {fishermanTab === 'crew' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <b className="text-xs text-slate-900 block">{t('Boti:', 'Vessel:')} {boat?.name || 'MV Furaha'} ({boat?.regNo || 'TZN-304'})</b>
                      <span className="text-[11px] text-slate-500">{t('Nahodha:', 'Captain / Vessel Master:')} {boat?.captain || selectedFisherman.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAddCrewModal(boat, selectedFisherman)}
                      className="btn-primary text-xs flex items-center gap-1"
                    >
                      <Plus size={13} /> + {t('Ongeza Baharia', 'Add Crew Member')}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {crewList.map((c, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs">
                            {c.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <b className="text-xs text-slate-900">{c.name}</b>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                                {c.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                              {t('Simu:', 'Phone:')} {c.phone || '-'} · NIDA: {c.nida || t('Imethibitishwa', 'Verified')}
                            </span>
                          </div>
                        </div>
                        <Badge variant="green">{t('Baharia Halali', 'Authorized Crew')}</Badge>
                      </div>
                    ))}
                    {crewList.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        {t('Hakuna mabaharia waliosajiliwa bado. Bofya "+ Ongeza Baharia".', 'No additional crew registered yet. Click "+ Add Crew Member" to assign crew to this vessel.')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: ACCOUNT ACTIVITY */}
              {fishermanTab === 'activity' && (
                <div className="data-table-wrap max-h-56">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Tarehe', 'Date')}</th>
                        <th>{t('Maelezo', 'Description')}</th>
                        <th>{t('Deni (TZS)', 'Debit (TZS)')}</th>
                        <th>{t('Malipo (TZS)', 'Credit (TZS)')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supIssues.map(it => (
                        <tr key={it.id}>
                          <td className="font-mono text-xs">{it.date}</td>
                          <td>{t('Mafuta', 'Fuel Issue')} ({it.litres} L {it.fuel})</td>
                          <td className="font-mono text-red-600 font-bold">{tzs(it.total)}</td>
                          <td className="font-mono text-slate-400">-</td>
                        </tr>
                      ))}
                      {(s.fuelPayments || []).filter(p => p.supId === selectedFisherman.id).map(p => (
                        <tr key={p.id}>
                          <td className="font-mono text-xs">{p.date}</td>
                          <td>{t('Malipo ya Taslimu', 'Cash Payment')} ({p.m})</td>
                          <td className="font-mono text-slate-400">-</td>
                          <td className="font-mono text-emerald-700 font-bold">{tzs(p.amt)}</td>
                        </tr>
                      ))}
                      {supSettlements.map(st => (
                        <tr key={st.id}>
                          <td className="font-mono text-xs">{st.date}</td>
                          <td>{t('Makato ya Samaki', 'Catch Settlement Deduction')} ({st.no})</td>
                          <td className="font-mono text-slate-400">-</td>
                          <td className="font-mono text-emerald-700 font-bold">{tzs(st.fuelDeducted)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: FUEL ISSUES HISTORY */}
              {fishermanTab === 'fuel' && (
                <div className="data-table-wrap max-h-56">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Risiti #', 'Receipt #')}</th>
                        <th>{t('Tarehe', 'Date')}</th>
                        <th>{t('Lita', 'Litres')}</th>
                        <th>{t('Jumla', 'Total')}</th>
                        <th>{t('Imelipwa', 'Paid')}</th>
                        <th>{t('Utaratibu', 'Arrangement')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supIssues.map(it => (
                        <tr key={it.id}>
                          <td className="font-mono font-bold text-blue-900">{it.no}</td>
                          <td>{it.date}</td>
                          <td className="font-mono">{it.litres} L</td>
                          <td className="font-mono font-bold">{tzs(it.total)}</td>
                          <td className="font-mono text-emerald-700">{tzs(it.paid)}</td>
                          <td><Badge variant="blue">{it.arrangement}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: FISH CATCHES */}
              {fishermanTab === 'fish' && (
                <div className="data-table-wrap max-h-56">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Mzigo #', 'Batch #')}</th>
                        <th>{t('Tarehe', 'Date')}</th>
                        <th>{t('Aina ya Samaki', 'Species')}</th>
                        <th>{t('Uzito', 'Weight')}</th>
                        <th>{t('Thamani', 'Purchase Value')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supBatches.map(b => (
                        <tr key={b.id}>
                          <td className="font-mono font-bold text-blue-900">{b.no}</td>
                          <td>{b.date}</td>
                          <td>{spLabel(b.sp)}</td>
                          <td className="font-mono font-bold">{f(b.kg)} kg</td>
                          <td className="font-mono text-slate-900 font-bold">{tzs(b.kg * b.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: SETTLEMENTS */}
              {fishermanTab === 'settlements' && (
                <div className="data-table-wrap max-h-56">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Makato #', 'Settlement #')}</th>
                        <th>{t('Tarehe', 'Date')}</th>
                        <th>{t('Thamani ya Samaki', 'Fish Value')}</th>
                        <th>{t('Mafuta Yaliyokatwa', 'Fuel Deducted')}</th>
                        <th>{t('Malipo Halisi', 'Net Paid')}</th>
                        <th>{t('Njia', 'Method')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supSettlements.map(st => (
                        <tr key={st.id}>
                          <td className="font-mono font-bold text-blue-900">{st.no}</td>
                          <td>{st.date}</td>
                          <td className="font-mono">{tzs(st.fishTotal)}</td>
                          <td className="font-mono text-red-600 font-bold">-{tzs(st.fuelDeducted)}</td>
                          <td className="font-mono text-emerald-700 font-bold">{tzs(st.netPayable)}</td>
                          <td><Badge variant="blue">{st.method}</Badge></td>
                        </tr>
                      ))}
                      {supSettlements.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-slate-400">
                            {t('Hakuna makato ya samaki yaliyorekodiwa bado.', 'No cross-settlement vouchers recorded for this fisherman yet.')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900">
                  {t('Jumla ya Deni la Mafuta:', 'Total Outstanding Fuel Debt:')} <b className="font-mono text-red-600">{tzs(statement.fuelDebt)}</b>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFisherman(null)}
                  className="btn-secondary text-xs"
                >
                  {t('Funga', 'Close')}
                </button>
              </div>
            </div>
          </Modal>
        )
      })()}

      {/* 7. MODAL: ADD CREW MEMBER TO BOAT */}
      {newCrewModal && (
        <Modal
          title={t('Ongeza Baharia Kwenye Boti', 'Add Crew Member to Vessel')}
          subtitle={`${t('Inapangiwa', 'Assigning to')} ${selectedBoatForCrew?.name || t('Boti', 'Vessel')} (${selectedBoatForCrew?.regNo || 'TZN-XXX'})`}
          close={() => setNewCrewModal(false)}
        >
          <div className="flex flex-col gap-3 text-xs">
            <Field label={t('Jina Kamili la Baharia *', 'Crew Member Full Name *')}>
              <input
                type="text"
                placeholder="e.g. Bakari Ally"
                value={newCrew.name}
                onChange={e => setNewCrew({ ...newCrew, name: e.target.value })}
                className="input-field font-bold"
              />
            </Field>

            <Field label={t('Wadhifa Kwenye Boti *', 'Role on Vessel *')}>
              <select
                value={newCrew.role}
                onChange={e => setNewCrew({ ...newCrew, role: e.target.value })}
                className="input-field font-medium"
              >
                <option>First Mate / Net Handler</option>
                <option>Engine Operator &amp; Mechanic</option>
                <option>Deep Water Line Fisher</option>
                <option>Boat Steersman / Navigator</option>
                <option>Deck Hand / Ice Loader</option>
                <option>Light Operator (Dagaa Night Fishing)</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label={t('Namba ya Simu (M-Pesa)', 'Phone Number (M-Pesa)')}>
                <input
                  type="tel"
                  placeholder="0754 123 456"
                  value={newCrew.phone}
                  onChange={e => setNewCrew({ ...newCrew, phone: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
              <Field label={t('Kitambulisho cha Taifa (NIDA)', 'National ID (NIDA)')}>
                <input
                  type="text"
                  placeholder="19920518-XXXXX"
                  value={newCrew.nida}
                  onChange={e => setNewCrew({ ...newCrew, nida: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <Field label={t('Mtu wa Karibu (Dharura Ziwani)', 'Next of Kin Contact (Safety at Lake)')}>
              <input
                type="text"
                placeholder={t('Jina na Simu (mf. Asha Ally - 0714 000 111)', 'Name & Phone (e.g. Asha Ally - 0714 000 111)')}
                value={newCrew.kin}
                onChange={e => setNewCrew({ ...newCrew, kin: e.target.value })}
                className="input-field"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNewCrewModal(false)}
                className="btn-secondary"
              >
                {t('Ghairi', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={submitAddCrewToExistingBoat}
                disabled={!newCrew.name.trim()}
                className="btn-primary"
              >
                {t('Hifadhi Baharia', 'Save Crew Member')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 8. MODAL: FUEL PURCHASE (FROM SUPPLIER) */}
      {purchaseModalOpen && (
        <Modal
          title={t('Manunuzi ya Mafuta (Kutoka kwa Msambazaji)', 'Fuel Purchase (From Bulk Supplier)')}
          subtitle={t('Kupokea mafuta ya jumla kwenye matanki ya kampuni', 'Bulk delivery intake into company storage dispensary tanks')}
          close={() => setPurchaseModalOpen(false)}
        >
          <div className="flex flex-col gap-4 text-xs">
            <Field label={t('Msambazaji wa Mafuta *', 'Fuel Supplier *')}>
              <select
                value={purchaseForm.supName}
                onChange={e => setPurchaseForm({ ...purchaseForm, supName: e.target.value })}
                className="input-field font-bold"
              >
                <option>Lake Oil Ltd</option>
                <option>Oryx Energies Tanzania Ltd</option>
                <option>TotalEnergies Lake Zone Depot</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Tarehe ya Manunuzi', 'Purchase Date')}>
                <input
                  type="text"
                  value={purchaseForm.date}
                  onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                  className="input-field font-medium"
                />
              </Field>
              <Field label={t('Tanki la Kuhifadhia', 'Destination Tank')}>
                <select
                  value={purchaseForm.tankId}
                  onChange={e => {
                    const tk = tanks.find(x => x.id === e.target.value)
                    setPurchaseForm({
                      ...purchaseForm,
                      tankId: e.target.value,
                      fuel: tk?.fuel || 'Petrol'
                    })
                  }}
                  className="input-field font-medium"
                >
                  {tanks.map(tk => (
                    <option key={tk.id} value={tk.id}>
                      {tk.name} ({tk.location})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Kiasi (Lita) *', 'Quantity (Litres) *')}>
                <input
                  type="number"
                  value={purchaseForm.litres}
                  onChange={e => setPurchaseForm({ ...purchaseForm, litres: e.target.value })}
                  className="input-field font-mono font-bold"
                />
              </Field>
              <Field label={t('Bei ya Kununulia / Lita (TZS) *', 'Purchase Price / Litre (TZS) *')}>
                <input
                  type="number"
                  value={purchaseForm.costPerL}
                  onChange={e => setPurchaseForm({ ...purchaseForm, costPerL: e.target.value })}
                  className="input-field font-mono"
                />
              </Field>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 font-semibold block uppercase">{t('Jumla ya Gharama', 'Total Cost')}</span>
                <b className="text-lg font-black font-mono text-emerald-950">
                  {tzs((+purchaseForm.litres || 0) * (+purchaseForm.costPerL || 0))}
                </b>
              </div>
              <Badge variant="blue">{purchaseForm.fuel === 'Petrol' ? t('Petroli', 'Petrol') : t('Dizeli', 'Diesel')}</Badge>
            </div>

            <Field label={t('Hali ya Malipo', 'Payment Status')}>
              <div className="grid grid-cols-3 gap-2">
                {['Paid', 'Partial', 'Pending'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPurchaseForm({ ...purchaseForm, status: st })}
                    className={`py-1.5 rounded-lg border text-center text-xs font-bold transition ${
                      purchaseForm.status === st ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {st === 'Paid' ? t('Imelipwa', 'Paid') : st === 'Partial' ? t('Nusu', 'Partial') : t('Inasubiri', 'Pending')}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t('Namba ya Hati ya Kupokelea', 'Delivery Note Reference')}>
              <input
                type="text"
                value={purchaseForm.docRef}
                onChange={e => setPurchaseForm({ ...purchaseForm, docRef: e.target.value })}
                className="input-field font-mono"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPurchaseModalOpen(false)}
                className="btn-secondary"
              >
                {t('Ghairi', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={submitFuelPurchase}
                className="btn-primary"
              >
                {t('Hifadhi & Jaza Tanki', 'Save Purchase & Restock Tank')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 9. MODAL: CROSS-SETTLEMENT (FISH & FUEL) */}
      {settlementModalOpen && (
        <Modal
          title={t('Makato ya Samaki & Deni la Mafuta', 'Settlement (Fish & Fuel Deduction)')}
          subtitle={t('Kukata deni la mafuta kutoka kwenye malipo ya samaki', 'Cross-settlement and fuel credit recovery from catch payout')}
          close={() => setSettlementModalOpen(false)}
        >
          <div className="flex flex-col gap-4 text-xs">
            {/* Fish Purchase Details */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-900 block">{t('Taarifa za Manunuzi ya Samaki', 'Fish Purchase Details')}</span>
              <Field label={t('Chagua Mzigo wa Samaki Ulioletwa', 'Select Catch Batch Landed')}>
                <select
                  value={selectedPurId}
                  onChange={e => setSelectedPurId(e.target.value)}
                  className="input-field font-medium"
                >
                  {samplePurchases.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.pur} · {spLabel(b.sp)} ({f(b.kg)} kg) · {t('Thamani:', 'Value:')} {tzs(b.kg * b.price)}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="space-y-1 pt-1 text-slate-700">
                <div className="flex justify-between">
                  <span>{t('Mvuvi:', 'Fisherman:')}</span>
                  <b className="text-slate-900">{settleSup?.name} ({settleSup?.no})</b>
                </div>
                <div className="flex justify-between">
                  <span>{t('Aina ya Samaki:', 'Fish Species:')}</span>
                  <b>{spLabel(selectedBatch?.sp || 'Nile Perch')}</b>
                </div>
                <div className="flex justify-between">
                  <span>{t('Uzito:', 'Quantity:')}</span>
                  <b className="font-mono">{f(selectedBatch?.kg || 2000)} kg</b>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                  <span>{t('Jumla ya Thamani ya Samaki:', 'Gross Purchase Value:')}</span>
                  <span className="font-mono text-blue-950">{tzs(settleFishValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('Iliyolipwa Hadi Sasa:', 'Already Paid:')}</span>
                  <b className="font-mono text-emerald-700">{tzs(settlePaid)}</b>
                </div>
                <div className="flex justify-between font-bold">
                  <span>{t('Salio la Manunuzi:', 'Purchase Balance:')}</span>
                  <b className={`font-mono ${settleOutstanding > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{tzs(settleOutstanding)}</b>
                </div>
              </div>
            </div>

            {/* Fuel Debt Summary */}
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-red-700 font-bold block">{t('Muhtasari wa Deni la Mafuta', 'Fuel Debt Summary')}</span>
                <span className="text-slate-500 text-[11px]">{t('Deni linalodaiwa kwa mvuvi huyu', 'Active debt owed by this fisherman')}</span>
              </div>
              <b className="text-base font-mono font-bold text-red-700">{tzs(settleFuelDebt)}</b>
            </div>

            {/* Settlement Calculation */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col gap-1.5">
              <span className="text-xs font-bold text-emerald-950 block">{t('Hesabu ya Makato', 'Settlement Calculation')}</span>
              <div className="flex justify-between text-slate-700">
                <span>{t('Salio la Manunuzi:', 'Purchase Balance:')}</span>
                <b className="font-mono">{tzs(settleOutstanding)}</b>
              </div>
              <div className="flex justify-between text-red-700 font-semibold">
                <span>{t('Toa: Deni la Mafuta:', 'Less: Fuel Debt Deduction:')}</span>
                <b className="font-mono">-{tzs(settleDeduction)}</b>
              </div>
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>{t('Malipo ya Taslimu Sasa:', 'Cash Paid Now:')}</span>
                <b className="font-mono">{tzs(settlePayNow)}</b>
              </div>
              <div className="flex justify-between border-t border-emerald-300 pt-1.5 text-sm font-bold text-emerald-950">
                <span>{t('Salio la Manunuzi Baada ya Makato:', 'Purchase Balance After Settlement:')}</span>
                <b className="font-mono text-emerald-800">{tzs(Math.max(0, settleOutstanding - settleDeduction - settlePayNow))}</b>
              </div>
              <div className="flex justify-between border-t border-emerald-300 pt-1.5 text-xs font-semibold text-red-700">
                <span>{t('Deni la Mafuta Lililobaki:', 'Remaining Fuel Debt:')}</span>
                <b className="font-mono">{tzs(Math.max(0, settleFuelDebt - settleDeduction))}</b>
              </div>
              {settleOutstanding <= 0 && (
                <div className="p-2 bg-white border border-amber-200 rounded text-[11px] text-amber-900">
                  {t('Manunuzi haya tayari yamelipwa kikamilifu; hakuna salio la kukata wala kulipa.', 'This purchase is already fully settled; there is no balance left to deduct or pay.')}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSettlementModalOpen(false)}
                className="btn-secondary"
              >
                {t('Ghairi', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={submitCrossSettlement}
                disabled={!settleCanSubmit}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 font-bold"
              >
                <Check size={16} /> {t('Thibitisha Makato & Lipa', 'Confirm Settlement & Payout')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 10. MODAL: PROFIT MARGIN & UNIT ECONOMICS BREAKDOWN */}
      {marginModalOpen && (
        <Modal
          title={t('Uchambuzi wa Faida ya Mafuta', 'Fuel Margin & Profitability Analysis')}
          subtitle={t('Bei ya kununua dhidi ya bei ya kuuza, na mchango wa faida', 'Unit economics, buy vs sell spreads, and net gross profit contribution')}
          close={() => setMarginModalOpen(false)}
        >
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-amber-800 font-semibold block uppercase text-[10px]">{t('Wastani wa Faida kwa Lita', 'Average Fuel Spread')}</span>
                <b className="text-lg font-mono font-bold text-amber-950">TZS 350 / {t('Lita', 'Litre')}</b>
              </div>
              <Badge variant="amber">9.5% {t('Faida Halisi', 'Net Margin')}</Badge>
            </div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Bidhaa', 'Product')}</th>
                    <th>{t('Bei ya Kununua / L', 'Supplier Cost / L')}</th>
                    <th>{t('Bei ya Pampu / L', 'Pump Sell / L')}</th>
                    <th>{t('Faida / L', 'Spread / L')}</th>
                    <th>{t('Lita za Mwezi', 'Monthly Litres')}</th>
                    <th>{t('Faida Ghafi', 'Gross Profit')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><Badge variant="amber">{t('Petroli', 'Petrol')}</Badge></td>
                    <td className="font-mono">TZS 2,850</td>
                    <td className="font-mono font-bold text-blue-900">TZS 3,200</td>
                    <td className="font-mono text-emerald-700 font-bold">+TZS 350</td>
                    <td className="font-mono">7,800 L</td>
                    <td className="font-mono font-bold text-emerald-800">TZS 2,730,000</td>
                  </tr>
                  <tr>
                    <td><Badge variant="blue">{t('Dizeli', 'Diesel')}</Badge></td>
                    <td className="font-mono">TZS 2,950</td>
                    <td className="font-mono font-bold text-blue-900">TZS 3,350</td>
                    <td className="font-mono text-emerald-700 font-bold">+TZS 400</td>
                    <td className="font-mono">4,700 L</td>
                    <td className="font-mono font-bold text-emerald-800">TZS 1,880,000</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={4}>{t('Jumla ya Faida Halisi', 'Total Net Profit Contribution')}</td>
                    <td className="font-mono">12,500 L</td>
                    <td className="font-mono text-emerald-800 text-sm">TZS 4,610,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMarginModalOpen(false)}
                className="btn-primary"
              >
                {t('Funga Uchambuzi', 'Close Analysis')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

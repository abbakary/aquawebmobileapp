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
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Building2,
  Scale,
  Truck,
  Wrench,
  Fuel as FuelIcon,
  Users,
  Receipt,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Target,
  Activity
} from 'lucide-react'
import {
  useS,
  SPECIES,
  supBal,
  cusBal,
  supFuelDebt,
  supMaintDebt,
  trCost,
  tot
} from '../store'
import { Badge, DetailModal, ViewBtn, f, tzs } from '../ui'

const COST_COLORS = [
  '#0b3a8c', // Fish Purchases
  '#ea580c', // Transport
  '#f59e0b', // Maintenance
  '#6366f1', // Staff Payroll
  '#10b981', // Operating Expenses
  '#dc2626'  // Spoilage & QC Loss
]

function computeStationBI(data, fromDate = '', speciesFilter = 'All') {
  if (!data) {
    return {
      rev: 0,
      collected: 0,
      receivables: 0,
      purchaseCost: 0,
      cogs: 0,
      transportCost: 0,
      maintCompanyCost: 0,
      maintRecoverable: 0,
      fuelPurchasedCost: 0,
      fuelIssuedRev: 0,
      fuelMargin: 0,
      payrollPaid: 0,
      opExps: 0,
      spoilageLoss: 0,
      totalAllCosts: 0,
      grossProfit: 0,
      grossMargin: 0,
      netProfit: 0,
      netMargin: 0,
      boughtKg: 0,
      soldKg: 0,
      lostKg: 0,
      fishermenPayable: 0,
      fuelDebtRecov: 0,
      maintDebtRecov: 0,
      speciesBreakdown: []
    }
  }

  const inDate = x => !fromDate || (x.date || '') >= fromDate
  const inSp = x => speciesFilter === 'All' || x.sp === speciesFilter

  const batches = (data.batches || []).filter(b => inDate(b) && inSp(b))
  const sales = (data.sales || []).filter(s => inDate(s) && inSp(s))
  const trips = (data.trips || []).filter(inDate)
  const maint = (data.maintenanceOrders || []).filter(inDate)
  const fuelPurch = (data.fuelPurchases || []).filter(inDate)
  const fuelIss = (data.fuelIssues || []).filter(inDate)
  const staffPays = (data.staffPayments || []).filter(inDate)
  const exps = (data.exps || []).filter(inDate)

  const rev = sales.reduce((sum, x) => sum + (x.kg || 0) * (x.price || 0), 0)
  const collected = sales.reduce((sum, x) => sum + (x.paid || 0), 0)
  const receivables = (data.customers || []).reduce((sum, c) => sum + cusBal(data, c.id), 0)

  const purchaseCost = batches.reduce((sum, b) => sum + tot(b), 0)
  const cogs = sales.reduce((sum, x) => sum + (x.cogs || 0), 0)
  const transportCost = trips.reduce((sum, tr) => sum + (tr.cost || 0), 0)

  const maintCompanyCost = maint
    .filter(m => m.arrangement === 'Company-paid')
    .reduce((sum, m) => sum + (m.totalCost || 0), 0)
  const maintRecoverable = maint
    .filter(m => m.arrangement !== 'Company-paid')
    .reduce((sum, m) => sum + (m.totalCost || 0), 0)

  const fuelPurchasedCost = fuelPurch.reduce((sum, p) => sum + (p.total || 0), 0)
  const fuelIssuedRev = fuelIss.reduce((sum, i) => sum + (i.total || 0), 0)
  const fuelMargin = fuelIss.reduce((sum, i) => {
    const buyEst = (i.price || 2850) - 250
    return sum + ((i.price || 0) - buyEst) * (i.litres || 0)
  }, 0)

  const payrollPaid = staffPays.reduce((sum, p) => sum + (p.net || 0), 0)
  const opExps = exps.reduce((sum, e) => sum + (e.amt || 0), 0)

  const lostKg = batches.reduce((sum, b) => sum + (b.waste || 0) + (b.rej || 0), 0)
  const spoilageLoss = batches.reduce(
    (sum, b) => sum + ((b.waste || 0) + (b.rej || 0)) * (b.price || 0),
    0
  )

  const totalAllCosts =
    purchaseCost +
    transportCost +
    maintCompanyCost +
    payrollPaid +
    opExps +
    spoilageLoss

  const grossProfit = rev - (cogs || purchaseCost)
  const grossMargin = rev > 0 ? (grossProfit / rev) * 100 : 0

  const netProfit = rev + fuelMargin - totalAllCosts
  const netMargin = rev > 0 ? (netProfit / rev) * 100 : 0

  const boughtKg = batches.reduce((sum, b) => sum + (b.kg || 0), 0)
  const soldKg = sales.reduce((sum, x) => sum + (x.kg || 0), 0)

  const fishermenPayable = (data.suppliers || []).reduce((sum, sup) => sum + supBal(data, sup.id), 0)
  const fuelDebtRecov = (data.suppliers || []).reduce((sum, sup) => sum + supFuelDebt(data, sup.id), 0)
  const maintDebtRecov = (data.suppliers || []).reduce((sum, sup) => sum + supMaintDebt(data, sup.id), 0)

  const speciesBreakdown = SPECIES.map(sp => {
    const spBatches = (data.batches || []).filter(b => inDate(b) && b.sp === sp)
    const spSales = (data.sales || []).filter(s => inDate(s) && s.sp === sp)
    const bKg = spBatches.reduce((sum, b) => sum + (b.kg || 0), 0)
    const bCost = spBatches.reduce((sum, b) => sum + tot(b), 0)
    const sKg = spSales.reduce((sum, x) => sum + (x.kg || 0), 0)
    const sRev = spSales.reduce((sum, x) => sum + (x.kg || 0) * (x.price || 0), 0)
    const sCogs = spSales.reduce((sum, x) => sum + (x.cogs || 0), 0)
    const profit = sRev - (sCogs || bCost)
    const margin = sRev > 0 ? (profit / sRev) * 100 : 0
    return { sp, bKg, bCost, sKg, sRev, profit, margin }
  }).filter(r => r.bKg > 0 || r.sKg > 0)

  return {
    rev,
    collected,
    receivables,
    purchaseCost,
    cogs,
    transportCost,
    maintCompanyCost,
    maintRecoverable,
    fuelPurchasedCost,
    fuelIssuedRev,
    fuelMargin,
    payrollPaid,
    opExps,
    spoilageLoss,
    totalAllCosts,
    grossProfit,
    grossMargin,
    netProfit,
    netMargin,
    boughtKg,
    soldKg,
    lostKg,
    fishermenPayable,
    fuelDebtRecov,
    maintDebtRecov,
    speciesBreakdown
  }
}

export default function BiDashboard({ go }) {
  const { s, T, B, t, spLabel } = useS()
  const [scope, setScope] = useState('all') // 'all' or 'current'
  const [period, setPeriod] = useState('all') // 'all', '30', '7'
  const [spFilter, setSpFilter] = useState('All')
  const [viewLine, setViewLine] = useState(null)

  const daysAgo = days => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d.toISOString().slice(0, 10)
  }
  const fromDate = period === '30' ? daysAgo(30) : period === '7' ? daysAgo(7) : ''

  const branches = T?.branches || [{ id: 'b1', name: B?.name || 'Mwanza Main Station', data: s }]

  const branchRows = branches.map(b => ({
    id: b.id,
    name: b.name,
    bi: computeStationBI(b.data || s, fromDate, spFilter)
  }))

  const activeBranches =
    scope === 'current' && B
      ? branchRows.filter(r => r.id === B.id)
      : branchRows

  // Sum up consolidated BI across selected scope
  const sumBI = activeBranches.reduce(
    (acc, r) => {
      const m = r.bi
      return {
        rev: acc.rev + m.rev,
        collected: acc.collected + m.collected,
        receivables: acc.receivables + m.receivables,
        purchaseCost: acc.purchaseCost + m.purchaseCost,
        cogs: acc.cogs + m.cogs,
        transportCost: acc.transportCost + m.transportCost,
        maintCompanyCost: acc.maintCompanyCost + m.maintCompanyCost,
        maintRecoverable: acc.maintRecoverable + m.maintRecoverable,
        fuelPurchasedCost: acc.fuelPurchasedCost + m.fuelPurchasedCost,
        fuelIssuedRev: acc.fuelIssuedRev + m.fuelIssuedRev,
        fuelMargin: acc.fuelMargin + m.fuelMargin,
        payrollPaid: acc.payrollPaid + m.payrollPaid,
        opExps: acc.opExps + m.opExps,
        spoilageLoss: acc.spoilageLoss + m.spoilageLoss,
        totalAllCosts: acc.totalAllCosts + m.totalAllCosts,
        grossProfit: acc.grossProfit + m.grossProfit,
        netProfit: acc.netProfit + m.netProfit,
        boughtKg: acc.boughtKg + m.boughtKg,
        soldKg: acc.soldKg + m.soldKg,
        lostKg: acc.lostKg + m.lostKg,
        fishermenPayable: acc.fishermenPayable + m.fishermenPayable,
        fuelDebtRecov: acc.fuelDebtRecov + m.fuelDebtRecov,
        maintDebtRecov: acc.maintDebtRecov + m.maintDebtRecov
      }
    },
    {
      rev: 0,
      collected: 0,
      receivables: 0,
      purchaseCost: 0,
      cogs: 0,
      transportCost: 0,
      maintCompanyCost: 0,
      maintRecoverable: 0,
      fuelPurchasedCost: 0,
      fuelIssuedRev: 0,
      fuelMargin: 0,
      payrollPaid: 0,
      opExps: 0,
      spoilageLoss: 0,
      totalAllCosts: 0,
      grossProfit: 0,
      netProfit: 0,
      boughtKg: 0,
      soldKg: 0,
      lostKg: 0,
      fishermenPayable: 0,
      fuelDebtRecov: 0,
      maintDebtRecov: 0
    }
  )

  sumBI.grossMargin = sumBI.rev > 0 ? (sumBI.grossProfit / sumBI.rev) * 100 : 0
  sumBI.netMargin = sumBI.rev > 0 ? (sumBI.netProfit / sumBI.rev) * 100 : 0

  // Species breakdown across active scope
  const speciesMap = {}
  activeBranches.forEach(r => {
    r.bi.speciesBreakdown.forEach(sb => {
      if (!speciesMap[sb.sp]) {
        speciesMap[sb.sp] = { sp: sb.sp, bKg: 0, bCost: 0, sKg: 0, sRev: 0, profit: 0 }
      }
      speciesMap[sb.sp].bKg += sb.bKg
      speciesMap[sb.sp].bCost += sb.bCost
      speciesMap[sb.sp].sKg += sb.sKg
      speciesMap[sb.sp].sRev += sb.sRev
      speciesMap[sb.sp].profit += sb.profit
    })
  })
  const consolidatedSpecies = Object.values(speciesMap).map(x => ({
    ...x,
    margin: x.sRev > 0 ? (x.profit / x.sRev) * 100 : 0
  }))

  // Cost Ledger Rows (All modules linked)
  const costLines = [
    {
      id: 'buy',
      module: t('Manunuzi ya Samaki', 'Fish Purchases'),
      source: t('Mizani ya Mialoni (Batches)', 'Landing Weighbridges'),
      amount: sumBI.purchaseCost,
      share: sumBI.totalAllCosts > 0 ? (sumBI.purchaseCost / sumBI.totalAllCosts) * 100 : 0,
      revShare: sumBI.rev > 0 ? (sumBI.purchaseCost / sumBI.rev) * 100 : 0,
      status: sumBI.rev > 0 && sumBI.purchaseCost / sumBI.rev > 0.72 ? 'high' : 'ok',
      note: `${f(sumBI.boughtKg)} kg ${t('walionunuliwa', 'purchased')}`,
      targetTab: 'buy'
    },
    {
      id: 'transport',
      module: t('Usafiri wa Baridi', 'Cold Chain Transport'),
      source: t('Safari za Malori & Boti', 'Refrigerated Trucks & Boats'),
      amount: sumBI.transportCost,
      share: sumBI.totalAllCosts > 0 ? (sumBI.transportCost / sumBI.totalAllCosts) * 100 : 0,
      revShare: sumBI.rev > 0 ? (sumBI.transportCost / sumBI.rev) * 100 : 0,
      status: sumBI.rev > 0 && sumBI.transportCost / sumBI.rev > 0.1 ? 'high' : 'ok',
      note: t('Usafirishaji kwenda viwandani', 'Factory & landing freight'),
      targetTab: 'transport'
    },
    {
      id: 'maintenance',
      module: t('Matengenezo ya Meli & Boti', 'Fleet & Boat Maintenance'),
      source: t('Gharama za Kampuni (Company-Paid)', 'Company-Paid Work Orders'),
      amount: sumBI.maintCompanyCost,
      share: sumBI.totalAllCosts > 0 ? (sumBI.maintCompanyCost / sumBI.totalAllCosts) * 100 : 0,
      revShare: sumBI.rev > 0 ? (sumBI.maintCompanyCost / sumBI.rev) * 100 : 0,
      status: sumBI.rev > 0 && sumBI.maintCompanyCost / sumBI.rev > 0.06 ? 'high' : 'ok',
      note: `${t('Deni la wavuvi linalokatwa:', 'Recoverable from fishers:')} ${tzs(sumBI.maintRecoverable)}`,
      targetTab: 'maintenance'
    },
    {
      id: 'staff',
      module: t('Mishahara & Posho za Wafanyakazi', 'Staff Salaries & Payroll'),
      source: t('Malipo ya Wafanyakazi', 'Employee Payroll Disbursements'),
      amount: sumBI.payrollPaid,
      share: sumBI.totalAllCosts > 0 ? (sumBI.payrollPaid / sumBI.totalAllCosts) * 100 : 0,
      revShare: sumBI.rev > 0 ? (sumBI.payrollPaid / sumBI.rev) * 100 : 0,
      status: sumBI.rev > 0 && sumBI.payrollPaid / sumBI.rev > 0.15 ? 'high' : 'ok',
      note: `${(s.staff || []).filter(u => u.active).length} ${t('wafanyakazi hai', 'active staff')}`,
      targetTab: 'staff'
    },
    {
      id: 'expenses',
      module: t('Matumizi Mengine ya Uendeshaji', 'Operating Expenses'),
      source: t('Barafu, Kreti, Vibarua, Jenereta', 'Ice, Crates, Labor, Generator'),
      amount: sumBI.opExps,
      share: sumBI.totalAllCosts > 0 ? (sumBI.opExps / sumBI.totalAllCosts) * 100 : 0,
      revShare: sumBI.rev > 0 ? (sumBI.opExps / sumBI.rev) * 100 : 0,
      status: sumBI.rev > 0 && sumBI.opExps / sumBI.rev > 0.12 ? 'high' : 'ok',
      note: t('Gharama za kila siku za kituo', 'Daily station overheads'),
      targetTab: 'expenses'
    },
    {
      id: 'spoilage',
      module: t('Hasara ya Samaki Walioharibika / Kukataliwa', 'Spoilage & QC Rejection Loss'),
      source: t('Ukaguzi wa Ubora & Stoo Baridi', 'QC Rejections & Cold Room Waste'),
      amount: sumBI.spoilageLoss,
      share: sumBI.totalAllCosts > 0 ? (sumBI.spoilageLoss / sumBI.totalAllCosts) * 100 : 0,
      revShare: sumBI.rev > 0 ? (sumBI.spoilageLoss / sumBI.rev) * 100 : 0,
      status: sumBI.lostKg > 0 ? 'high' : 'ok',
      note: `${f(sumBI.lostKg)} kg ${t('waliopotea/kukataliwa', 'lost/rejected')}`,
      targetTab: 'quality'
    }
  ]

  // Root-Cause Diagnostic Engine ("Why Profit is High/Low or Loss Happened & How to Solve")
  const diagnostics = []

  if (sumBI.netProfit < 0) {
    diagnostics.push({
      type: 'danger',
      title: t(
        `Tahadhari: Biashara Ina Hasara Halisi ya ${tzs(Math.abs(sumBI.netProfit))}`,
        `Alert: Net Loss of ${tzs(Math.abs(sumBI.netProfit))} Detected`
      ),
      why: t(
        `Jumla ya gharama zote (${tzs(sumBI.totalAllCosts)}) zimezidi mapato ya mauzo (${tzs(sumBI.rev)}).`,
        `Total all-in costs (${tzs(sumBI.totalAllCosts)}) exceeded total sales revenue (${tzs(sumBI.rev)}).`
      ),
      solve: t(
        'Punguza gharama za uendeshaji na usafiri, kagua bei ya kununulia samaki mwaloni, na hakikisha samaki waliopo stoo wanauzwa haraka.',
        'Cut operating & transport overheads, review landing beach buying prices, and accelerate cold-room stock sales.'
      )
    })
  } else if (sumBI.netMargin < 10) {
    diagnostics.push({
      type: 'warning',
      title: t(
        `Faida Halisi Iko Chini (${sumBI.netMargin.toFixed(1)}% tu ya Mapato)`,
        `Low Net Profit Margin (${sumBI.netMargin.toFixed(1)}% of Revenue)`
      ),
      why: t(
        `Ingawa kuna faida ghafi ya ${tzs(sumBI.grossProfit)}, gharama za uendeshaji, usafiri na mishahara zinakula sehemu kubwa ya faida.`,
        `Although gross profit is ${tzs(sumBI.grossProfit)}, operating expenses, transport, and payroll are absorbing most of the margin.`
      ),
      solve: t(
        'Boresha bei ya kuuzia viwandani au punguza gharama za safari za malori kwa kuunganisha mizigo.',
        'Negotiate better factory selling prices or consolidate truck dispatches to lower freight cost per kg.'
      )
    })
  } else {
    diagnostics.push({
      type: 'success',
      title: t(
        `Faida Halisi Iko Vizuri (${sumBI.netMargin.toFixed(1)}% · ${tzs(sumBI.netProfit)})`,
        `Healthy Net Profit Performance (${sumBI.netMargin.toFixed(1)}% · ${tzs(sumBI.netProfit)})`
      ),
      why: t(
        `Mapato ya mauzo (${tzs(sumBI.rev)}) na faida ya pampu ya mafuta (${tzs(sumBI.fuelMargin)}) yanazidi gharama zote za uendeshaji.`,
        `Sales revenue (${tzs(sumBI.rev)}) plus fuel pump margin (${tzs(sumBI.fuelMargin)}) comfortably exceed all operating costs.`
      ),
      solve: t(
        'Endelea kudhibiti barafu na usafiri, na ongeza mtaji kwenye aina ya samaki yenye faida kubwa zaidi.',
        'Maintain cold-chain discipline and allocate more working capital to your highest-margin fish species.'
      )
    })
  }

  // Specific cost-driver diagnostics
  const nonFishCosts = [
    { name: t('Usafiri wa Baridi', 'Cold Chain Transport'), val: sumBI.transportCost, tab: 'transport' },
    { name: t('Matengenezo ya Boti', 'Boat Maintenance'), val: sumBI.maintCompanyCost, tab: 'maintenance' },
    { name: t('Mishahara ya Wafanyakazi', 'Staff Payroll'), val: sumBI.payrollPaid, tab: 'staff' },
    { name: t('Matumizi ya Uendeshaji', 'Operating Expenses'), val: sumBI.opExps, tab: 'expenses' }
  ].sort((a, b) => b.val - a.val)

  if (nonFishCosts[0] && nonFishCosts[0].val > 0) {
    const topC = nonFishCosts[0]
    const pctRev = sumBI.rev > 0 ? ((topC.val / sumBI.rev) * 100).toFixed(1) : '0.0'
    diagnostics.push({
      type: 'info',
      title: t(
        `Gharama Kubwa Zaidi ya Uendeshaji: ${topC.name} (${tzs(topC.val)})`,
        `Top Operating Cost Driver: ${topC.name} (${tzs(topC.val)})`
      ),
      why: t(
        `${topC.name} inachukua ${pctRev}% ya mapato yote ya mauzo.`,
        `${topC.name} accounts for ${pctRev}% of total sales revenue.`
      ),
      solve: t(
        `Kagua daftari la ${topC.name} ili kudhibiti matumizi yasiyo ya lazima na kuongeza faida halisi.`,
        `Review the ${topC.name} ledger to eliminate inefficiencies and boost net profit.`
      )
    })
  }

  if (sumBI.spoilageLoss > 0) {
    diagnostics.push({
      type: 'warning',
      title: t(
        `Upotevu wa Samaki: ${f(sumBI.lostKg)} kg (${tzs(sumBI.spoilageLoss)})`,
        `Fish Spoilage & Rejection Loss: ${f(sumBI.lostKg)} kg (${tzs(sumBI.spoilageLoss)})`
      ),
      why: t(
        'Samaki walioharibika au kukataliwa kwenye ukaguzi wa ubora wamepunguza faida moja kwa moja.',
        'Spoiled fish and QC rejections directly reduced your net profit.'
      ),
      solve: t(
        'Ongeza barafu (flake ice) mwaloni na hakikisha joto la vyumba vya baridi linabaki kati ya 0°C hadi 2°C.',
        'Increase flake-ice ratio at landing beaches and keep cold rooms strictly between 0°C and 2°C.'
      )
    })
  }

  if (sumBI.receivables > 0 || sumBI.fuelDebtRecov + sumBI.maintDebtRecov > 0) {
    diagnostics.push({
      type: 'info',
      title: t(
        `Fedha Zilizoko Nje (Madeni ya Kukusanya): ${tzs(sumBI.receivables + sumBI.fuelDebtRecov + sumBI.maintDebtRecov)}`,
        `Uncollected Cash & Recoverable Debts: ${tzs(sumBI.receivables + sumBI.fuelDebtRecov + sumBI.maintDebtRecov)}`
      ),
      why: t(
        `Viwanda vinadaiwa ${tzs(sumBI.receivables)}, na wavuvi wana deni la mafuta/matengenezo la ${tzs(sumBI.fuelDebtRecov + sumBI.maintDebtRecov)}.`,
        `Factories owe ${tzs(sumBI.receivables)}, while fishermen owe ${tzs(sumBI.fuelDebtRecov + sumBI.maintDebtRecov)} in fuel/boat credit.`
      ),
      solve: t(
        'Fuatilia malipo ya viwanda na kata madeni ya mafuta/boti moja kwa moja wavuvi wanapoleta samaki.',
        'Follow up on factory invoices and auto-deduct fuel/boat debts when fishermen land catch.'
      )
    })
  }

  const pieData = costLines
    .filter(c => c.amount > 0)
    .map((c, idx) => ({
      name: c.module,
      value: c.amount,
      color: COST_COLORS[idx % COST_COLORS.length]
    }))

  const branchChartData = branchRows.map(r => ({
    name: r.name.replace(' Station', '').replace(' Branch', ''),
    [t('Mapato', 'Revenue')]: Math.round(r.bi.rev / 1000000),
    [t('Gharama Zote', 'All Costs')]: Math.round(r.bi.totalAllCosts / 1000000),
    [t('Faida Halisi', 'Net Profit')]: Math.round(r.bi.netProfit / 1000000)
  }))

  return (
    <div className="page-body">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 m-0">
              {t('Dashibodi Kuu ya BI, Gharama & Faida/Hasara', 'Executive BI, All-Cost & Profit/Loss Intelligence')}
            </h2>
            <Badge variant={sumBI.netProfit >= 0 ? 'green' : 'red'}>
              {sumBI.netProfit >= 0 ? t('FAIDA HALISI', 'NET PROFIT') : t('HASARA HALISI', 'NET LOSS')}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {t(
              'Uchambuzi kamili unaounganisha Manunuzi, Usafiri, Matengenezo, Mafuta, Mishahara, Matumizi na Mauzo kwa maeneo yote.',
              'End-to-end financial intelligence linking Purchases, Transport, Maintenance, Fuel, Payroll, Expenses, and Sales across all areas.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Scope Toggle: All Areas vs Current Area */}
          {branches.length > 1 && (
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold max-w-full overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  scope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {t('Maeneo Yote (Jumla)', 'All Areas (Sum-Up)')}
              </button>
              <button
                type="button"
                onClick={() => setScope('current')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                  scope === 'current' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {B?.name || t('Kituo Hiki', 'Current Area')}
              </button>
            </div>
          )}

          {/* Period Filter */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold overflow-x-auto no-scrollbar">
            {[
              ['all', t('Muda Wote', 'All Time')],
              ['30', t('Siku 30', '30 Days')],
              ['7', t('Siku 7', '7 Days')]
            ].map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPeriod(k)}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition ${
                  period === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* Species Filter */}
          <select
            value={spFilter}
            onChange={e => setSpFilter(e.target.value)}
            className="input-field py-1.5 px-2.5 text-xs w-full sm:w-auto"
          >
            <option value="All">{t('Samaki Wote', 'All Species')}</option>
            {SPECIES.map(sp => (
              <option key={sp} value={sp}>
                {spLabel(sp)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 4 Executive P&L KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap">
            <DollarSign size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Jumla ya Mapato (Mauzo)', 'Total Sales Revenue')}</small>
            <b>{tzs(sumBI.rev)}</b>
            <span className="kpi-sub">
              {f(sumBI.soldKg)} kg {t('waliouzwa', 'sold')} · {t('Keshi:', 'Collected:')} {tzs(sumBI.collected)}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <Layers size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Jumla ya Gharama Zote', 'Total All-In Costs')}</small>
            <b className="text-rose-700">{tzs(sumBI.totalAllCosts)}</b>
            <span className="kpi-sub">
              {t('Manunuzi + Usafiri + Matengenezo + Mishahara + Matumizi', 'Purchases + Freight + Maint + Payroll + OpEx')}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap purple">
            <TrendingUp size={22} />
          </div>
          <div className="kpi-content">
            <small>{t('Faida Ghafi (Gross Profit)', 'Gross Profit (Before OpEx)')}</small>
            <b className={sumBI.grossProfit >= 0 ? 'text-blue-800' : 'text-rose-600'}>
              {tzs(sumBI.grossProfit)}
            </b>
            <span className="kpi-sub">
              {t('Asilimia ya Faida Ghafi:', 'Gross Margin:')} <strong>{sumBI.grossMargin.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        <div className={`kpi-card ${sumBI.netProfit >= 0 ? 'border-emerald-300 bg-emerald-50/30' : 'border-rose-300 bg-rose-50/30'}`}>
          <div className={`kpi-icon-wrap ${sumBI.netProfit >= 0 ? 'green' : 'amber'}`}>
            {sumBI.netProfit >= 0 ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div className="kpi-content">
            <small>
              {sumBI.netProfit >= 0
                ? t('Faida Halisi (Net Profit)', 'Net Profit (Bottom Line)')
                : t('Hasara Halisi (Net Loss)', 'Net Loss (Bottom Line)')}
            </small>
            <b className={sumBI.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {tzs(sumBI.netProfit)}
            </b>
            <span className="kpi-sub">
              {t('Asilimia Halisi:', 'Net Margin:')} <strong>{sumBI.netMargin.toFixed(1)}%</strong> · {t('Faida ya Mafuta:', 'Fuel Margin:')} +{tzs(sumBI.fuelMargin)}
            </span>
          </div>
        </div>
      </div>

      {/* Diagnostic Engine: WHY Profit is High/Low or Loss Happened & WHAT TO DO */}
      <div className="panel">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">
                {t('Uchambuzi wa Sababu & Ushauri wa Usimamizi (Kwa Nini & Nini cha Kufanya)', 'Root-Cause BI Diagnostics & Action Plan (Why & What to Do)')}
              </h3>
              <p className="text-xs text-slate-500 m-0">
                {t('Majibu ya moja kwa moja kuhusu chanzo cha faida au hasara na hatua za kuchukua', 'Automated diagnosis of profit drivers, cost leaks, and recommended management actions')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {diagnostics.map((d, i) => {
            const styles =
              d.type === 'danger'
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : d.type === 'warning'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : d.type === 'success'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-blue-50/70 border-blue-200 text-blue-950'
            return (
              <div key={i} className={`p-3.5 rounded-xl border flex flex-col gap-1.5 text-xs ${styles}`}>
                <b className="text-sm">{d.title}</b>
                <div>
                  <span className="font-bold uppercase text-[10px] tracking-wider opacity-75">
                    {t('Sababu (Kwa Nini): ', 'Why It Happened: ')}
                  </span>
                  <span>{d.why}</span>
                </div>
                <div className="pt-1 border-t border-black/10">
                  <span className="font-bold uppercase text-[10px] tracking-wider opacity-75">
                    {t('Hatua ya Kuchukua (Suluhisho): ', 'Recommended Action: ')}
                  </span>
                  <span className="font-semibold">{d.solve}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts Row: Cost Breakdown + Area Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel">
          <h3 className="text-sm font-bold text-slate-900 m-0">
            {t('Mgawanyo wa Gharama Zote za Biashara', 'Complete Business Cost Structure')}
          </h3>
          <p className="text-xs text-slate-500 m-0 mb-3">
            {t('Kila aina ya gharama kutoka moduli zote (TZS)', 'Every cost category across all operational modules (TZS)')}
          </p>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={val => tzs(val)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="text-sm font-bold text-slate-900 m-0">
            {t('Ulinganisho wa Mapato, Gharama & Faida kwa Eneo (Milioni TZS)', 'Revenue, All Costs & Net Profit by Area (Millions TZS)')}
          </h3>
          <p className="text-xs text-slate-500 m-0 mb-3">
            {t('Utendaji wa kila kituo/mwalo ukilinganishwa', 'Side-by-side financial performance per landing station')}
          </p>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={val => `${val}M TZS`} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey={t('Mapato', 'Revenue')} fill="#0b3a8c" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t('Gharama Zote', 'All Costs')} fill="#ea580c" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t('Faida Halisi', 'Net Profit')} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* All-Module Cost & Profit Ledger Table */}
      <div className="panel p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0">
              {t('Jedwali la Gharama Zote Kutoka Kila Moduli', 'Integrated All-Module Cost & Profit Breakdown')}
            </h3>
            <p className="text-xs text-slate-500 m-0">
              {t('Bofya "Angalia" kuona uchambuzi wa kina wa kila gharama au nenda moja kwa moja kwenye moduli husika', 'Click "View" for detailed cost analysis or jump directly to the source module')}
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-slate-700 shrink-0">
            {t('Jumla ya Gharama:', 'Total Costs:')} {tzs(sumBI.totalAllCosts)}
          </span>
        </div>

        {/* Mobile Cost Ledger Cards */}
        <div className="md:hidden p-3 flex flex-col gap-2.5 bg-slate-50/40">
          {costLines.map(c => (
            <div key={c.id} className="mobile-card flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <b className="text-sm text-slate-900 block leading-snug">{c.module}</b>
                  <span className="text-[11px] text-slate-500 block">{c.source}</span>
                </div>
                <Badge variant={c.status === 'high' ? 'amber' : 'neutral'}>
                  {c.revShare.toFixed(1)}% {t('Mapato', 'Rev')}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-700 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.round(c.share))}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-slate-600">{c.share.toFixed(1)}%</span>
                </div>
                <b className="font-mono text-sm text-slate-900 shrink-0">{tzs(c.amount)}</b>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 truncate">{c.note}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <ViewBtn onClick={() => setViewLine(c)} />
                  {go && (
                    <button
                      type="button"
                      onClick={() => go(c.targetTab)}
                      className="btn-secondary text-xs py-1 px-2.5"
                    >
                      {t('Fungua', 'Open')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${sumBI.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
            <div>
              <span className="font-bold block">{sumBI.netProfit >= 0 ? t('FAIDA HALISI', 'NET PROFIT') : t('HASARA HALISI', 'NET LOSS')}</span>
              <span className="font-mono text-[11px]">{t('Gharama:', 'Costs:')} {tzs(sumBI.totalAllCosts)}</span>
            </div>
            <b className="font-mono text-sm">{tzs(sumBI.netProfit)} ({sumBI.netMargin.toFixed(1)}%)</b>
          </div>
        </div>

        {/* Desktop Cost Ledger Table */}
        <div className="hidden md:block data-table-wrap border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('Aina ya Gharama / Moduli', 'Cost Category / Module')}</th>
                <th>{t('Chanzo cha Takwimu', 'Data Source')}</th>
                <th>{t('Kiasi (TZS)', 'Amount (TZS)')}</th>
                <th>{t('% ya Gharama Zote', '% of Total Costs')}</th>
                <th>{t('% ya Mapato', '% of Revenue')}</th>
                <th>{t('Maelezo', 'Notes')}</th>
                <th className="text-right">{t('Vitendo', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {costLines.map(c => (
                <tr key={c.id}>
                  <td>
                    <b className="text-slate-900">{c.module}</b>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600">{c.source}</span>
                  </td>
                  <td>
                    <b className="font-mono text-slate-900">{tzs(c.amount)}</b>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-700 h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.round(c.share))}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">{c.share.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={c.status === 'high' ? 'amber' : 'neutral'}>
                      {c.revShare.toFixed(1)}%
                    </Badge>
                  </td>
                  <td>
                    <span className="text-xs text-slate-500">{c.note}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ViewBtn onClick={() => setViewLine(c)} />
                      {go && (
                        <button
                          type="button"
                          onClick={() => go(c.targetTab)}
                          className="btn-secondary text-xs py-1 px-2.5"
                        >
                          {t('Fungua', 'Open')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td colSpan={2} className="text-slate-900 py-3">
                  {t('JUMLA YA GHARAMA ZOTE & FAIDA/HASARA HALISI', 'TOTAL ALL-IN COSTS & NET PROFIT / LOSS')}
                </td>
                <td className="font-mono text-rose-700 py-3">{tzs(sumBI.totalAllCosts)}</td>
                <td className="font-mono py-3">100%</td>
                <td className="font-mono py-3">
                  {sumBI.rev > 0 ? ((sumBI.totalAllCosts / sumBI.rev) * 100).toFixed(1) : '0.0'}%
                </td>
                <td colSpan={2} className="text-right font-mono py-3">
                  <span className={sumBI.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {sumBI.netProfit >= 0 ? t('FAIDA HALISI:', 'NET PROFIT:') : t('HASARA HALISI:', 'NET LOSS:')}{' '}
                    {tzs(sumBI.netProfit)} ({sumBI.netMargin.toFixed(1)}%)
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Multi-Area Sum-Up Table (Both / All Areas + Combined Sum-Up) */}
      <div className="panel p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 m-0">
            {t('Muhtasari wa Faida & Hasara kwa Kila Eneo + Jumla Kuu', 'Area-by-Area Profit & Loss Summary + Consolidated Total')}
          </h3>
          <p className="text-xs text-slate-500 m-0">
            {t('Linganisha mapato, gharama zote, faida ghafi na faida/hasara halisi kwa kila kituo', 'Compare revenue, all-in costs, gross profit, and net profit/loss across every station')}
          </p>
        </div>

        {/* Mobile Area Summary Cards */}
        <div className="md:hidden p-3 flex flex-col gap-2.5 bg-slate-50/40">
          {branchRows.map(r => (
            <div key={r.id} className="mobile-card flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <b className="text-sm text-slate-900 truncate">{r.name}</b>
                <Badge variant={r.bi.netProfit >= 0 ? 'green' : 'red'}>
                  {r.bi.netMargin.toFixed(1)}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">{t('Mapato', 'Revenue')}</span>
                  <b className="font-mono text-slate-900">{tzs(r.bi.rev)}</b>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">{t('Gharama Zote', 'Total Costs')}</span>
                  <b className="font-mono text-rose-700">{tzs(r.bi.totalAllCosts)}</b>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">{t('Usafiri & Matengenezo', 'Transport & Maint.')}</span>
                  <span className="font-mono text-slate-700">{tzs(r.bi.transportCost + r.bi.maintCompanyCost)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">{t('Faida / Hasara Halisi', 'Net Profit / Loss')}</span>
                  <b className={`font-mono ${r.bi.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {tzs(r.bi.netProfit)}
                  </b>
                </div>
              </div>
            </div>
          ))}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs flex items-center justify-between">
            <div>
              <b className="text-blue-950 block">{t('JUMLA KUU (MAENEO YOTE)', 'CONSOLIDATED TOTAL')}</b>
              <span className="font-mono text-slate-600">{t('Mapato:', 'Rev:')} {tzs(sumBI.rev)}</span>
            </div>
            <div className="text-right">
              <b className={`font-mono text-sm block ${sumBI.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {tzs(sumBI.netProfit)}
              </b>
              <span className="font-mono text-[11px] text-blue-900">{sumBI.netMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Desktop Area Summary Table */}
        <div className="hidden md:block data-table-wrap border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('Eneo / Kituo', 'Area / Station')}</th>
                <th>{t('Mapato (Mauzo)', 'Revenue')}</th>
                <th>{t('Manunuzi', 'Purchases')}</th>
                <th>{t('Usafiri & Matengenezo', 'Transport & Maint.')}</th>
                <th>{t('Mishahara & Matumizi', 'Payroll & OpEx')}</th>
                <th>{t('Gharama Zote', 'Total Costs')}</th>
                <th>{t('Faida / Hasara Halisi', 'Net Profit / Loss')}</th>
                <th>{t('Asilimia %', 'Net Margin')}</th>
              </tr>
            </thead>
            <tbody>
              {branchRows.map(r => (
                <tr key={r.id}>
                  <td>
                    <b className="text-slate-900">{r.name}</b>
                  </td>
                  <td className="font-mono font-semibold text-slate-900">{tzs(r.bi.rev)}</td>
                  <td className="font-mono text-slate-700">{tzs(r.bi.purchaseCost)}</td>
                  <td className="font-mono text-slate-700">
                    {tzs(r.bi.transportCost + r.bi.maintCompanyCost)}
                  </td>
                  <td className="font-mono text-slate-700">
                    {tzs(r.bi.payrollPaid + r.bi.opExps)}
                  </td>
                  <td className="font-mono font-bold text-rose-700">{tzs(r.bi.totalAllCosts)}</td>
                  <td>
                    <b className={`font-mono ${r.bi.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {tzs(r.bi.netProfit)}
                    </b>
                  </td>
                  <td>
                    <Badge variant={r.bi.netProfit >= 0 ? 'green' : 'red'}>
                      {r.bi.netMargin.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50/70 font-bold border-t-2 border-blue-200">
                <td className="text-blue-950 py-3">{t('JUMLA KUU (MAENEO YOTE)', 'CONSOLIDATED TOTAL (ALL AREAS)')}</td>
                <td className="font-mono text-blue-950 py-3">{tzs(sumBI.rev)}</td>
                <td className="font-mono text-slate-800 py-3">{tzs(sumBI.purchaseCost)}</td>
                <td className="font-mono text-slate-800 py-3">
                  {tzs(sumBI.transportCost + sumBI.maintCompanyCost)}
                </td>
                <td className="font-mono text-slate-800 py-3">
                  {tzs(sumBI.payrollPaid + sumBI.opExps)}
                </td>
                <td className="font-mono text-rose-700 py-3">{tzs(sumBI.totalAllCosts)}</td>
                <td className={`font-mono py-3 ${sumBI.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {tzs(sumBI.netProfit)}
                </td>
                <td className="font-mono py-3">{sumBI.netMargin.toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Species Profitability Breakdown */}
      {consolidatedSpecies.length > 0 && (
        <div className="panel p-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 m-0">
              {t('Faida kwa Kila Aina ya Samaki', 'Profitability by Fish Species')}
            </h3>
            <p className="text-xs text-slate-500 m-0">
              {t('Tambua aina ya samaki inayoleta faida kubwa zaidi', 'Identify which fish species generates the highest margin')}
            </p>
          </div>

          {/* Mobile Species Cards */}
          <div className="md:hidden p-3 flex flex-col gap-2.5 bg-slate-50/40">
            {consolidatedSpecies.map(sp => (
              <div key={sp.sp} className="mobile-card flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <b className="text-sm text-slate-900">{spLabel(sp.sp)}</b>
                  <Badge variant={sp.margin >= 15 ? 'green' : sp.margin >= 0 ? 'amber' : 'red'}>
                    {sp.margin.toFixed(1)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{t('Manunuzi', 'Purchased')} ({f(sp.bKg)} kg)</span>
                    <b className="font-mono text-slate-800">{tzs(sp.bCost)}</b>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">{t('Mauzo', 'Sold')} ({f(sp.sKg)} kg)</span>
                    <b className="font-mono text-slate-900">{tzs(sp.sRev)}</b>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">{t('Faida Ghafi', 'Gross Profit')}</span>
                  <b className={`font-mono ${sp.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {tzs(sp.profit)}
                  </b>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Species Table */}
          <div className="hidden md:block data-table-wrap border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Aina ya Samaki', 'Species')}</th>
                  <th>{t('Walionunuliwa (kg)', 'Purchased (kg)')}</th>
                  <th>{t('Gharama ya Manunuzi', 'Purchase Cost')}</th>
                  <th>{t('Waliouzwa (kg)', 'Sold (kg)')}</th>
                  <th>{t('Mapato ya Mauzo', 'Sales Revenue')}</th>
                  <th>{t('Faida Ghafi', 'Gross Profit')}</th>
                  <th>{t('Asilimia %', 'Margin %')}</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedSpecies.map(sp => (
                  <tr key={sp.sp}>
                    <td>
                      <b className="text-slate-900">{spLabel(sp.sp)}</b>
                    </td>
                    <td className="font-mono">{f(sp.bKg)} kg</td>
                    <td className="font-mono">{tzs(sp.bCost)}</td>
                    <td className="font-mono">{f(sp.sKg)} kg</td>
                    <td className="font-mono font-semibold">{tzs(sp.sRev)}</td>
                    <td>
                      <b className={`font-mono ${sp.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {tzs(sp.profit)}
                      </b>
                    </td>
                    <td>
                      <Badge variant={sp.margin >= 15 ? 'green' : sp.margin >= 0 ? 'amber' : 'red'}>
                        {sp.margin.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal for Cost Line */}
      {viewLine && (
        <DetailModal
          title={`${t('Uchambuzi wa Gharama:', 'Cost Category Analysis:')} ${viewLine.module}`}
          subtitle={viewLine.source}
          badge={
            <Badge variant={viewLine.status === 'high' ? 'amber' : 'green'}>
              {viewLine.status === 'high' ? t('Inahitaji Udhibiti', 'Needs Attention') : t('Kiwango Kizuri', 'Healthy Level')}
            </Badge>
          }
          onClose={() => setViewLine(null)}
          fields={[
            { label: t('Moduli / Kundi', 'Module / Category'), value: viewLine.module },
            { label: t('Chanzo cha Takwimu', 'Data Source'), value: viewLine.source },
            { label: t('Jumla ya Gharama', 'Total Amount'), value: tzs(viewLine.amount), mono: true, highlight: true },
            { label: t('Sehemu ya Gharama Zote', 'Share of All Costs'), value: `${viewLine.share.toFixed(1)}%`, mono: true },
            { label: t('Sehemu ya Mapato', 'Share of Revenue'), value: `${viewLine.revShare.toFixed(1)}%`, mono: true },
            { label: t('Maelezo ya Ziada', 'Additional Notes'), value: viewLine.note, fullWidth: true },
          ]}
          actions={
            go && (
              <button
                type="button"
                onClick={() => {
                  const tabTarget = viewLine.targetTab
                  setViewLine(null)
                  go(tabTarget)
                }}
                className="btn-primary text-xs"
              >
                {t('Fungua Moduli Husika', 'Open Source Module')}
              </button>
            )
          }
        />
      )}
    </div>
  )
}

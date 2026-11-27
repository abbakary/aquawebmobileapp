// ─── FishTrade ERP — Store (API-backed, no demo data) ────────────────────────
// All state is loaded from the backend via /bootstrap.
// Every mutation calls the API; the local branch.data is kept in sync as a
// response cache for instant UI updates while the server roundtrip happens.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getInitialLang, saveLang, spName, catName } from './i18n'
import * as api from './api'

// ── Re-export pure helpers (no side-effects) ──────────────────────────────────
export const SPECIES    = ['Nile Perch', 'Tilapia', 'Dagaa (Sardines)', 'Catfish']
export const SITES      = ['Mwanza (Kirumba Mwaloni)', 'Kigoma (Katonga BMU)', 'Musoma (Mwigobero)', 'Ukerewe (Nansio)', 'Bukoba (Kemondo)']
export const COLD_ROOMS = ['Main Cold Room (0°C to 2°C)', 'Landing Holding Chiller', 'Blast Freezer (-18°C)']

export const ROLES = {
  Owner:              0,
  'General Manager':  0,
  'Purchasing Officer': ['home', 'buy', 'fuel', 'maintenance', 'gear', 'catering', 'investment', 'advances', 'stock', 'transport', 'reports', 'crew', 'suppliers'],
  'Quality Inspector': ['home', 'quality', 'stock', 'reports'],
  Storekeeper:        ['home', 'stock', 'fuel', 'maintenance', 'gear', 'quality', 'reports', 'crew'],
  Accountant:         ['home', 'bi', 'hq', 'payments', 'fuel', 'maintenance', 'gear', 'catering', 'investment', 'advances', 'settlement', 'expenses', 'suppliers', 'sales', 'transport', 'reports', 'crew'],
  'Sales Officer':    ['home', 'sales', 'transport', 'stock', 'reports'],
  'Transport Officer':['home', 'transport', 'maintenance'],
  Auditor:            ['home', 'bi', 'hq', 'buy', 'fuel', 'maintenance', 'gear', 'catering', 'investment', 'advances', 'settlement', 'stock', 'sales', 'suppliers', 'quality', 'payments', 'transport', 'expenses', 'compliance', 'audit', 'reports', 'crew']
}

export const uid    = p => p + Math.random().toString(36).slice(2, 8)
export const nowL   = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }
export const today  = () => new Date().toISOString().slice(0, 10)
export const tot    = b  => (b.kg || 0) * (b.price || 0)
export const trCost = s  => (s.trips || []).reduce((t, x) => t + (x.cost || 0), 0)
export const H      = s  => { let h = 5381; for (const c of 'ft' + s) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return String(h) }

export const batchDeduction = (s, b) => {
  if (+b.ded > 0) return +b.ded
  return (s.settlements || []).filter(st => st.supId === b.sup && (st.purId === b.pur || st.purId === b.id))
    .reduce((a, st) => a + (+st.fuelDeducted || 0) + (+st.maintDeducted || 0), 0)
}
export const batchNet    = (s, b) => Math.max(0, tot(b) - batchDeduction(s, b))
export const payStatusOf = (net, paid) => net - paid <= 0.5 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'

export const supBal = (s, id) => {
  // Net payable: gross catch value minus per-batch deductions
  const netPayable = (s.batches || []).filter(b => b.sup === id)
    .reduce((a, b) => a + Math.max(0, ((+b.kg || 0) * (+b.price || 0)) - (+b.ded || 0)), 0)
  const paid = (s.pays || []).filter(p => p.sup === id).reduce((a, p) => a + (+p.amt || 0), 0)
  return Math.max(0, netPayable - paid)
}

export const supFuelDebt = (s, id) => {
  const debit      = (s.fuelIssues   || []).filter(f => f.supId === id).reduce((a, f) => a + (f.total || 0), 0)
  const directPaid = (s.fuelIssues   || []).filter(f => f.supId === id).reduce((a, f) => a + (f.paid || 0), 0)
  const extraPaid  = (s.fuelPayments || []).filter(p => p.supId === id).reduce((a, p) => a + (p.amt || 0), 0)
  const settled    = (s.settlements  || []).filter(st => st.supId === id).reduce((a, st) => a + (st.fuelDeducted || 0), 0)
  return Math.max(0, debit - directPaid - extraPaid - settled)
}

export const supMaintDebt = (s, id) => {
  const debit   = (s.maintenanceOrders || []).filter(m => m.supId === id).reduce((a, m) => a + (m.recoverable || 0), 0)
  const paid    = (s.maintPayments     || []).filter(p => p.supId === id).reduce((a, p) => a + (p.amt || 0), 0)
  const settled = (s.settlements       || []).filter(st => st.supId === id).reduce((a, st) => a + (st.maintDeducted || 0), 0)
  return Math.max(0, debit - paid - settled)
}

export const supAccountStatement = (s, id) => {
  // Gross values from every batch for this supplier
  const batches = (s.batches || []).filter(b => b.sup === id)
  const totalCatchValue      = batches.reduce((a, b) => a + ((+b.kg || 0) * (+b.price || 0)), 0)
  const totalCatchDeductions = batches.reduce((a, b) => a + (+b.ded || 0), 0)
  const totalCatchNet        = Math.max(0, totalCatchValue - totalCatchDeductions)

  // Cash actually disbursed to this supplier
  const totalCatchPaid = (s.pays || []).filter(p => p.sup === id).reduce((a, p) => a + (+p.amt || 0), 0)

  // Outstanding balance (net payable minus cash paid)
  const fishOwed  = Math.max(0, totalCatchNet - totalCatchPaid)

  const fuelDebt  = supFuelDebt(s, id)
  const maintDebt = supMaintDebt(s, id)
  const totalDebt = fuelDebt + maintDebt
  const netBalance = fishOwed - totalDebt

  return {
    totalCatchValue,
    totalCatchDeductions,
    totalCatchNet,
    totalCatchPaid,
    fishOwed,
    fuelDebt,
    maintDebt,
    totalDebt,
    netBalance,
  }
}

export const cusBal = (s, id) =>
  (s.sales || []).filter(x => x.cus === id).reduce((a, x) => a + (x.kg * x.price) - (x.paid || 0), 0)

export const stock = s => {
  const m = {}
  ;(s.batches || []).filter(b => b.st === 'accepted' && b.rem > 0).forEach(b => {
    const k = b.sp + '|' + (b.grade || 'A'); m[k] = (m[k] || 0) + b.rem
  })
  return m
}

export const landed = (s, b) => {
  const tripSum = (s.trips || []).filter(t => t.ref === b.id).reduce((a, t) => a + t.cost, 0)
  return b.price + tripSum / (b.kg || 1)
}

export const refLabel = (s, t) =>
  (s.batches || []).find(x => x.id === t.ref)?.no ||
  (s.sales || []).find(x => x.id === t.ref)?.no || '-'

export const supPurchaseStatus = (s, id) => {
  const purchases = (s.batches || [])
    .filter(b => b.sup === id)
    .slice()
    .sort((a, b) => (a.date + (a.at || '')).localeCompare(b.date + (b.at || '')))
  const pays = (s.pays || []).filter(p => p.sup === id)
  const direct = {}
  let pool = 0
  pays.forEach(p => {
    if (p.pur && purchases.some(b => b.pur === p.pur)) {
      direct[p.pur] = (direct[p.pur] || 0) + (+p.amt || 0)
    } else {
      pool += +p.amt || 0
    }
  })
  const rows = purchases.map(b => {
    const net = batchNet(s, b)
    const tagged = direct[b.pur] || 0
    const paid = Math.min(tagged, net)
    if (tagged > net) pool += tagged - net
    return { batch: b, net, paid, balance: Math.max(0, net - paid), status: 'unpaid' }
  })
  rows.forEach(r => {
    if (r.balance > 0 && pool > 0) {
      const take = Math.min(pool, r.balance)
      r.paid += take
      pool -= take
    }
  })
  rows.forEach(r => { r.status = payStatusOf(r.net, r.paid) })
  return rows
}

export const getFishermanLedger = (s, id) =>
  (s.fishermanLedger || []).filter(e => e.supId === id)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

export const PLANS = [
  { id: 'Starter',    price: 49000,  branches: 1,  users: 5,   note: 'One landing site branch' },
  { id: 'Business',   price: 149000, branches: 5,  users: 25,  note: 'Multi-branch value chain + HQ analytics' },
  { id: 'Enterprise', price: 399000, branches: 99, users: 999, note: 'Unlimited branches' }
]

export const PERMISSIONS_LIST = [
  { key: 'canBuy',            label: 'Record Catch Weigh-in & Purchases',    group: 'Fish Trade' },
  { key: 'canPay',            label: 'Disburse Catch Payments',              group: 'Fish Trade' },
  { key: 'canInspectQuality', label: 'HACCP Quality & Inspection',           group: 'Fish Trade' },
  { key: 'canManageSales',    label: 'Factory Sales & Invoicing',            group: 'Fish Trade' },
  { key: 'canIssueFuel',      label: 'Dispense Fuel to Vessels',             group: 'Lake Operations' },
  { key: 'canApproveAdvances',label: 'Approve Cash Advances',                group: 'Lake Operations' },
  { key: 'canManageGear',     label: 'Issue Fishing Gear & Assets',          group: 'Lake Operations' },
  { key: 'canManageFleet',    label: 'Fleet Maintenance Work Orders',        group: 'Lake Operations' },
  { key: 'canSettleSeason',   label: 'Season Settlement & Closing',          group: 'Lake Operations' },
  { key: 'canViewReports',    label: 'Financial & Operational Reports',      group: 'Governance & BI' },
  { key: 'canManageStaff',    label: 'Manage Staff & Security Access',       group: 'Governance & BI' },
  { key: 'canExport',         label: 'Export Data & Official Documents',     group: 'Governance & BI' },
]

export const canUserDo = (user, key) => {
  if (!user) return false
  if (user.role === 'Owner' || user.role === 'General Manager') return true
  if (user.permissions && typeof user.permissions[key] === 'boolean') return user.permissions[key]
  return false
}

export const getUserAllowedModules = user => {
  if (!user) return []
  if (user.role === 'Owner' || user.role === 'General Manager') return user.module_keys?.length ? user.module_keys : Object.keys(ROLES).flatMap(() => [])
  if (user.module_keys?.length) return user.module_keys
  const r = ROLES[user.role]
  return r === 0 || !r ? [] : r
}

export const canUserAccessModule = (user, key) => {
  if (!user) return false
  if (user.role === 'Owner') return true
  if (user.role === 'General Manager' && !user.module_keys?.length) return true
  return getUserAllowedModules(user).includes(key)
}

// ── Context ───────────────────────────────────────────────────────────────────
const C = createContext()
export const useS = () => useContext(C)

// ── Loading / error UI helper ─────────────────────────────────────────────────
export function Store({ children }) {
  const [lang, setLangState] = useState(getInitialLang)
  const setLang = next => { setLangState(next); saveLang(next) }
  const t    = (sw, en) => (lang === 'sw' ? sw : en)
  const spLabel = sp => spName(sp, lang)
  const catLabel = cat => catName(cat, lang)

  // ── Application state ───────────────────────────────────────────────────────
  const [authState, setAuthState] = useState({
    loading: true,  // true while bootstrap() is in-flight
    error:   null,
    user:    null,
    tenant:  null,
    staff:   [],
    branches:[],
    activeBranchId: null,
    branchData: {},    // { [branchId]: <full branch state dict> }
  })

  const bid = authState.activeBranchId
  const branchState = bid ? (authState.branchData[bid] || {}) : null
  const s  = branchState
    ? { ...branchState, staff: authState.staff, me: authState.user?.id, role: authState.user?.role }
    : null

  const setBranchData = useCallback((branchId, data) => {
    setAuthState(prev => ({
      ...prev,
      branchData: { ...prev.branchData, [branchId]: data }
    }))
  }, [])

  const patchBranchData = useCallback((branchId, patch) => {
    setAuthState(prev => {
      const current = prev.branchData[branchId] || {}
      return {
        ...prev,
        branchData: { ...prev.branchData, [branchId]: { ...current, ...patch } }
      }
    })
  }, [])

  // ── Mutation helper: optimistically update local state, then call API ────────
  // `optimistic` = function(currentData) => newData  (applied immediately)
  // `apiCall`    = async function()  =>  void/response (called after optimistic)
  // `rollback`   = function(err) => void  (optional, called on failure)
  const mutation = useCallback(async (optimistic, apiCall, rollback) => {
    // Snapshot current data before any change — captured inside the functional
    // updater so it is always the latest committed state, never a stale closure.
    let snapshot = null
    if (bid) {
      setAuthState(prev => {
        snapshot = prev.branchData[bid] ?? null
        return prev   // no change, just reading
      })
    }
    if (optimistic && bid) {
      patchBranchData(bid, optimistic(snapshot || {}))
    }
    try {
      return await apiCall()
    } catch (err) {
      // Roll back to the snapshot we captured before the optimistic update
      if (rollback) rollback(err)
      else if (snapshot !== null && bid) setBranchData(bid, snapshot)
      throw err
    }
  }, [bid, patchBranchData, setBranchData])

  // ── Bootstrap on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!api.getToken()) {
      setAuthState(prev => ({ ...prev, loading: false }))
      return
    }
    api.bootstrap()
      .then(boot => {
        const branches = boot.branches || []
        const activeBranchId = branches[0]?.id || null
        const branchData = {}
        branches.forEach(b => { if (b.state) branchData[b.id] = b.state; if (b.version) api.saveVersion(b.id, b.version) })
        setAuthState({
          loading: false, error: null,
          user: boot.user, tenant: boot.tenant,
          staff: boot.staff || [], branches,
          activeBranchId, branchData,
        })
      })
      .catch(() => {
        api.clearToken()
        setAuthState(prev => ({ ...prev, loading: false }))
      })
  }, [])

  // ── Auth actions ─────────────────────────────────────────────────────────────
  const x = {
    login: async (username, password) => {
      const data = await api.login(username, password)
      const boot = await api.bootstrap()
      const branches = boot.branches || []
      const activeBranchId = branches[0]?.id || null
      const branchData = {}
      branches.forEach(b => { if (b.state) branchData[b.id] = b.state; if (b.version) api.saveVersion(b.id, b.version) })
      setAuthState({
        loading: false, error: null,
        user: boot.user, tenant: boot.tenant,
        staff: boot.staff || [], branches,
        activeBranchId, branchData,
      })
      return data
    },

    logout: async () => {
      await api.logout()
      setAuthState({ loading: false, error: null, user: null, tenant: null, staff: [], branches: [], activeBranchId: null, branchData: {} })
    },

    register: async (form) => {
      const data = await api.register(form)
      const boot = await api.bootstrap()
      const branches = boot.branches || []
      const branchData = {}
      branches.forEach(b => { if (b.state) branchData[b.id] = b.state })
      setAuthState({
        loading: false, error: null,
        user: boot.user, tenant: boot.tenant,
        staff: boot.staff || [], branches,
        activeBranchId: branches[0]?.id || null, branchData,
      })
      return data
    },

    switchBranch: async (branchId) => {
      setAuthState(prev => ({ ...prev, activeBranchId: branchId }))
      if (!authState.branchData[branchId]) {
        const bs = await api.getBranchState(branchId)
        setBranchData(branchId, bs.state || {})
      }
    },

    addBranch: async (name, region) => {
      const bs = await api.post('/api/v1/branches', { name, region, state: {} })
      setAuthState(prev => ({
        ...prev,
        branches: [...prev.branches, { id: bs.id, name: bs.name, region: bs.region, version: bs.version }],
        branchData: { ...prev.branchData, [bs.id]: bs.state || {} }
      }))
      return bs
    },

    refreshSession: async () => {
      const boot = await api.bootstrap()
      const branches = boot.branches || []
      const branchData = {}
      branches.forEach(b => { if (b.state) branchData[b.id] = b.state; if (b.version) api.saveVersion(b.id, b.version) })
      setAuthState(prev => ({
        ...prev,
        user: boot.user, tenant: boot.tenant,
        staff: boot.staff || [], branches, branchData,
      }))
    },
  }

  // ── Branch actions (a.*) ─────────────────────────────────────────────────────
  const a = {

    // ── Season ────────────────────────────────────────────────────────────────
    setActiveSeason: seasonId => mutation(
      d => ({ ...d, activeSeasonId: seasonId }),
      () => api.setActiveSeason(bid, seasonId)
    ),

    addSeason: d => mutation(null, async () => {
      const r = await api.addSeason(bid, d)
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, seasons: [r.season, ...(cur.seasons || [])] } } }
      })
    }),

    // ── Suppliers ─────────────────────────────────────────────────────────────
    addSup: d => mutation(null, async () => {
      const r = await api.createCollectionItem(bid, 'suppliers', d)
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, suppliers: [...(cur.suppliers || []), r.item] } } }
      })
      return r.item?.id
    }),

    addCus: d => mutation(null, async () => {
      const r = await api.createCollectionItem(bid, 'customers', d)
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, customers: [...(cur.customers || []), r.item] } } }
      })
    }),

    // ── Procurement ───────────────────────────────────────────────────────────
    buy: d => mutation(null, async () => {
      const r = await api.recordPurchase(bid, {
        supplier_id: d.sup, species: d.sp, grade: d.grade,
        kg: d.kg, price_per_kg: d.price, site: d.site,
        warehouse: d.wh || '', paid_now: +d.paid || 0,
        fuel_deducted: +d.fuelDeducted || 0, maint_deducted: +d.maintDeducted || 0,
        payment_method: d.method || 'Cash Voucher', notes: d.notes || '',
      })
      // Use functional updater so we always merge into current state, never stale
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return {
          ...prev,
          branchData: {
            ...prev.branchData,
            [bid]: {
              ...cur,
              batches:     [r.batch,       ...(cur.batches     || [])],
              settlements: r.settlement ? [r.settlement, ...(cur.settlements || [])] : (cur.settlements || []),
              pays:        r.payment    ? [r.payment,    ...(cur.pays        || [])] : (cur.pays        || []),
            },
          },
        }
      })
      if (r.version) api.saveVersion(bid, r.version)
      return r
    }),

    inspect: (id, acc, temp, reason) => mutation(
      d => ({ ...d, batches: d.batches.map(b => b.id !== id ? b : { ...b, rem: acc, rej: b.kg - acc, temp, reason, st: acc > 0 ? 'accepted' : 'rejected' }) }),
      () => api.inspectBatch(bid, id, { accepted_kg: acc, temperature_c: temp, reason: reason || '' })
    ),

    transfer: (id, to) => mutation(
      d => ({ ...d, batches: d.batches.map(b => b.id !== id ? b : { ...b, wh: to }) }),
      () => api.transferBatch(bid, id, to)
    ),

    waste: (id, kg, why) => mutation(
      d => ({ ...d, batches: d.batches.map(b => b.id !== id ? b : { ...b, rem: b.rem - kg, waste: (b.waste || 0) + kg }) }),
      () => api.recordWaste(bid, id, kg, why || '')
    ),

    // ── Payments ──────────────────────────────────────────────────────────────
    pay: (sup, amt, m, pur = '') => mutation(null, async () => {
      const r = await api.paySupplier(bid, { supplier_id: sup, amount: amt, method: m })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, pays: [r.payment, ...(cur.pays || [])] } } }
      })
    }),

    // ── Sales ─────────────────────────────────────────────────────────────────
    sell: d => mutation(null, async () => {
      const r = await api.recordSale(bid, {
        customer_id: d.cus, species: d.sp, grade: d.grade,
        kg: d.kg, price_per_kg: d.price, paid_now: +d.paid || 0,
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, sales: [r.sale, ...(cur.sales || [])] } } }
      })
      return r.sale
    }),

    receive: (id, amt) => mutation(
      d => ({ ...d, sales: d.sales.map(x => x.id !== id ? x : { ...x, paid: x.paid + amt }) }),
      () => api.receiveSalePayment(bid, id, amt, 'Bank RTGS')
    ),

    dispatch: (id, dis) => mutation(
      d => ({ ...d, sales: d.sales.map(x => x.id !== id ? x : { ...x, dis }) }),
      () => api.dispatchSale(bid, id, { vehicle: dis.veh, driver: dis.drv, status: dis.st, temperature: dis.temp || '2.0°C' })
    ),

    // ── Expenses ──────────────────────────────────────────────────────────────
    addExp: d => mutation(
      dt => ({ ...dt, exps: [{ id: uid('e'), date: today(), ...d }, ...(dt.exps || [])] }),
      () => api.recordExpense(bid, { category: d.cat, amount: d.amt, description: d.desc || '', date: d.date || today() })
    ),

    addComp: d => mutation(
      dt => ({ ...dt, comp: [{ id: uid('k'), ...d }, ...(dt.comp || [])] }),
      () => api.addPermit(bid, { permit_type: d.type, reference: d.ref, authority: d.who, expiry_date: d.exp })
    ),

    addTrip: d => mutation(
      dt => ({ ...dt, trips: [{ id: uid('t'), ...d }, ...(dt.trips || [])] }),
      () => api.recordTrip(bid, {
        trip_type: d.type,
        mode: d.mode,
        from_location: d.from,
        to_location: d.to,
        cost: d.cost,
        kg: +d.kg || 0,
        price_per_kg: +d.pricePerKg || 0,
        species: d.species || '',
        vehicle: d.veh || '',
        temperature: d.temp || '',
        sale_ref: d.ref || '',
        method: d.method || 'CRDB / NMB Bank',
        notes: d.notes || '',
      })
    ),

    // ── Fuel ─────────────────────────────────────────────────────────────────
    issueFuel: d => mutation(null, async () => {
      const r = await api.issueFuel(bid, {
        supplier_id: d.supId, boat_id: d.boatId, tank_id: d.tankId,
        litres: d.litres, price_per_litre: d.price, paid_now: +d.paid || 0,
        arrangement: d.arrangement || 'Partial', notes: d.notes || '',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: {
          ...cur,
          fuelIssues: [r.issue, ...(cur.fuelIssues || [])],
          fuelTanks: (cur.fuelTanks || []).map(t => t.id === d.tankId ? { ...t, current: Math.max(0, (t.current || 0) - d.litres) } : t),
        } } }
      })
    }),

    receiveFuel: d => mutation(null, async () => {
      const r = await api.receiveFuel(bid, {
        tank_id: d.tankId, fuel_type: d.fuel, litres: d.litres,
        cost_per_litre: d.costPerL, fuel_supplier_name: d.supName || '',
        doc_ref: d.docRef || '', status: 'Paid',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: {
          ...cur,
          fuelPurchases: [r.purchase, ...(cur.fuelPurchases || [])],
          fuelTanks: (cur.fuelTanks || []).map(t => t.id === d.tankId ? { ...t, current: r.tank_current ?? (t.current || 0) + d.litres } : t),
        } } }
      })
    }),

    payFuelDebt: (supId, amt, m, notes = '') => mutation(null, async () => {
      const r = await api.payFuelDebt(bid, { supplier_id: supId, amount: amt, method: m, notes })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, fuelPayments: [r.payment, ...(cur.fuelPayments || [])] } } }
      })
    }),

    // ── Maintenance ───────────────────────────────────────────────────────────
    addWorkOrder: d => mutation(null, async () => {
      const r = await api.createWorkOrder(bid, {
        boat_id: d.boatId, supplier_id: d.supId || 'company',
        title: d.title, fault: d.fault || '', mechanic: d.mechanic || '',
        arrangement: d.arrangement || 'Company-paid',
        parts: (d.parts || []).map(p => ({ part_id: p.partId, name: p.name, qty: p.qty, cost: p.cost })),
        parts_cost: d.partsCost || 0, labor_cost: d.laborCost || 0, other_cost: d.otherCost || 0,
        notes: d.notes || '',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, maintenanceOrders: [r.work_order, ...(cur.maintenanceOrders || [])] } } }
      })
    }),

    updateWorkOrder: (id, d) => mutation(
      dt => ({ ...dt, maintenanceOrders: dt.maintenanceOrders.map(w => w.id !== id ? w : { ...w, ...d }) }),
      () => api.updateWorkOrderStatus(bid, id, d.status || 'In Progress')
    ),

    addSparePart: d => mutation(null, async () => {
      await api.createCollectionItem(bid, 'spareParts', d)
      const r = await api.listCollection(bid, 'spareParts')
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, spareParts: r.items || [] } } }
      })
    }),

    addBoat: d => mutation(null, async () => {
      const r = await api.createCollectionItem(bid, 'boats', d)
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, boats: [...(cur.boats || []), r.item] } } }
      })
    }),

    updateBoat: (id, d) => mutation(
      dt => ({ ...dt, boats: dt.boats.map(b => b.id !== id ? b : { ...b, ...d }) }),
      () => api.patchCollectionItem(bid, 'boats', id, d)
    ),

    // ── Gear ─────────────────────────────────────────────────────────────────
    addGearItem: d => mutation(null, async () => {
      const r = await api.createCollectionItem(bid, 'gearItems', d)
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, gearItems: [...(cur.gearItems || []), r.item] } } }
      })
    }),

    issueGear: d => mutation(null, async () => {
      const r = await api.issueGear(bid, {
        supplier_id: d.supId, boat_id: d.boatId,
        arrangement: d.arrangement || 'Fisherman-recoverable (Credit)',
        items: (d.items || []).map(i => ({ item_id: i.itemId, quantity: i.qty })),
        notes: d.notes || '',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, gearIssues: [r.issue, ...(cur.gearIssues || [])] } } }
      })
    }),

    returnGear: (issueId, d) => mutation(null, async () => {
      await api.returnGear(bid, issueId, {
        returned_condition: d.returnedCondition || 'Good',
        returned_qty: d.returnedQty || 0,
        restock: d.restock !== false,
        liability_action: d.liabilityAction || 'Credit / Clear Fisherman Debt',
        return_notes: d.returnNotes || '',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: {
          ...cur,
          gearIssues: (cur.gearIssues || []).map(g => g.id !== issueId ? g : { ...g, status: 'Returned & Reconciled', returnedQty: d.returnedQty, returnedCondition: d.returnedCondition }),
        } } }
      })
    }),

    // ── Catering ─────────────────────────────────────────────────────────────
    addCook: d => mutation(null, async () => {
      const r = await api.createCollectionItem(bid, 'cateringCooks', d)
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, cateringCooks: [...(cur.cateringCooks || []), r.item] } } }
      })
    }),

    issueCookAdvance: d => mutation(null, async () => {
      const r = await api.issueCookAdvance(bid, {
        cook_id: d.cookId, amount: d.amountIssued, purpose: d.purpose || '',
        allocated_boats: d.allocatedBoats || [],
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, cookAdvances: [r.advance, ...(cur.cookAdvances || [])] } } }
      })
    }),

    recordCateringExpense: d => mutation(null, async () => {
      const r = await api.recordCateringExpense(bid, {
        cook_id: d.cookId, advance_ref: d.advanceRef || '',
        total_spent: d.totalSpent, meal_type: d.mealType || 'Lunch & Supper',
        crew_size: d.crewSize || 0, meals_count: d.mealsCount || 0,
        money_returned: d.moneyReturned || 0,
        arrangement: d.arrangement || 'Fisherman-recoverable (Catch Deduction)',
        notes: d.notes || '',
        boat_allocations: (d.boatAllocations || []).map(a => ({
          boat_id: a.boatId, supplier_id: a.supId || '', cost: a.cost, recoverable: a.recoverable
        })),
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, cateringExpenses: [r.expense, ...(cur.cateringExpenses || [])] } } }
      })
    }),

    // ── Cash Advances ─────────────────────────────────────────────────────────
    requestAdvance: d => mutation(null, async () => {
      const r = await api.requestAdvance(bid, {
        supplier_id: d.supId, boat_id: d.boatId,
        amount: d.amount, category: d.category || 'Daily Matumizi',
        purpose: d.purpose || '', method: d.method || 'Cash', phone: d.phone || '',
        classification: d.classification || 'Fisherman-recoverable',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, advances: [r.advance, ...(cur.advances || [])] } } }
      })
    }),

    approveAdvance: (id, status, approvedAmount) => mutation(null, async () => {
      await api.approveAdvance(bid, id, { new_status: status, approved_amount: approvedAmount || undefined })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: {
          ...cur,
          advances: (cur.advances || []).map(a => a.id !== id ? a : { ...a, status, approvedBy: prev.user?.name || '' }),
        } } }
      })
    }),

    repayAdvance: (id, amt, m) => mutation(null, async () => {
      await api.repayAdvance(bid, id, { amount: amt, method: m })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: {
          ...cur,
          advances: (cur.advances || []).map(a => a.id !== id ? a : { ...a, recovered: (a.recovered || 0) + amt }),
        } } }
      })
    }),

    // ── Boat Projects ─────────────────────────────────────────────────────────
    addBoatProject: d => mutation(null, async () => {
      const r = await api.createBoatProject(bid, {
        name: d.name, builder: d.builder || '', builder_phone: d.builderPhone || '',
        timber_materials: d.timberMaterials || 0, labour: d.labour || 0,
        engine: d.engine || 0, equipment: d.equipment || 0,
        ownership_type: d.ownershipType || 'Company Asset',
        contractual_recoverable: d.contractualRecoverable || 0,
        repayment_terms: d.repaymentTerms || '',
        start_date: d.startDate || today(), target_completion: d.targetCompletion || '',
        stages: (d.stages || []).map(st => ({ name: st.name, cost: st.cost, status: st.status || 'Pending', date: st.date || today() })),
        notes: d.notes || '',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, boatProjects: [r.project, ...(cur.boatProjects || [])] } } }
      })
    }),

    updateProjectProgress: (id, pct, status) => mutation(null, async () => {
      await api.updateProjectProgress(bid, id, { progress_pct: pct, status })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: {
          ...cur,
          boatProjects: (cur.boatProjects || []).map(p => p.id !== id ? p : { ...p, progressPct: pct, status }),
        } } }
      })
    }),

    addProjectPayment: (id, amt, stageName) => mutation(null, async () => {
      await api.recordProjectPayment(bid, id, { stage_name: stageName, amount: amt })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: {
          ...cur,
          boatProjects: (cur.boatProjects || []).map(p => p.id !== id ? p : { ...p, paidStages: (p.paidStages || 0) + amt, balanceToPay: Math.max(0, (p.balanceToPay || 0) - amt) }),
        } } }
      })
    }),

    // ── Crew Management ───────────────────────────────────────────────────────
    assignBoatCrew: d => mutation(null, async () => {
      const r = await api.assignCrew(bid, {
        boat_id: d.boatId, boat_reg: d.boatReg || '', boat_name: d.boatName || '',
        supplier_id: d.supId, fisherman_name: d.fishermanName,
        position: d.position || 'Crew', account_type: d.accountType || 'Permanent',
        phone: d.phone || '', nida: d.nida || '', start_date: d.startDate || today(),
        rate_agreement: d.rateAgreement || '', notes: d.notes || '',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, boatCrewAssignments: [r.assignment, ...(cur.boatCrewAssignments || [])] } } }
      })
    }),

    createKibaluaEngagement: d => mutation(null, async () => {
      const r = await api.createKibalua(bid, {
        boat_id: d.boatId, boat_reg: d.boatReg || '', boat_name: d.boatName || '',
        fisherman_name: d.fishermanName, phone: d.phone || '',
        duration_days: d.durationDays, start_date: d.startDate, end_date: d.endDate,
        daily_rate: d.dailyRate, advance_paid: d.advancePaid || 0, notes: d.notes || '',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, kibaluaEngagements: [r.engagement, ...(cur.kibaluaEngagements || [])] } } }
      })
    }),

    completeKibaluaEngagement: (id, d) => mutation(null, async () => {
      await api.settleKibalua(bid, id, { final_payment: d.finalPaymentPaid || 0, method: d.paymentMethod || 'Cash', notes: d.notes || '' })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: {
          ...cur,
          kibaluaEngagements: (cur.kibaluaEngagements || []).map(k => k.id !== id ? k : { ...k, status: 'Completed' }),
        } } }
      })
    }),

    processFishermanExit: d => mutation(null, async () => {
      const r = await api.fishermanExit(bid, {
        assignment_id: d.assignmentId, last_working_date: d.lastWorkingDate,
        reason: d.reason || 'Resigned', outstanding_advances: +d.outstandingAdvances || 0,
        unreturned_gear: d.unreturnedGear || 'None',
        final_balance_due: +d.finalBalanceDue || 0, notes: d.notes || '',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: {
          ...cur,
          fishermanExitRecords: [r.exit_record, ...(cur.fishermanExitRecords || [])],
          boatCrewAssignments: (cur.boatCrewAssignments || []).map(a => a.id !== d.assignmentId ? a : { ...a, status: 'Exited', endDate: d.lastWorkingDate }),
        } } }
      })
    }),

    allocateBoatExpense: d => mutation(null, async () => {
      const r = await api.allocateBoatExpense(bid, {
        boat_id: d.boatId, boat_reg: d.boatReg || '', boat_name: d.boatName || '',
        expense_type: d.expenseType, description: d.description || '',
        total_amount: d.totalAmount, rule: d.rule || 'Equal allocation',
        crew_supplier_ids: (d.splitItems || []).map(si => si.supId),
        notes: d.notes || '',
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, boatExpenseAllocations: [r.allocation, ...(cur.boatExpenseAllocations || [])] } } }
      })
    }),

    setActiveBoat: boatId => {
      patchBranchData(bid, { activeBoatId: boatId })
    },

    // ── Full Settlement ───────────────────────────────────────────────────────
    createSeasonSettlement: d => mutation(null, async () => {
      const r = await api.createFullSettlement(bid, {
        supplier_id: d.supId, boat_id: d.boatId, season_id: d.seasonId || '',
        agreed_earnings: d.agreedEarnings, previous_paid: d.previousPaid || 0,
        fuel_deducted: d.fuelDeducted || 0, maint_deducted: d.maintDeducted || 0,
        gear_deducted: d.gearDeducted || 0, food_deducted: d.foodDeducted || 0,
        advances_deducted: d.advancesDeducted || 0, other_deducted: d.otherDeducted || 0,
        method: d.method || 'M-Pesa (Mobile Money)',
        settlement_type: d.settlementType || 'Full Season Settlement',
        notes: d.notes || '',
      })
      patchBranchData(bid, { fullSettlements: [r.settlement, ...(authState.branchData[bid]?.fullSettlements || [])] })
    }),

    // ── Staff (via API, not branch state) ─────────────────────────────────────
    addStaff: async d => {
      const r = await api.createStaff({ username: d.username, name: d.name, password: d.pin, role: d.role, phone: d.phone || '', branch_ids: d.branch ? [d.branch] : [] })
      setAuthState(prev => ({ ...prev, staff: [...prev.staff, r] }))
    },

    updStaff: async (id, d) => {
      const patch = { name: d.name, role: d.role, phone: d.phone, active: d.active }
      if (d.pin) patch.password = d.pin
      const r = await api.updateStaff(id, patch)
      setAuthState(prev => ({ ...prev, staff: prev.staff.map(u => u.id !== id ? u : r) }))
    },

    // ── Legacy compatibility ───────────────────────────────────────────────────
    settleFisherman: d => a.createSeasonSettlement({
      supId: d.supId, boatId: d.boatId || '', seasonId: d.seasonId || '',
      agreedEarnings: d.fishTotal || 0, previousPaid: 0,
      fuelDeducted: d.fuelDeducted || 0, maintDeducted: d.maintDeducted || 0,
      method: d.method || 'M-Pesa (Mobile Money)', notes: d.notes || '',
    }),

    createFishermanAccount: d => mutation(null, async () => {
      const r = await api.createCollectionItem(bid, 'suppliers', {
        name: d.name, phone: d.phone, site: d.site || 'Mwanza (Kirumba Mwaloni)',
        cat: d.cat || 'Individual Fisherman', boat: d.boatName || '',
        nida: d.nida || '', creditLimit: +d.creditLimit || 2000000, status: 'Active',
      })
      const boatR = await api.createCollectionItem(bid, 'boats', {
        regNo: d.boatReg || '', name: d.boatName || `${d.name}'s Boat`,
        ownerType: 'Fisherman-owned', ownerId: r.item?.id || '',
        captain: d.captain || d.name, engine: d.engine || '',
        boatType: d.boatType || 'Planked Wooden Mashua (10m)',
        status: 'Operational', crewMembers: d.crewMembers || [],
      })
      setAuthState(prev => {
        const cur = prev.branchData[bid] || {}
        return { ...prev, branchData: { ...prev.branchData, [bid]: {
          ...cur,
          suppliers: [...(cur.suppliers || []), r.item],
          boats: [...(cur.boats || []), boatR.item],
        } } }
      })
      return r.item?.id
    }),

    updateBoatCrew: (boatId, crewMembers) => mutation(
      d => ({ ...d, boats: d.boats.map(b => b.id !== boatId ? b : { ...b, crewMembers }) }),
      () => api.patchCollectionItem(bid, 'boats', boatId, { crewMembers })
    ),

    updateCrewAssignment: (id, d) => mutation(null, () =>
      api.patchCollectionItem(bid, 'boatCrewAssignments', id, d)
    ),

    // reset only clears local state — does not delete server data
    reset: () => {},
  }

  const db  = { ses: authState.user ? { kind: 'tenant', tid: authState.tenant?.id, uid: authState.user?.id, bid } : null, tenants: [], plat: { admin: {}, log: [] } }
  const T   = authState.tenant
  const B   = authState.branches.find(b => b.id === bid)
  const me  = authState.user
  const ses = db.ses || {}

  return (
    <C.Provider value={{ s, a, db, T, B, me, x, ses, lang, setLang, t, spLabel, catLabel, authState }}>
      {authState.loading ? null : children}
    </C.Provider>
  )
}

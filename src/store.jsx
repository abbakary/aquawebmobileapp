// ─── FishTrade ERP — Store (API-backed with Offline Resilience & Sync Queue) ─
// All state is loaded from the backend via /bootstrap and cached locally.
// On offline or slow 2G/3G networks, field officers retain their session,
// work against cached branch state, and queue mutations for automatic replay.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getInitialLang, saveLang, spName, catName } from './i18n'
import { useDevice } from './device'
import {
  loadCachedSession,
  saveCachedSession,
  clearCachedSession,
  loadOutbox,
  enqueueOutboxItem,
  removeOutboxItem,
  updateOutboxItem,
  replaceQueuedRef,
} from './offline'
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
  const batches = (s.batches || []).filter(b => b.sup === id)
  const totalCatchValue      = batches.reduce((a, b) => a + ((+b.kg || 0) * (+b.price || 0)), 0)
  const totalCatchDeductions = batches.reduce((a, b) => a + (+b.ded || 0), 0)
  const totalCatchNet        = Math.max(0, totalCatchValue - totalCatchDeductions)
  const totalCatchPaid = (s.pays || []).filter(p => p.sup === id).reduce((a, p) => a + (+p.amt || 0), 0)
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

export function Store({ children }) {
  const device = useDevice()
  const [lang, setLangState] = useState(getInitialLang)
  const setLang = next => { setLangState(next); saveLang(next) }
  const t = (sw, en) => (lang === 'sw' ? sw : en)
  const spLabel = sp => spName(sp, lang)
  const catLabel = cat => catName(cat, lang)

  const [authState, setAuthState] = useState({
    loading: true,
    error: null,
    offlineHydrated: false,
    user: null,
    tenant: null,
    staff: [],
    branches: [],
    activeBranchId: null,
    branchData: {},
  })

  const [pendingQueue, setPendingQueue] = useState(() => loadOutbox())
  const [syncing, setSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [syncError, setSyncError] = useState(null)
  const syncingRef = useRef(false)

  const bid = authState.activeBranchId
  const branchState = bid ? (authState.branchData[bid] || {}) : null
  const s = branchState
    ? { ...branchState, staff: authState.staff, me: authState.user?.id, role: authState.user?.role }
    : null

  // Persist session snapshot locally whenever authenticated data updates
  useEffect(() => {
    if (!authState.loading && authState.user) {
      saveCachedSession(authState)
    }
  }, [authState])

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

  // ── Standard optimistic + rollback mutation ─────────────────────────────────
  const mutation = useCallback(async (optimistic, apiCall, rollback) => {
    let snapshot = null
    if (bid) {
      setAuthState(prev => {
        snapshot = prev.branchData[bid] ?? null
        return prev
      })
    }
    if (optimistic && bid) {
      patchBranchData(bid, optimistic(snapshot || {}))
    }
    try {
      return await apiCall()
    } catch (err) {
      if (rollback) rollback(err)
      else if (snapshot !== null && bid) setBranchData(bid, snapshot)
      throw err
    }
  }, [bid, patchBranchData, setBranchData])

  // ── Offline-resilient mutation helper ───────────────────────────────────────
  // Tries online first when connected; if offline or network/timeout occurs,
  // commits local optimistic state AND queues a replayable outbox item.
  const queueOrRun = useCallback(async ({
    op,
    label,
    payload,
    tempId = null,
    applyLocal,
    runOnline,
  }) => {
    const queueOffline = () => {
      let localRes = null
      if (applyLocal && bid) {
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          const applied = applyLocal(cur, prev)
          const nextBranch = applied?.branchPatch ? { ...cur, ...applied.branchPatch } : applied
          localRes = applied?.result ?? null
          return {
            ...prev,
            branchData: { ...prev.branchData, [bid]: nextBranch },
          }
        })
      }
      const { queue } = enqueueOutboxItem({ op, label, branchId: bid, payload, tempId })
      setPendingQueue(queue)
      return { offlineQueued: true, ...(localRes || {}) }
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return queueOffline()
    }

    try {
      const res = await runOnline()
      return res
    } catch (err) {
      if (api.isLikelyNetworkError(err)) {
        return queueOffline()
      }
      throw err
    }
  }, [bid])

  // ── Replay a single queued outbox command ───────────────────────────────────
  const executeOutboxEntry = useCallback(async entry => {
    const b = entry.branchId
    const p = entry.payload || {}
    let realId = null

    switch (entry.op) {
      case 'setActiveSeason':
        await api.setActiveSeason(b, p.seasonId)
        break
      case 'addSeason':
        await api.addSeason(b, p)
        break
      case 'addSup': {
        const r = await api.createCollectionItem(b, 'suppliers', p)
        realId = r.item?.id
        break
      }
      case 'addCus': {
        const r = await api.createCollectionItem(b, 'customers', p)
        realId = r.item?.id
        break
      }
      case 'buy': {
        const r = await api.recordPurchase(b, p)
        realId = r.batch?.id
        if (r.version) api.saveVersion(b, r.version)
        break
      }
      case 'inspect':
        await api.inspectBatch(b, p.id, p.data)
        break
      case 'transfer':
        await api.transferBatch(b, p.id, p.to)
        break
      case 'waste':
        await api.recordWaste(b, p.id, p.kg, p.why)
        break
      case 'pay':
        await api.paySupplier(b, p)
        break
      case 'sell': {
        const r = await api.recordSale(b, p)
        realId = r.sale?.id
        break
      }
      case 'receive':
        await api.receiveSalePayment(b, p.id, p.amt, p.method || 'Bank RTGS')
        break
      case 'dispatch':
        await api.dispatchSale(b, p.id, p.data)
        break
      case 'addExp':
        await api.recordExpense(b, p)
        break
      case 'addComp':
        await api.addPermit(b, p)
        break
      case 'addTrip':
        await api.recordTrip(b, p)
        break
      case 'issueFuel':
        await api.issueFuel(b, p)
        break
      case 'receiveFuel':
        await api.receiveFuel(b, p)
        break
      case 'payFuelDebt':
        await api.payFuelDebt(b, p)
        break
      case 'addWorkOrder': {
        const r = await api.createWorkOrder(b, p)
        realId = r.work_order?.id
        break
      }
      case 'updateWorkOrder':
        await api.updateWorkOrderStatus(b, p.id, p.status)
        break
      case 'addSparePart':
        await api.createCollectionItem(b, 'spareParts', p)
        break
      case 'addBoat': {
        const r = await api.createCollectionItem(b, 'boats', p)
        realId = r.item?.id
        break
      }
      case 'updateBoat':
        await api.patchCollectionItem(b, 'boats', p.id, p.patch)
        break
      case 'addGearItem':
        await api.createCollectionItem(b, 'gearItems', p)
        break
      case 'issueGear':
        await api.issueGear(b, p)
        break
      case 'returnGear':
        await api.returnGear(b, p.issueId, p.data)
        break
      case 'addCook':
        await api.createCollectionItem(b, 'cateringCooks', p)
        break
      case 'issueCookAdvance':
        await api.issueCookAdvance(b, p)
        break
      case 'recordCateringExpense':
        await api.recordCateringExpense(b, p)
        break
      case 'requestAdvance':
        await api.requestAdvance(b, p)
        break
      case 'approveAdvance':
        await api.approveAdvance(b, p.id, p.data)
        break
      case 'repayAdvance':
        await api.repayAdvance(b, p.id, p.data)
        break
      case 'addBoatProject': {
        const r = await api.createBoatProject(b, p)
        realId = r.project?.id
        break
      }
      case 'updateProjectProgress':
        await api.updateProjectProgress(b, p.id, p.data)
        break
      case 'addProjectPayment':
        await api.recordProjectPayment(b, p.id, p.data)
        break
      case 'assignBoatCrew':
        await api.assignCrew(b, p)
        break
      case 'createKibaluaEngagement': {
        const r = await api.createKibalua(b, p)
        realId = r.engagement?.id
        break
      }
      case 'completeKibaluaEngagement':
        await api.settleKibalua(b, p.id, p.data)
        break
      case 'processFishermanExit':
        await api.fishermanExit(b, p)
        break
      case 'allocateBoatExpense':
        await api.allocateBoatExpense(b, p)
        break
      case 'createSeasonSettlement':
        await api.createFullSettlement(b, p)
        break
      case 'createFishermanAccount': {
        const r = await api.createCollectionItem(b, 'suppliers', p.supplier)
        realId = r.item?.id
        await api.createCollectionItem(b, 'boats', { ...p.boat, ownerId: realId || p.boat.ownerId })
        break
      }
      case 'updateBoatCrew':
        await api.patchCollectionItem(b, 'boats', p.boatId, { crewMembers: p.crewMembers })
        break
      case 'updateCrewAssignment':
        await api.patchCollectionItem(b, 'boatCrewAssignments', p.id, p.patch)
        break
      default:
        break
    }

    if (entry.tempId && realId) {
      replaceQueuedRef(entry.tempId, realId)
    }
  }, [])

  const refreshFromServer = useCallback(async () => {
    const boot = await api.bootstrap()
    const branches = boot.branches || []
    const branchData = {}
    branches.forEach(b => {
      if (b.state) branchData[b.id] = b.state
      if (b.version) api.saveVersion(b.id, b.version)
    })
    setAuthState(prev => ({
      ...prev,
      offlineHydrated: false,
      user: boot.user,
      tenant: boot.tenant,
      staff: boot.staff || [],
      branches,
      activeBranchId: prev.activeBranchId && branches.some(x => x.id === prev.activeBranchId)
        ? prev.activeBranchId
        : (branches[0]?.id || null),
      branchData,
    }))
    return boot
  }, [])

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return { synced: 0, remaining: loadOutbox().length }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { synced: 0, remaining: loadOutbox().length, offline: true }
    }
    if (!api.getToken()) return { synced: 0, remaining: loadOutbox().length }

    syncingRef.current = true
    setSyncing(true)
    setSyncError(null)
    let syncedCount = 0

    try {
      while (true) {
        const current = loadOutbox()
        if (!current.length) break
        const head = current[0]
        try {
          await executeOutboxEntry(head)
          const next = removeOutboxItem(head.id)
          setPendingQueue(next)
          syncedCount += 1
        } catch (err) {
          if (api.isLikelyNetworkError(err)) {
            setSyncError('Connection interrupted — will resume automatically when online.')
            break
          }
          // Record error on item without losing user data
          const next = updateOutboxItem(head.id, {
            attempts: (head.attempts || 0) + 1,
            lastError: err?.message || 'Sync error',
          })
          setPendingQueue(next)
          setSyncError(err?.message || 'Some queued actions need attention.')
          break
        }
      }

      if (syncedCount > 0) {
        setLastSyncAt(new Date().toISOString())
        try {
          await refreshFromServer()
        } catch {
          // ignore refresh failure if network dropped right after drain
        }
      }
      return { synced: syncedCount, remaining: loadOutbox().length }
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [executeOutboxEntry, refreshFromServer])

  const clearFailedQueueItem = useCallback(id => {
    const next = removeOutboxItem(id)
    setPendingQueue(next)
  }, [])

  // ── Bootstrap on mount (offline-resilient) ──────────────────────────────────
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
        branches.forEach(b => {
          if (b.state) branchData[b.id] = b.state
          if (b.version) api.saveVersion(b.id, b.version)
        })
        setAuthState({
          loading: false,
          error: null,
          offlineHydrated: false,
          user: boot.user,
          tenant: boot.tenant,
          staff: boot.staff || [],
          branches,
          activeBranchId,
          branchData,
        })
      })
      .catch(err => {
        if (err?.isUnauthorized) {
          api.clearToken()
          clearCachedSession()
          setAuthState(prev => ({ ...prev, loading: false }))
          return
        }
        // Offline / slow network fallback: hydrate last cached session!
        const cached = loadCachedSession()
        if (cached) {
          setAuthState({
            loading: false,
            error: null,
            offlineHydrated: true,
            user: cached.user,
            tenant: cached.tenant,
            staff: cached.staff || [],
            branches: cached.branches || [],
            activeBranchId: cached.activeBranchId || cached.branches?.[0]?.id || null,
            branchData: cached.branchData || {},
          })
        } else {
          setAuthState(prev => ({ ...prev, loading: false, error: err?.message || 'Unable to connect' }))
        }
      })
  }, [])

  // ── Auto-sync when connectivity returns ─────────────────────────────────────
  useEffect(() => {
    if (device.isOnline && authState.user && pendingQueue.length > 0 && !syncingRef.current) {
      const timer = setTimeout(() => { syncNow() }, 900)
      return () => clearTimeout(timer)
    }
  }, [device.isOnline, authState.user, pendingQueue.length, syncNow])

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
        loading: false, error: null, offlineHydrated: false,
        user: boot.user, tenant: boot.tenant,
        staff: boot.staff || [], branches,
        activeBranchId, branchData,
      })
      return data
    },

    logout: async () => {
      await api.logout()
      clearCachedSession()
      setPendingQueue([])
      setAuthState({ loading: false, error: null, offlineHydrated: false, user: null, tenant: null, staff: [], branches: [], activeBranchId: null, branchData: {} })
    },

    register: async (form) => {
      const data = await api.register(form)
      const boot = await api.bootstrap()
      const branches = boot.branches || []
      const branchData = {}
      branches.forEach(b => { if (b.state) branchData[b.id] = b.state })
      setAuthState({
        loading: false, error: null, offlineHydrated: false,
        user: boot.user, tenant: boot.tenant,
        staff: boot.staff || [], branches,
        activeBranchId: branches[0]?.id || null, branchData,
      })
      return data
    },

    switchBranch: async (branchId) => {
      setAuthState(prev => ({ ...prev, activeBranchId: branchId }))
      if (!authState.branchData[branchId] && navigator.onLine !== false) {
        try {
          const bs = await api.getBranchState(branchId)
          setBranchData(branchId, bs.state || {})
        } catch {
          // keep cached state if offline
        }
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

    refreshSession: refreshFromServer,
  }

  // ── Branch actions (a.*) ─────────────────────────────────────────────────────
  const a = {

    // ── Season ────────────────────────────────────────────────────────────────
    setActiveSeason: seasonId => queueOrRun({
      op: 'setActiveSeason',
      label: 'Switch active season',
      payload: { seasonId },
      applyLocal: cur => ({ ...cur, activeSeasonId: seasonId }),
      runOnline: async () => {
        patchBranchData(bid, { activeSeasonId: seasonId })
        return api.setActiveSeason(bid, seasonId)
      },
    }),

    addSeason: d => {
      const tempId = uid('sea_')
      return queueOrRun({
        op: 'addSeason',
        label: `Create season ${d.name || ''}`,
        payload: d,
        tempId,
        applyLocal: cur => ({
          ...cur,
          seasons: [{ id: tempId, ...d, offlinePending: true }, ...(cur.seasons || [])],
        }),
        runOnline: async () => {
          const r = await api.addSeason(bid, d)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, seasons: [r.season, ...(cur.seasons || [])] } } }
          })
          return r
        },
      })
    },

    // ── Suppliers ─────────────────────────────────────────────────────────────
    addSup: async d => {
      const tempId = uid('sup_')
      const tempNo = `SUP-OFF-${String(Date.now()).slice(-3)}`
      const res = await queueOrRun({
        op: 'addSup',
        label: `Register supplier ${d.name || ''}`,
        payload: d,
        tempId,
        applyLocal: cur => ({
          branchPatch: {
            suppliers: [...(cur.suppliers || []), { id: tempId, no: tempNo, ...d, offlinePending: true }],
          },
          result: { itemId: tempId },
        }),
        runOnline: async () => {
          const r = await api.createCollectionItem(bid, 'suppliers', d)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, suppliers: [...(cur.suppliers || []), r.item] } } }
          })
          return { itemId: r.item?.id }
        },
      })
      return res?.itemId || tempId
    },

    addCus: d => {
      const tempId = uid('cus_')
      return queueOrRun({
        op: 'addCus',
        label: `Register buyer ${d.name || ''}`,
        payload: d,
        tempId,
        applyLocal: cur => ({
          ...cur,
          customers: [...(cur.customers || []), { id: tempId, ...d, offlinePending: true }],
        }),
        runOnline: async () => {
          const r = await api.createCollectionItem(bid, 'customers', d)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, customers: [...(cur.customers || []), r.item] } } }
          })
        },
      })
    },

    // ── Procurement ───────────────────────────────────────────────────────────
    buy: async d => {
      const payload = {
        supplier_id: d.sup,
        source_type: d.sourceType || 'independent',
        boat_id: d.boatId || '',
        fisherman_id: d.fishermanId || '',
        fisherman_name: d.fishermanName || '',
        species: d.sp,
        grade: d.grade,
        kg: +d.kg || 0,
        price_per_kg: +d.price || 0,
        site: d.site,
        warehouse: d.wh || '',
        paid_now: +d.paid || 0,
        fuel_deducted: +d.fuelDeducted || 0,
        maint_deducted: +d.maintDeducted || 0,
        payment_method: d.method || 'Cash Voucher',
        notes: d.notes || '',
      }
      const tempId = uid('bat_')
      const purNo = 'PUR-OFF-' + String(Date.now()).slice(-4)
      const batNo = 'BAT-OFF-' + String(Date.now()).slice(-4)
      const syntheticBatch = {
        id: tempId,
        no: batNo,
        pur: purNo,
        sup: d.sup,
        sp: d.sp,
        grade: d.grade || 'A',
        kg: +d.kg || 0,
        rem: +d.kg || 0,
        rej: 0,
        price: +d.price || 0,
        site: d.site,
        wh: d.wh || COLD_ROOMS[0],
        date: today(),
        at: nowL(),
        st: 'pending',
        ded: (+d.fuelDeducted || 0) + (+d.maintDeducted || 0),
        notes: d.notes || '',
        offlinePending: true,
      }
      const syntheticPayment = (+d.paid || 0) > 0 ? {
        id: uid('pay_'),
        no: 'PAY-OFF-' + String(Date.now()).slice(-4),
        sup: d.sup,
        pur: purNo,
        amt: +d.paid,
        m: d.method || 'Cash Voucher',
        date: today(),
        offlinePending: true,
      } : null
      const syntheticSettlement = ((+d.fuelDeducted || 0) + (+d.maintDeducted || 0)) > 0 ? {
        id: uid('set_'),
        no: 'SET-OFF-' + String(Date.now()).slice(-4),
        supId: d.sup,
        purId: purNo,
        fuelDeducted: +d.fuelDeducted || 0,
        maintDeducted: +d.maintDeducted || 0,
        date: today(),
        offlinePending: true,
      } : null

      return queueOrRun({
        op: 'buy',
        label: `Fish purchase ${d.sp} (${d.kg} kg)`,
        payload,
        tempId,
        applyLocal: cur => ({
          branchPatch: {
            batches: [syntheticBatch, ...(cur.batches || [])],
            pays: syntheticPayment ? [syntheticPayment, ...(cur.pays || [])] : (cur.pays || []),
            settlements: syntheticSettlement ? [syntheticSettlement, ...(cur.settlements || [])] : (cur.settlements || []),
          },
          result: { batch: syntheticBatch, payment: syntheticPayment, settlement: syntheticSettlement },
        }),
        runOnline: async () => {
          const r = await api.recordPurchase(bid, payload)
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
        },
      })
    },

    inspect: (id, acc, temp, reason) => queueOrRun({
      op: 'inspect',
      label: `QC inspect batch (${acc} kg)`,
      payload: { id, data: { accepted_kg: acc, temperature_c: temp, reason: reason || '' } },
      applyLocal: cur => ({
        ...cur,
        batches: (cur.batches || []).map(b => b.id !== id ? b : { ...b, rem: acc, rej: b.kg - acc, temp, reason, st: acc > 0 ? 'accepted' : 'rejected', offlinePending: true }),
      }),
      runOnline: () => mutation(
        d => ({ ...d, batches: d.batches.map(b => b.id !== id ? b : { ...b, rem: acc, rej: b.kg - acc, temp, reason, st: acc > 0 ? 'accepted' : 'rejected' }) }),
        () => api.inspectBatch(bid, id, { accepted_kg: acc, temperature_c: temp, reason: reason || '' })
      ),
    }),

    transfer: (id, to) => queueOrRun({
      op: 'transfer',
      label: `Transfer batch to ${to}`,
      payload: { id, to },
      applyLocal: cur => ({
        ...cur,
        batches: (cur.batches || []).map(b => b.id !== id ? b : { ...b, wh: to, offlinePending: true }),
      }),
      runOnline: () => mutation(
        d => ({ ...d, batches: d.batches.map(b => b.id !== id ? b : { ...b, wh: to }) }),
        () => api.transferBatch(bid, id, to)
      ),
    }),

    waste: (id, kg, why) => queueOrRun({
      op: 'waste',
      label: `Log spoilage (${kg} kg)`,
      payload: { id, kg, why: why || '' },
      applyLocal: cur => ({
        ...cur,
        batches: (cur.batches || []).map(b => b.id !== id ? b : { ...b, rem: Math.max(0, b.rem - kg), waste: (b.waste || 0) + kg, offlinePending: true }),
      }),
      runOnline: () => mutation(
        d => ({ ...d, batches: d.batches.map(b => b.id !== id ? b : { ...b, rem: b.rem - kg, waste: (b.waste || 0) + kg }) }),
        () => api.recordWaste(bid, id, kg, why || '')
      ),
    }),

    // ── Payments ──────────────────────────────────────────────────────────────
    pay: (sup, amt, m, pur = '') => queueOrRun({
      op: 'pay',
      label: `Supplier payment (${amt} TZS)`,
      payload: { supplier_id: sup, amount: amt, method: m, pur },
      applyLocal: cur => ({
        ...cur,
        pays: [{ id: uid('pay_'), no: 'PAY-OFF-' + String(Date.now()).slice(-4), sup, pur, amt: +amt, m, date: today(), offlinePending: true }, ...(cur.pays || [])],
      }),
      runOnline: async () => {
        const r = await api.paySupplier(bid, { supplier_id: sup, amount: amt, method: m })
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, pays: [r.payment, ...(cur.pays || [])] } } }
        })
      },
    }),

    // ── Sales ─────────────────────────────────────────────────────────────────
    sell: async d => {
      const tempId = uid('sale_')
      const payload = {
        customer_id: d.cus, species: d.sp, grade: d.grade,
        kg: +d.kg || 0, price_per_kg: +d.price || 0, paid_now: +d.paid || 0,
      }
      const syntheticSale = {
        id: tempId,
        no: 'INV-OFF-' + String(Date.now()).slice(-4),
        cus: d.cus,
        sp: d.sp,
        grade: d.grade || 'A',
        kg: +d.kg || 0,
        price: +d.price || 0,
        paid: +d.paid || 0,
        date: today(),
        offlinePending: true,
      }
      const res = await queueOrRun({
        op: 'sell',
        label: `Industry sale ${d.sp} (${d.kg} kg)`,
        payload,
        tempId,
        applyLocal: cur => ({
          branchPatch: {
            sales: [syntheticSale, ...(cur.sales || [])],
          },
          result: { sale: syntheticSale },
        }),
        runOnline: async () => {
          const r = await api.recordSale(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, sales: [r.sale, ...(cur.sales || [])] } } }
          })
          return { sale: r.sale }
        },
      })
      return res?.sale || syntheticSale
    },

    receive: (id, amt) => queueOrRun({
      op: 'receive',
      label: `Receive sale payment (${amt} TZS)`,
      payload: { id, amt, method: 'Bank RTGS' },
      applyLocal: cur => ({
        ...cur,
        sales: (cur.sales || []).map(x => x.id !== id ? x : { ...x, paid: (x.paid || 0) + amt, offlinePending: true }),
      }),
      runOnline: () => mutation(
        d => ({ ...d, sales: d.sales.map(x => x.id !== id ? x : { ...x, paid: x.paid + amt }) }),
        () => api.receiveSalePayment(bid, id, amt, 'Bank RTGS')
      ),
    }),

    dispatch: (id, dis) => queueOrRun({
      op: 'dispatch',
      label: `Dispatch order ${dis.veh || ''}`,
      payload: { id, data: { vehicle: dis.veh, driver: dis.drv, status: dis.st, temperature: dis.temp || '2.0°C' } },
      applyLocal: cur => ({
        ...cur,
        sales: (cur.sales || []).map(x => x.id !== id ? x : { ...x, dis, offlinePending: true }),
      }),
      runOnline: () => mutation(
        d => ({ ...d, sales: d.sales.map(x => x.id !== id ? x : { ...x, dis }) }),
        () => api.dispatchSale(bid, id, { vehicle: dis.veh, driver: dis.drv, status: dis.st, temperature: dis.temp || '2.0°C' })
      ),
    }),

    // ── Expenses, Compliance, Transport ───────────────────────────────────────
    addExp: d => queueOrRun({
      op: 'addExp',
      label: `Log expense (${d.cat})`,
      payload: { category: d.cat, amount: d.amt, description: d.desc || '', date: d.date || today() },
      applyLocal: cur => ({
        ...cur,
        exps: [{ id: uid('e'), date: today(), ...d, offlinePending: true }, ...(cur.exps || [])],
      }),
      runOnline: () => mutation(
        dt => ({ ...dt, exps: [{ id: uid('e'), date: today(), ...d }, ...(dt.exps || [])] }),
        () => api.recordExpense(bid, { category: d.cat, amount: d.amt, description: d.desc || '', date: d.date || today() })
      ),
    }),

    addComp: d => queueOrRun({
      op: 'addComp',
      label: `Add permit ${d.ref || ''}`,
      payload: { permit_type: d.type, reference: d.ref, authority: d.who, expiry_date: d.exp },
      applyLocal: cur => ({
        ...cur,
        comp: [{ id: uid('k'), ...d, offlinePending: true }, ...(cur.comp || [])],
      }),
      runOnline: () => mutation(
        dt => ({ ...dt, comp: [{ id: uid('k'), ...d }, ...(dt.comp || [])] }),
        () => api.addPermit(bid, { permit_type: d.type, reference: d.ref, authority: d.who, expiry_date: d.exp })
      ),
    }),

    addTrip: d => queueOrRun({
      op: 'addTrip',
      label: `Log trip (${d.from} -> ${d.to})`,
      payload: {
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
      },
      applyLocal: cur => ({
        ...cur,
        trips: [{ id: uid('t'), ...d, offlinePending: true }, ...(cur.trips || [])],
      }),
      runOnline: () => mutation(
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
    }),

    // ── Fuel ─────────────────────────────────────────────────────────────────
    issueFuel: d => queueOrRun({
      op: 'issueFuel',
      label: `Issue fuel (${d.litres} L)`,
      payload: {
        supplier_id: d.supId, boat_id: d.boatId, tank_id: d.tankId,
        litres: d.litres, price_per_litre: d.price, paid_now: +d.paid || 0,
        arrangement: d.arrangement || 'Partial', notes: d.notes || '',
      },
      applyLocal: cur => {
        const tank = (cur.fuelTanks || []).find(t => t.id === d.tankId)
        const issue = {
          id: uid('fi_'),
          no: 'FUL-OFF-' + String(Date.now()).slice(-4),
          date: today(),
          supId: d.supId,
          boatId: d.boatId,
          tankId: d.tankId,
          fuel: tank?.fuel || 'Petrol',
          litres: +d.litres || 0,
          price: +d.price || 0,
          total: (+d.litres || 0) * (+d.price || 0),
          paid: +d.paid || 0,
          arrangement: d.arrangement || 'Partial',
          offlinePending: true,
        }
        return {
          ...cur,
          fuelIssues: [issue, ...(cur.fuelIssues || [])],
          fuelTanks: (cur.fuelTanks || []).map(t => t.id === d.tankId ? { ...t, current: Math.max(0, (t.current || 0) - d.litres) } : t),
        }
      },
      runOnline: async () => {
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
      },
    }),

    receiveFuel: d => queueOrRun({
      op: 'receiveFuel',
      label: `Restock fuel (${d.litres} L)`,
      payload: {
        tank_id: d.tankId, fuel_type: d.fuel, litres: d.litres,
        cost_per_litre: d.costPerL, fuel_supplier_name: d.supName || '',
        doc_ref: d.docRef || '', status: 'Paid',
      },
      applyLocal: cur => ({
        ...cur,
        fuelPurchases: [{
          id: uid('fp_'), date: today(), tankId: d.tankId, fuel: d.fuel,
          litres: +d.litres, costPerL: +d.costPerL, supName: d.supName || '',
          docRef: d.docRef || '', total: (+d.litres || 0) * (+d.costPerL || 0), offlinePending: true,
        }, ...(cur.fuelPurchases || [])],
        fuelTanks: (cur.fuelTanks || []).map(t => t.id === d.tankId ? { ...t, current: (t.current || 0) + (+d.litres || 0) } : t),
      }),
      runOnline: async () => {
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
      },
    }),

    payFuelDebt: (supId, amt, m, notes = '') => queueOrRun({
      op: 'payFuelDebt',
      label: `Pay fuel debt (${amt} TZS)`,
      payload: { supplier_id: supId, amount: amt, method: m, notes },
      applyLocal: cur => ({
        ...cur,
        fuelPayments: [{ id: uid('fpay_'), supId, amt: +amt, m, notes, date: today(), offlinePending: true }, ...(cur.fuelPayments || [])],
      }),
      runOnline: async () => {
        const r = await api.payFuelDebt(bid, { supplier_id: supId, amount: amt, method: m, notes })
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, fuelPayments: [r.payment, ...(cur.fuelPayments || [])] } } }
        })
      },
    }),

    // ── Maintenance ───────────────────────────────────────────────────────────
    addWorkOrder: d => {
      const tempId = uid('wo_')
      const payload = {
        boat_id: d.boatId, supplier_id: d.supId || 'company',
        title: d.title, fault: d.fault || '', mechanic: d.mechanic || '',
        arrangement: d.arrangement || 'Company-paid',
        parts: (d.parts || []).map(p => ({ part_id: p.partId, name: p.name, qty: p.qty, cost: p.cost })),
        parts_cost: d.partsCost || 0, labor_cost: d.laborCost || 0, other_cost: d.otherCost || 0,
        notes: d.notes || '',
      }
      return queueOrRun({
        op: 'addWorkOrder',
        label: `Work order: ${d.title}`,
        payload,
        tempId,
        applyLocal: cur => ({
          ...cur,
          maintenanceOrders: [{
            id: tempId,
            no: 'WO-OFF-' + String(Date.now()).slice(-4),
            date: today(),
            boatId: d.boatId,
            supId: d.supId || 'company',
            title: d.title,
            fault: d.fault || '',
            mechanic: d.mechanic || '',
            arrangement: d.arrangement || 'Company-paid',
            parts: d.parts || [],
            partsCost: d.partsCost || 0,
            laborCost: d.laborCost || 0,
            totalCost: (d.partsCost || 0) + (d.laborCost || 0) + (d.otherCost || 0),
            status: 'Reported',
            offlinePending: true,
          }, ...(cur.maintenanceOrders || [])],
        }),
        runOnline: async () => {
          const r = await api.createWorkOrder(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, maintenanceOrders: [r.work_order, ...(cur.maintenanceOrders || [])] } } }
          })
        },
      })
    },

    updateWorkOrder: (id, d) => queueOrRun({
      op: 'updateWorkOrder',
      label: `Update work order status (${d.status || 'In Progress'})`,
      payload: { id, status: d.status || 'In Progress' },
      applyLocal: cur => ({
        ...cur,
        maintenanceOrders: (cur.maintenanceOrders || []).map(w => w.id !== id ? w : { ...w, ...d, offlinePending: true }),
      }),
      runOnline: () => mutation(
        dt => ({ ...dt, maintenanceOrders: dt.maintenanceOrders.map(w => w.id !== id ? w : { ...w, ...d }) }),
        () => api.updateWorkOrderStatus(bid, id, d.status || 'In Progress')
      ),
    }),

    addSparePart: d => queueOrRun({
      op: 'addSparePart',
      label: `Register spare part ${d.name || ''}`,
      payload: d,
      applyLocal: cur => ({
        ...cur,
        spareParts: [{ id: uid('sp_'), ...d, offlinePending: true }, ...(cur.spareParts || [])],
      }),
      runOnline: async () => {
        await api.createCollectionItem(bid, 'spareParts', d)
        const r = await api.listCollection(bid, 'spareParts')
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, spareParts: r.items || [] } } }
        })
      },
    }),

    addBoat: d => {
      const tempId = uid('boat_')
      return queueOrRun({
        op: 'addBoat',
        label: `Register vessel ${d.name || ''}`,
        payload: d,
        tempId,
        applyLocal: cur => ({
          ...cur,
          boats: [...(cur.boats || []), { id: tempId, ...d, offlinePending: true }],
        }),
        runOnline: async () => {
          const r = await api.createCollectionItem(bid, 'boats', d)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, boats: [...(cur.boats || []), r.item] } } }
          })
        },
      })
    },

    updateBoat: (id, d) => queueOrRun({
      op: 'updateBoat',
      label: 'Update boat specs',
      payload: { id, patch: d },
      applyLocal: cur => ({
        ...cur,
        boats: (cur.boats || []).map(b => b.id !== id ? b : { ...b, ...d, offlinePending: true }),
      }),
      runOnline: () => mutation(
        dt => ({ ...dt, boats: dt.boats.map(b => b.id !== id ? b : { ...b, ...d }) }),
        () => api.patchCollectionItem(bid, 'boats', id, d)
      ),
    }),

    // ── Gear ─────────────────────────────────────────────────────────────────
    addGearItem: d => queueOrRun({
      op: 'addGearItem',
      label: `Add gear item ${d.name || ''}`,
      payload: d,
      applyLocal: cur => ({
        ...cur,
        gearItems: [...(cur.gearItems || []), { id: uid('gr_'), ...d, offlinePending: true }],
      }),
      runOnline: async () => {
        const r = await api.createCollectionItem(bid, 'gearItems', d)
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, gearItems: [...(cur.gearItems || []), r.item] } } }
        })
      },
    }),

    issueGear: d => {
      const payload = {
        supplier_id: d.supId, boat_id: d.boatId,
        arrangement: d.arrangement || 'Fisherman-recoverable (Credit)',
        items: (d.items || []).map(i => ({ item_id: i.itemId, quantity: i.qty })),
        notes: d.notes || '',
      }
      return queueOrRun({
        op: 'issueGear',
        label: 'Issue fishing gear',
        payload,
        applyLocal: cur => ({
          ...cur,
          gearIssues: [{
            id: uid('gi_'), no: 'GR-OFF-' + String(Date.now()).slice(-4), date: today(),
            supId: d.supId, boatId: d.boatId, items: d.items || [],
            status: 'Issued', offlinePending: true,
          }, ...(cur.gearIssues || [])],
        }),
        runOnline: async () => {
          const r = await api.issueGear(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, gearIssues: [r.issue, ...(cur.gearIssues || [])] } } }
          })
        },
      })
    },

    returnGear: (issueId, d) => {
      const data = {
        returned_condition: d.returnedCondition || 'Good',
        returned_qty: d.returnedQty || 0,
        restock: d.restock !== false,
        liability_action: d.liabilityAction || 'Credit / Clear Fisherman Debt',
        return_notes: d.returnNotes || '',
      }
      return queueOrRun({
        op: 'returnGear',
        label: 'Reconcile returned gear',
        payload: { issueId, data },
        applyLocal: cur => ({
          ...cur,
          gearIssues: (cur.gearIssues || []).map(g => g.id !== issueId ? g : {
            ...g, status: 'Returned & Reconciled', returnedQty: d.returnedQty, returnedCondition: d.returnedCondition, offlinePending: true,
          }),
        }),
        runOnline: async () => {
          await api.returnGear(bid, issueId, data)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: {
              ...cur,
              gearIssues: (cur.gearIssues || []).map(g => g.id !== issueId ? g : { ...g, status: 'Returned & Reconciled', returnedQty: d.returnedQty, returnedCondition: d.returnedCondition }),
            } } }
          })
        },
      })
    },

    // ── Catering ─────────────────────────────────────────────────────────────
    addCook: d => queueOrRun({
      op: 'addCook',
      label: `Add camp cook ${d.name || ''}`,
      payload: d,
      applyLocal: cur => ({
        ...cur,
        cateringCooks: [...(cur.cateringCooks || []), { id: uid('ck_'), ...d, offlinePending: true }],
      }),
      runOnline: async () => {
        const r = await api.createCollectionItem(bid, 'cateringCooks', d)
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, cateringCooks: [...(cur.cateringCooks || []), r.item] } } }
        })
      },
    }),

    issueCookAdvance: d => {
      const payload = {
        cook_id: d.cookId, amount: d.amountIssued, purpose: d.purpose || '',
        allocated_boats: d.allocatedBoats || [],
      }
      return queueOrRun({
        op: 'issueCookAdvance',
        label: `Issue cook float (${d.amountIssued} TZS)`,
        payload,
        applyLocal: cur => ({
          ...cur,
          cookAdvances: [{ id: uid('ca_'), date: today(), cookId: d.cookId, amountIssued: d.amountIssued, purpose: d.purpose || '', offlinePending: true }, ...(cur.cookAdvances || [])],
        }),
        runOnline: async () => {
          const r = await api.issueCookAdvance(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, cookAdvances: [r.advance, ...(cur.cookAdvances || [])] } } }
          })
        },
      })
    },

    recordCateringExpense: d => {
      const payload = {
        cook_id: d.cookId, advance_ref: d.advanceRef || '',
        total_spent: d.totalSpent, meal_type: d.mealType || 'Lunch & Supper',
        crew_size: d.crewSize || 0, meals_count: d.mealsCount || 0,
        money_returned: d.moneyReturned || 0,
        arrangement: d.arrangement || 'Fisherman-recoverable (Catch Deduction)',
        notes: d.notes || '',
        boat_allocations: (d.boatAllocations || []).map(a => ({
          boat_id: a.boatId, supplier_id: a.supId || '', cost: a.cost, recoverable: a.recoverable
        })),
      }
      return queueOrRun({
        op: 'recordCateringExpense',
        label: `Catering expense (${d.totalSpent} TZS)`,
        payload,
        applyLocal: cur => ({
          ...cur,
          cateringExpenses: [{ id: uid('ce_'), date: today(), cookId: d.cookId, totalSpent: d.totalSpent, mealType: d.mealType || 'Lunch & Supper', offlinePending: true }, ...(cur.cateringExpenses || [])],
        }),
        runOnline: async () => {
          const r = await api.recordCateringExpense(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, cateringExpenses: [r.expense, ...(cur.cateringExpenses || [])] } } }
          })
        },
      })
    },

    // ── Cash Advances ─────────────────────────────────────────────────────────
    requestAdvance: d => {
      const payload = {
        supplier_id: d.supId, boat_id: d.boatId,
        amount: d.amount, category: d.category || 'Daily Matumizi',
        purpose: d.purpose || '', method: d.method || 'Cash', phone: d.phone || '',
        classification: d.classification || 'Fisherman-recoverable',
      }
      return queueOrRun({
        op: 'requestAdvance',
        label: `Request advance (${d.amount} TZS)`,
        payload,
        applyLocal: cur => ({
          ...cur,
          advances: [{ id: uid('adv_'), date: today(), supId: d.supId, boatId: d.boatId, amount: d.amount, category: d.category || 'Daily Matumizi', status: 'Pending', offlinePending: true }, ...(cur.advances || [])],
        }),
        runOnline: async () => {
          const r = await api.requestAdvance(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, advances: [r.advance, ...(cur.advances || [])] } } }
          })
        },
      })
    },

    approveAdvance: (id, status, approvedAmount) => queueOrRun({
      op: 'approveAdvance',
      label: `${status} advance`,
      payload: { id, data: { new_status: status, approved_amount: approvedAmount || undefined } },
      applyLocal: cur => ({
        ...cur,
        advances: (cur.advances || []).map(a => a.id !== id ? a : { ...a, status, offlinePending: true }),
      }),
      runOnline: async () => {
        await api.approveAdvance(bid, id, { new_status: status, approved_amount: approvedAmount || undefined })
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          return { ...prev, branchData: { ...prev.branchData, [bid]: {
            ...cur,
            advances: (cur.advances || []).map(a => a.id !== id ? a : { ...a, status, approvedBy: prev.user?.name || '' }),
          } } }
        })
      },
    }),

    repayAdvance: (id, amt, m) => queueOrRun({
      op: 'repayAdvance',
      label: `Repay advance (${amt} TZS)`,
      payload: { id, data: { amount: amt, method: m } },
      applyLocal: cur => ({
        ...cur,
        advances: (cur.advances || []).map(a => a.id !== id ? a : { ...a, recovered: (a.recovered || 0) + amt, offlinePending: true }),
      }),
      runOnline: async () => {
        await api.repayAdvance(bid, id, { amount: amt, method: m })
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          return { ...prev, branchData: { ...prev.branchData, [bid]: {
            ...cur,
            advances: (cur.advances || []).map(a => a.id !== id ? a : { ...a, recovered: (a.recovered || 0) + amt }),
          } } }
        })
      },
    }),

    // ── Boat Projects ─────────────────────────────────────────────────────────
    addBoatProject: d => {
      const tempId = uid('bp_')
      const payload = {
        name: d.name, builder: d.builder || '', builder_phone: d.builderPhone || '',
        timber_materials: d.timberMaterials || 0, labour: d.labour || 0,
        engine: d.engine || 0, equipment: d.equipment || 0,
        ownership_type: d.ownershipType || 'Company Asset',
        contractual_recoverable: d.contractualRecoverable || 0,
        repayment_terms: d.repaymentTerms || '',
        start_date: d.startDate || today(), target_completion: d.targetCompletion || '',
        stages: (d.stages || []).map(st => ({ name: st.name, cost: st.cost, status: st.status || 'Pending', date: st.date || today() })),
        notes: d.notes || '',
      }
      return queueOrRun({
        op: 'addBoatProject',
        label: `Boat project: ${d.name}`,
        payload,
        tempId,
        applyLocal: cur => ({
          ...cur,
          boatProjects: [{ id: tempId, ...d, progressPct: 0, status: 'Active', offlinePending: true }, ...(cur.boatProjects || [])],
        }),
        runOnline: async () => {
          const r = await api.createBoatProject(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, boatProjects: [r.project, ...(cur.boatProjects || [])] } } }
          })
        },
      })
    },

    updateProjectProgress: (id, pct, status) => queueOrRun({
      op: 'updateProjectProgress',
      label: `Update boat project (${pct}%)`,
      payload: { id, data: { progress_pct: pct, status } },
      applyLocal: cur => ({
        ...cur,
        boatProjects: (cur.boatProjects || []).map(p => p.id !== id ? p : { ...p, progressPct: pct, status, offlinePending: true }),
      }),
      runOnline: async () => {
        await api.updateProjectProgress(bid, id, { progress_pct: pct, status })
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          return { ...prev, branchData: { ...prev.branchData, [bid]: {
            ...cur,
            boatProjects: (cur.boatProjects || []).map(p => p.id !== id ? p : { ...p, progressPct: pct, status }),
          } } }
        })
      },
    }),

    addProjectPayment: (id, amt, stageName) => queueOrRun({
      op: 'addProjectPayment',
      label: `Project payment (${amt} TZS)`,
      payload: { id, data: { stage_name: stageName, amount: amt } },
      applyLocal: cur => ({
        ...cur,
        boatProjects: (cur.boatProjects || []).map(p => p.id !== id ? p : {
          ...p, paidStages: (p.paidStages || 0) + amt, balanceToPay: Math.max(0, (p.balanceToPay || 0) - amt), offlinePending: true,
        }),
      }),
      runOnline: async () => {
        await api.recordProjectPayment(bid, id, { stage_name: stageName, amount: amt })
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          return { ...prev, branchData: { ...prev.branchData, [bid]: {
            ...cur,
            boatProjects: (cur.boatProjects || []).map(p => p.id !== id ? p : { ...p, paidStages: (p.paidStages || 0) + amt, balanceToPay: Math.max(0, (p.balanceToPay || 0) - amt) }),
          } } }
        })
      },
    }),

    // ── Crew Management ───────────────────────────────────────────────────────
    assignBoatCrew: d => {
      const payload = {
        boat_id: d.boatId, boat_reg: d.boatReg || '', boat_name: d.boatName || '',
        supplier_id: d.supId, fisherman_name: d.fishermanName,
        position: d.position || 'Crew', account_type: d.accountType || 'Permanent',
        phone: d.phone || '', nida: d.nida || '', start_date: d.startDate || today(),
        rate_agreement: d.rateAgreement || '', notes: d.notes || '',
      }
      return queueOrRun({
        op: 'assignBoatCrew',
        label: `Assign crew: ${d.fishermanName}`,
        payload,
        applyLocal: cur => ({
          ...cur,
          boatCrewAssignments: [{ id: uid('ca_'), ...d, status: 'Active', offlinePending: true }, ...(cur.boatCrewAssignments || [])],
        }),
        runOnline: async () => {
          const r = await api.assignCrew(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, boatCrewAssignments: [r.assignment, ...(cur.boatCrewAssignments || [])] } } }
          })
        },
      })
    },

    createKibaluaEngagement: d => {
      const tempId = uid('kib_')
      const payload = {
        boat_id: d.boatId, boat_reg: d.boatReg || '', boat_name: d.boatName || '',
        fisherman_name: d.fishermanName, phone: d.phone || '',
        duration_days: d.durationDays, start_date: d.startDate, end_date: d.endDate,
        daily_rate: d.dailyRate, advance_paid: d.advancePaid || 0, notes: d.notes || '',
      }
      return queueOrRun({
        op: 'createKibaluaEngagement',
        label: `Kibalua contract: ${d.fishermanName}`,
        payload,
        tempId,
        applyLocal: cur => ({
          ...cur,
          kibaluaEngagements: [{ id: tempId, ...d, status: 'Active', offlinePending: true }, ...(cur.kibaluaEngagements || [])],
        }),
        runOnline: async () => {
          const r = await api.createKibalua(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, kibaluaEngagements: [r.engagement, ...(cur.kibaluaEngagements || [])] } } }
          })
        },
      })
    },

    completeKibaluaEngagement: (id, d) => queueOrRun({
      op: 'completeKibaluaEngagement',
      label: 'Settle Kibalua contract',
      payload: { id, data: { final_payment: d.finalPaymentPaid || 0, method: d.paymentMethod || 'Cash', notes: d.notes || '' } },
      applyLocal: cur => ({
        ...cur,
        kibaluaEngagements: (cur.kibaluaEngagements || []).map(k => k.id !== id ? k : { ...k, status: 'Completed', offlinePending: true }),
      }),
      runOnline: async () => {
        await api.settleKibalua(bid, id, { final_payment: d.finalPaymentPaid || 0, method: d.paymentMethod || 'Cash', notes: d.notes || '' })
        setAuthState(prev => {
          const cur = prev.branchData[bid] || {}
          return { ...prev, branchData: { ...prev.branchData, [bid]: {
            ...cur,
            kibaluaEngagements: (cur.kibaluaEngagements || []).map(k => k.id !== id ? k : { ...k, status: 'Completed' }),
          } } }
        })
      },
    }),

    processFishermanExit: d => {
      const payload = {
        assignment_id: d.assignmentId, last_working_date: d.lastWorkingDate,
        reason: d.reason || 'Resigned', outstanding_advances: +d.outstandingAdvances || 0,
        unreturned_gear: d.unreturnedGear || 'None',
        final_balance_due: +d.finalBalanceDue || 0, notes: d.notes || '',
      }
      return queueOrRun({
        op: 'processFishermanExit',
        label: 'Process fisherman exit',
        payload,
        applyLocal: cur => ({
          ...cur,
          fishermanExitRecords: [{ id: uid('ex_'), ...d, offlinePending: true }, ...(cur.fishermanExitRecords || [])],
          boatCrewAssignments: (cur.boatCrewAssignments || []).map(a => a.id !== d.assignmentId ? a : { ...a, status: 'Exited', endDate: d.lastWorkingDate }),
        }),
        runOnline: async () => {
          const r = await api.fishermanExit(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: {
              ...cur,
              fishermanExitRecords: [r.exit_record, ...(cur.fishermanExitRecords || [])],
              boatCrewAssignments: (cur.boatCrewAssignments || []).map(a => a.id !== d.assignmentId ? a : { ...a, status: 'Exited', endDate: d.lastWorkingDate }),
            } } }
          })
        },
      })
    },

    allocateBoatExpense: d => {
      const payload = {
        boat_id: d.boatId, boat_reg: d.boatReg || '', boat_name: d.boatName || '',
        expense_type: d.expenseType, description: d.description || '',
        total_amount: d.totalAmount, rule: d.rule || 'Equal allocation',
        crew_supplier_ids: (d.splitItems || []).map(si => si.supId),
        notes: d.notes || '',
      }
      return queueOrRun({
        op: 'allocateBoatExpense',
        label: `Allocate boat expense (${d.totalAmount} TZS)`,
        payload,
        applyLocal: cur => ({
          ...cur,
          boatExpenseAllocations: [{ id: uid('ba_'), date: today(), ...d, offlinePending: true }, ...(cur.boatExpenseAllocations || [])],
        }),
        runOnline: async () => {
          const r = await api.allocateBoatExpense(bid, payload)
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: { ...cur, boatExpenseAllocations: [r.allocation, ...(cur.boatExpenseAllocations || [])] } } }
          })
        },
      })
    },

    setActiveBoat: boatId => {
      patchBranchData(bid, { activeBoatId: boatId })
    },

    // ── Full Settlement ───────────────────────────────────────────────────────
    createSeasonSettlement: d => {
      const payload = {
        supplier_id: d.supId, boat_id: d.boatId, season_id: d.seasonId || '',
        agreed_earnings: d.agreedEarnings, previous_paid: d.previousPaid || 0,
        fuel_deducted: d.fuelDeducted || 0, maint_deducted: d.maintDeducted || 0,
        gear_deducted: d.gearDeducted || 0, food_deducted: d.foodDeducted || 0,
        advances_deducted: d.advancesDeducted || 0, other_deducted: d.otherDeducted || 0,
        method: d.method || 'M-Pesa (Mobile Money)',
        settlement_type: d.settlementType || 'Full Season Settlement',
        notes: d.notes || '',
      }
      return queueOrRun({
        op: 'createSeasonSettlement',
        label: 'Season settlement voucher',
        payload,
        applyLocal: cur => ({
          ...cur,
          fullSettlements: [{ id: uid('fs_'), date: today(), ...d, offlinePending: true }, ...(cur.fullSettlements || [])],
        }),
        runOnline: async () => {
          const r = await api.createFullSettlement(bid, payload)
          patchBranchData(bid, { fullSettlements: [r.settlement, ...(authState.branchData[bid]?.fullSettlements || [])] })
        },
      })
    },

    // ── Staff (via API) ────────────────────────────────────────────────────────
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

    createFishermanAccount: async d => {
      const supPayload = {
        name: d.name, phone: d.phone, site: d.site || 'Mwanza (Kirumba Mwaloni)',
        cat: d.cat || 'Individual Fisherman', boat: d.boatName || '',
        nida: d.nida || '', creditLimit: +d.creditLimit || 2000000, status: 'Active',
      }
      const boatPayload = {
        regNo: d.boatReg || '', name: d.boatName || `${d.name}'s Boat`,
        ownerType: 'Fisherman-owned', ownerId: '',
        captain: d.captain || d.name, engine: d.engine || '',
        boatType: d.boatType || 'Planked Wooden Mashua (10m)',
        status: 'Operational', crewMembers: d.crewMembers || [],
      }
      const tempSupId = uid('sup_')
      const tempBoatId = uid('boat_')
      const res = await queueOrRun({
        op: 'createFishermanAccount',
        label: `Create fisherman account: ${d.name}`,
        payload: { supplier: supPayload, boat: boatPayload },
        tempId: tempSupId,
        applyLocal: cur => ({
          branchPatch: {
            suppliers: [...(cur.suppliers || []), { id: tempSupId, no: 'SUP-OFF-' + String(Date.now()).slice(-3), ...supPayload, offlinePending: true }],
            boats: [...(cur.boats || []), { id: tempBoatId, ...boatPayload, ownerId: tempSupId, offlinePending: true }],
          },
          result: { itemId: tempSupId },
        }),
        runOnline: async () => {
          const r = await api.createCollectionItem(bid, 'suppliers', supPayload)
          const boatR = await api.createCollectionItem(bid, 'boats', { ...boatPayload, ownerId: r.item?.id || '' })
          setAuthState(prev => {
            const cur = prev.branchData[bid] || {}
            return { ...prev, branchData: { ...prev.branchData, [bid]: {
              ...cur,
              suppliers: [...(cur.suppliers || []), r.item],
              boats: [...(cur.boats || []), boatR.item],
            } } }
          })
          return { itemId: r.item?.id }
        },
      })
      return res?.itemId || tempSupId
    },

    updateBoatCrew: (boatId, crewMembers) => queueOrRun({
      op: 'updateBoatCrew',
      label: 'Update boat crew roster',
      payload: { boatId, crewMembers },
      applyLocal: cur => ({
        ...cur,
        boats: (cur.boats || []).map(b => b.id !== boatId ? b : { ...b, crewMembers, offlinePending: true }),
      }),
      runOnline: () => mutation(
        d => ({ ...d, boats: d.boats.map(b => b.id !== boatId ? b : { ...b, crewMembers }) }),
        () => api.patchCollectionItem(bid, 'boats', boatId, { crewMembers })
      ),
    }),

    updateCrewAssignment: (id, d) => queueOrRun({
      op: 'updateCrewAssignment',
      label: 'Update crew assignment',
      payload: { id, patch: d },
      applyLocal: cur => ({
        ...cur,
        boatCrewAssignments: (cur.boatCrewAssignments || []).map(x => x.id !== id ? x : { ...x, ...d, offlinePending: true }),
      }),
      runOnline: () => api.patchCollectionItem(bid, 'boatCrewAssignments', id, d),
    }),

    reset: () => {},
  }

  const db  = { ses: authState.user ? { kind: 'tenant', tid: authState.tenant?.id, uid: authState.user?.id, bid } : null, tenants: [], plat: { admin: {}, log: [] } }
  const T   = authState.tenant
  const B   = authState.branches.find(b => b.id === bid)
  const me  = authState.user
  const ses = db.ses || {}

  return (
    <C.Provider value={{
      s,
      a,
      db,
      T,
      B,
      me,
      x,
      ses,
      lang,
      setLang,
      t,
      spLabel,
      catLabel,
      authState,
      isOnline: device.isOnline,
      isSlowNetwork: device.isSlowNetwork,
      lowBandwidthMode: device.lowBandwidthMode,
      pendingQueue,
      pendingSyncCount: pendingQueue.length,
      syncing,
      lastSyncAt,
      syncError,
      syncNow,
      clearFailedQueueItem,
      offlineHydrated: authState.offlineHydrated,
    }}>
      {authState.loading ? null : children}
    </C.Provider>
  )
}

// ─── FishTrade ERP — Web API Client ──────────────────────────────────────────
// Pure JS fetch-based client. All mutations route through the backend.
// Token is stored in sessionStorage so it survives page refresh within a tab
// but is cleared when the browser tab is closed.

const BASE = import.meta.env.VITE_API_BASE || 'https://friendly-courage-production-fa90f28e.up.railway.app'
const TOKEN_KEY = 'fishtrade.token'
const VERSION_PREFIX = 'fishtrade.version.'

// ── Token management ─────────────────────────────────────────────────────────
export const getToken = () => sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
export const setToken = t => {
  sessionStorage.setItem(TOKEN_KEY, t)
  localStorage.setItem(TOKEN_KEY, t)         // persist across tabs
}
export const clearToken = () => {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

// ── Branch version ────────────────────────────────────────────────────────────
export const getVersion = id => parseInt(sessionStorage.getItem(VERSION_PREFIX + id) || '1', 10)
export const saveVersion = (id, v) => sessionStorage.setItem(VERSION_PREFIX + id, String(v))

// ── Error class ───────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(status, message, body, { isNetworkError = false, isTimeout = false } = {}) {
    super(message)
    this.status = status
    this.body = body
    this.isVersionConflict = status === 409 && body?.code === 'version_conflict'
    this.isUnauthorized = status === 401
    this.isNetworkError = isNetworkError
    this.isTimeout = isTimeout
  }
}

export const isLikelyNetworkError = err => {
  if (!err) return false
  if (err.isNetworkError || err.isTimeout) return true
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  if (err.name === 'AbortError') return true
  if (err instanceof TypeError) return true
  if (typeof err.status === 'number' && err.status >= 502 && err.status <= 504) return true
  return false
}

function getRequestTimeoutMs() {
  if (typeof navigator === 'undefined') return 12000
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const eff = conn?.effectiveType
  if (conn?.saveData || eff === 'slow-2g' || eff === '2g' || eff === '3g') return 18000
  return 11000
}

// ── Core fetch ────────────────────────────────────────────────────────────────
async function request(method, path, body, queryParams) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError(0, 'Offline — queued for sync', null, { isNetworkError: true })
  }

  const token = getToken()
  const url = new URL(BASE + path)
  if (queryParams) Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v))

  const controller = new AbortController()
  const timeoutMs = getRequestTimeoutMs()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let resp
  try {
    resp = await fetch(url.toString(), {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    clearTimeout(timer)
    const isTimeout = err?.name === 'AbortError'
    throw new ApiError(
      0,
      isTimeout ? 'Network timeout on slow connection' : (err?.message || 'Network unavailable'),
      null,
      { isNetworkError: true, isTimeout }
    )
  }
  clearTimeout(timer)

  let data = {}
  try { data = await resp.json() } catch (_) { }

  if (!resp.ok) {
    const msg = typeof data.detail === 'string'
      ? data.detail
      : data.detail?.message || data.message || `HTTP ${resp.status}`
    throw new ApiError(resp.status, msg, data.detail || data, {
      isNetworkError: resp.status >= 502 && resp.status <= 504,
    })
  }
  return data
}

export const get = (path, q) => request('GET', path, undefined, q)
export const post = (path, body, q) => request('POST', path, body, q)
export const patch = (path, body, q) => request('PATCH', path, body, q)
export const del = (path, q) => request('DELETE', path, undefined, q)

// ── Version-aware command helper ──────────────────────────────────────────────
async function command(branchId, path, body, { isPost = true, isPatch = false } = {}) {
  const ver = getVersion(branchId)
  try {
    const resp = isPatch
      ? await patch(path, { ...body, expected_version: ver })
      : await post(path, body, isPost ? { expected_version: ver } : undefined)
    if (resp.version) saveVersion(branchId, resp.version)
    return resp
  } catch (err) {
    if (err.isVersionConflict) {
      // Reload branch and retry with fresh version
      const bs = await getBranchState(branchId)
      const freshVer = bs.version || ver + 1
      saveVersion(branchId, freshVer)
      const resp = isPatch
        ? await patch(path, { ...body, expected_version: freshVer })
        : await post(path, body, isPost ? { expected_version: freshVer } : undefined)
      if (resp.version) saveVersion(branchId, resp.version)
      return resp
    }
    throw err
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════

export async function login(username, password) {
  const data = await post('/api/v1/auth/login', { username, password })
  if (data.access_token) setToken(data.access_token)
  return data
}

export async function register({ company, name, username, password, phone = '', region = '', plan = 'Business', branches }) {
  const branchList = Array.isArray(branches) && branches.length
    ? branches.map(b => ({ name: b.name, region: b.region || region, state: b.state || {} }))
    : [{ name: company, region, state: {} }]
  const data = await post('/api/v1/auth/register', {
    company, name, username, password, phone, region, plan,
    branches: branchList,
  })
  if (data.access_token) setToken(data.access_token)
  return data
}

export const me = () => get('/api/v1/auth/me')
export const bootstrap = () => get('/api/v1/bootstrap')
export const logout = () => { clearToken(); return Promise.resolve() }

// ════════════════════════════════════════════════════════════════════════════
// STAFF
// ════════════════════════════════════════════════════════════════════════════

export const listStaff = () => get('/api/v1/staff')
export const createStaff = d => post('/api/v1/staff', d)
export const updateStaff = (id, d) => patch(`/api/v1/staff/${id}`, d)

// ════════════════════════════════════════════════════════════════════════════
// BRANCHES
// ════════════════════════════════════════════════════════════════════════════

export async function getBranchState(branchId) {
  const resp = await get(`/api/v1/branches/${branchId}/state`)
  if (resp.version) saveVersion(branchId, resp.version)
  return resp
}

export const initBranch = id => post(`/api/v1/branches/${id}/initialize`, {})

// ── Generic collection CRUD ───────────────────────────────────────────────────

export const listCollection = (branchId, col) =>
  get(`/api/v1/branches/${branchId}/collections/${col}`)

export async function createCollectionItem(branchId, col, item) {
  const ver = getVersion(branchId)
  const resp = await post(`/api/v1/branches/${branchId}/collections/${col}`,
    { expected_version: ver, item })
  if (resp.version) saveVersion(branchId, resp.version)
  return resp
}

export async function patchCollectionItem(branchId, col, itemId, patch_) {
  const ver = getVersion(branchId)
  const resp = await patch(`/api/v1/branches/${branchId}/collections/${col}/${itemId}`,
    { expected_version: ver, patch: patch_ })
  if (resp.version) saveVersion(branchId, resp.version)
  return resp
}

export async function deleteCollectionItem(branchId, col, itemId) {
  const ver = getVersion(branchId)
  const resp = await del(`/api/v1/branches/${branchId}/collections/${col}/${itemId}`,
    { expected_version: ver })
  if (resp.version) saveVersion(branchId, resp.version)
  return resp
}

export const listAudit = (branchId, limit = 100) =>
  get(`/api/v1/branches/${branchId}/audit`, { limit })

// ════════════════════════════════════════════════════════════════════════════
// DOMAIN COMMANDS
// ════════════════════════════════════════════════════════════════════════════

// ── Procurement ───────────────────────────────────────────────────────────────
export const recordPurchase = (bid, d) => {
  // Fill in defaults for all required fields of PurchaseCommand
  const defaults = {
    supplier_id: '',
    source_type: 'independent',
    boat_id: '',
    fisherman_id: '',
    fisherman_name: '',
    species: '',
    grade: '',
    kg: 0,
    price_per_kg: 0,
    site: '',
    warehouse: '',
    paid_now: 0,
    fuel_deducted: 0,
    maint_deducted: 0,
    payment_method: 'Cash Voucher',
    notes: ''
  };
  const payload = { ...defaults, ...d };
  return command(bid, `/api/v1/branches/${bid}/commands/purchases`, payload);
};
export const inspectBatch = (bid, batchId, d) => command(bid, `/api/v1/branches/${bid}/commands/batches/${batchId}/inspect`, d)
export const transferBatch = (bid, batchId, warehouse) => command(bid, `/api/v1/branches/${bid}/commands/batches/${batchId}/transfer`, { warehouse }, { isPatch: true })
export const recordWaste = (bid, batchId, waste_kg, reason) => command(bid, `/api/v1/branches/${bid}/commands/batches/${batchId}/waste`, { waste_kg, reason }, { isPatch: true })

// ── Payments ─────────────────────────────────────────────────────────────────
export const paySupplier = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/supplier-payments`, d)

// ── Sales ─────────────────────────────────────────────────────────────────────
// ── Sales helpers
export const recordSale = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/sales`, d);

// Fetch all sales for a branch
export const listSales = (bid) => listCollection(bid, 'sales');

/**
 * Get aggregated sales stats for a given fisherman (mvuvi).
 * Returns an object mapping dates (YYYY-MM-DD) to { totalKg, totalAmount }.
 * Also includes a flat list of sales entries for further UI rendering.
 */
export const getFishermanSalesStats = async (bid, fishermanId) => {
  const sales = await listSales(bid);
  // expected sale schema includes: fisherman_id, kg, price_per_kg, created_at (or similar)
  const stats = {};
  const records = [];
  for (const s of sales) {
    if (s.fisherman_id !== fishermanId) continue;
    const date = new Date(s.created_at || s.timestamp || Date.now()).toISOString().split('T')[0];
    if (!stats[date]) stats[date] = { totalKg: 0, totalAmount: 0 };
    const kg = s.kg || 0;
    const price = s.price_per_kg || 0;
    stats[date].totalKg += kg;
    stats[date].totalAmount += kg * price;
    records.push({ ...s, date });
  }
  return { stats, records };
};
export const dispatchSale = (bid, saleId, d) => command(bid, `/api/v1/branches/${bid}/commands/sales/${saleId}/dispatch`, d, { isPatch: true })
export const receiveSalePayment = (bid, saleId, amount, method) => command(bid, `/api/v1/branches/${bid}/commands/sales/${saleId}/payment`, { amount, method }, { isPatch: true })

// ── Fuel ─────────────────────────────────────────────────────────────────────
export const issueFuel = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/fuel-issues`, d)
export const receiveFuel = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/fuel-receive`, d)
export const payFuelDebt = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/fuel-debt-payments`, d)
export const fuelAdjustment = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/fuel-adjustments`, d, { isPatch: true })

// ── Maintenance ───────────────────────────────────────────────────────────────
export const createWorkOrder = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/work-orders`, d)
export const updateWorkOrderStatus = (bid, woId, status) => command(bid, `/api/v1/branches/${bid}/commands/work-orders/${woId}/status`, { status }, { isPatch: true })
export const payMaintDebt = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/maint-debt-payments`, d)

// ── Gear ─────────────────────────────────────────────────────────────────────
export const issueGear = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/gear-issues`, d)
export const returnGear = (bid, issueId, d) => command(bid, `/api/v1/branches/${bid}/commands/gear-issues/${issueId}/return`, d, { isPatch: true })

// ── Catering ─────────────────────────────────────────────────────────────────
export const issueCookAdvance = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/catering-advances`, d)
export const recordCateringExpense = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/catering-expenses`, d)

// ── Cash Advances ─────────────────────────────────────────────────────────────
export const requestAdvance = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/advances/request`, d)
export const approveAdvance = (bid, advId, d) => command(bid, `/api/v1/branches/${bid}/commands/advances/${advId}/approve`, d, { isPatch: true })
export const repayAdvance = (bid, advId, d) => command(bid, `/api/v1/branches/${bid}/commands/advances/${advId}/repay`, d)

// ── Boat Projects ─────────────────────────────────────────────────────────────
export const createBoatProject = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/boat-projects`, d)
export const updateProjectProgress = (bid, projId, d) => command(bid, `/api/v1/branches/${bid}/commands/boat-projects/${projId}/progress`, d, { isPatch: true })
export const recordProjectPayment = (bid, projId, d) => command(bid, `/api/v1/branches/${bid}/commands/boat-projects/${projId}/payments`, d)

// ── Crew ─────────────────────────────────────────────────────────────────────
export const assignCrew = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/crew-assignments`, d)
export const createKibalua = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/kibalua-engagements`, d)
export const settleKibalua = (bid, engId, d) => command(bid, `/api/v1/branches/${bid}/commands/kibalua-engagements/${engId}/settle`, d, { isPatch: true })
export const fishermanExit = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/fisherman-exits`, d)
export const allocateBoatExpense = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/boat-expense-allocations`, d)

// ── Full Settlement ───────────────────────────────────────────────────────────
export const createFullSettlement = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/full-settlements`, d)

// ── Misc ─────────────────────────────────────────────────────────────────────
export const recordExpense = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/expenses`, d)
export const recordTrip = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/trips`, d)
export const addPermit = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/compliance-permits`, d)
export const addSeason = (bid, d) => command(bid, `/api/v1/branches/${bid}/commands/seasons`, d)
export const setActiveSeason = (bid, seasonId) => command(bid, `/api/v1/branches/${bid}/commands/set-active-season`, { season_id: seasonId }, { isPatch: true })

// ─── FishTrade ERP — Offline Cache & Persistent Mutation Outbox ───────────────
// Enables full field continuity at remote landing sites with zero or slow 2G/3G
// connectivity. Snapshots branch/user state locally and queues mutations for
// sequential replay once connectivity returns.

const CACHE_KEY = 'fishtrade.cache.v1'
const OUTBOX_KEY = 'fishtrade.outbox.v1'

export function loadCachedSession() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.user) return null
    return parsed
  } catch {
    return null
  }
}

export function saveCachedSession(snapshot) {
  try {
    if (!snapshot || !snapshot.user) return
    const payload = {
      user: snapshot.user,
      tenant: snapshot.tenant,
      staff: snapshot.staff || [],
      branches: (snapshot.branches || []).map(b => ({
        id: b.id,
        name: b.name,
        region: b.region,
        version: b.version,
      })),
      activeBranchId: snapshot.activeBranchId || null,
      branchData: snapshot.branchData || {},
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore quota exceeded errors cleanly
  }
}

export function clearCachedSession() {
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(OUTBOX_KEY)
  } catch {
    // ignore
  }
}

export function loadOutbox() {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveOutbox(items) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items || []))
  } catch {
    // ignore
  }
}

export function enqueueOutboxItem(entry) {
  const queue = loadOutbox()
  const item = {
    id: 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
    ...entry,
  }
  const next = [...queue, item]
  saveOutbox(next)
  return { item, queue: next }
}

export function removeOutboxItem(id) {
  const next = loadOutbox().filter(x => x.id !== id)
  saveOutbox(next)
  return next
}

export function updateOutboxItem(id, patch) {
  const next = loadOutbox().map(x => (x.id === id ? { ...x, ...patch } : x))
  saveOutbox(next)
  return next
}

export function replaceQueuedRef(oldId, newId) {
  if (!oldId || !newId || oldId === newId) return
  const queue = loadOutbox()
  let changed = false
  const next = queue.map(entry => {
    const serialized = JSON.stringify(entry)
    if (!serialized.includes(oldId)) return entry
    changed = true
    return JSON.parse(serialized.split(oldId).join(newId))
  })
  if (changed) saveOutbox(next)
}

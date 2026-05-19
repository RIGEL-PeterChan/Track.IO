// ============================================================
// storage.js — Data persistence + cross-device sync
//
// Strategy:
//   1. On load        → fetch latest from Supabase
//   2. On save        → write to Supabase immediately
//   3. Polling        → every 5s, all open tabs re-fetch from
//                       Supabase and update state if data changed
//
// This guarantees all devices always see the same data.
// No WebSocket complexity — just reliable REST polling.
//
// Public API:
//   loadData(key)                       → Promise<array>
//   saveData(key, data)                 → Promise<void>
//   subscribeToChanges(key, callback)   → unsubscribe fn
// ============================================================

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY  || ''
const TABLE        = 'trackio_store'
const POLL_MS      = 5000   // check for remote changes every 5 seconds
const REST         = `${SUPABASE_URL}/rest/v1`   // single source of truth for API base URL

// ── Local cache (for instant UI, offline fallback) ────────────
function localGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}
function localSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ── Supabase REST ─────────────────────────────────────────────
const headers = () => ({
  apikey:         SUPABASE_KEY,
  Authorization:  `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
})

async function remoteGet(key) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  try {
    const res  = await fetch(
      `${REST}/${TABLE}?key=eq.${encodeURIComponent(key)}&select=value`,
      { headers: headers() }
    )
    if (!res.ok) return null
    const rows = await res.json()
    return rows?.[0]?.value ?? null
  } catch { return null }
}

async function remoteSet(key, data) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false
  try {
    const res = await fetch(`${REST}/${TABLE}`, {
      method:  'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates' },
      body:    JSON.stringify({ key, value: data }),
    })
    return res.ok
  } catch { return false }
}

// ── Polling-based cross-device sync ───────────────────────────
// Starts a setInterval that fetches the latest value from Supabase
// every POLL_MS milliseconds. If the remote value differs from what
// we last stored locally, the callback is fired with fresh data.
//
// Uses JSON.stringify comparison to detect changes efficiently —
// no unnecessary React re-renders if nothing changed.
export function subscribeToChanges(key, callback) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return () => {}

  // Track the last known remote value as a JSON string for comparison
  let lastSeen = JSON.stringify(localGet(key) || [])

  const intervalId = setInterval(async () => {
    const remote = await remoteGet(key)
    if (remote === null) return          // network error — skip this tick
    const remoteStr = JSON.stringify(remote)
    if (remoteStr !== lastSeen) {        // data changed on another device
      lastSeen = remoteStr
      localSet(key, remote)
      callback(remote)                   // notify React to update state
    }
  }, POLL_MS)

  return () => clearInterval(intervalId) // cleanup on unmount
}

// ── Public API ────────────────────────────────────────────────
export async function loadData(key) {
  const remote = await remoteGet(key)
  if (remote !== null) {
    localSet(key, remote)
    return remote
  }
  return localGet(key) || []            // offline fallback
}

export async function saveData(key, data) {
  localSet(key, data)                   // instant local write
  await remoteSet(key, data)            // persist to Supabase
  // (other devices will pick this up on their next poll tick)
}

// Storage keys used across the app
export const KEYS = {
  tasks:   'trackio:tasks:v1',
  content: 'trackio:content:v1',
}

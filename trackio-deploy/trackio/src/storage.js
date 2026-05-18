// ============================================================
// storage.js — Data persistence layer for Track.IO
//
// Uses localStorage for instant local updates +
// Supabase (free) for cross-device live sync.
//
// To swap backend: replace the supabase* functions below.
// The rest of the app only calls: loadData(), saveData()
// ============================================================

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || ''
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const TABLE_NAME    = 'trackio_store'   // single key-value table in Supabase

// ── Local cache (instant reads) ──────────────────────────────
function localGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}
function localSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ── Supabase helpers (upsert / select) ───────────────────────
async function remoteGet(key) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?key=eq.${encodeURIComponent(key)}&select=value`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const rows = await res.json()
    return rows?.[0]?.value ?? null
  } catch { return null }
}

async function remoteSet(key, data) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key, value: data }),
    })
  } catch {}
}

// ── Public API ───────────────────────────────────────────────
export async function loadData(key) {
  // Try remote first; fall back to local cache
  const remote = await remoteGet(key)
  if (remote !== null) { localSet(key, remote); return remote }
  return localGet(key) || []
}

export async function saveData(key, data) {
  localSet(key, data)          // instant local write
  await remoteSet(key, data)   // async remote sync
}

// Storage keys used across the app
export const KEYS = {
  tasks:   'trackio:tasks:v1',
  content: 'trackio:content:v1',
}

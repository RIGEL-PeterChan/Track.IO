// ============================================================
// storage.js — Data persistence + real-time sync for Track.IO
//
// Architecture:
//   - Supabase REST API  → read/write data
//   - Supabase Realtime  → WebSocket push to all open tabs/devices
//   - localStorage       → instant local cache (offline fallback)
//
// Public API:
//   loadData(key)                          → Promise<array>
//   saveData(key, data)                    → Promise<void>
//   subscribeToChanges(key, callback)      → unsubscribe()
//
// To swap the backend: replace the remote* functions and
// subscribeToChanges. The rest of the app is untouched.
// ============================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL  || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const TABLE        = 'trackio_store'

// ── Local cache ───────────────────────────────────────────────
function localGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}
function localSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ── Supabase REST helpers ─────────────────────────────────────
const baseHeaders = () => ({
  apikey:        SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
})

async function remoteGet(key) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  try {
    const res  = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.${encodeURIComponent(key)}&select=value`,
      { headers: baseHeaders() }
    )
    const rows = await res.json()
    return rows?.[0]?.value ?? null
  } catch { return null }
}

async function remoteSet(key, data) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method:  'POST',
      headers: { ...baseHeaders(), Prefer: 'resolution=merge-duplicates' },
      body:    JSON.stringify({ key, value: data }),
    })
  } catch {}
}

// ── Supabase Realtime WebSocket subscription ──────────────────
// Uses the Supabase Realtime v2 protocol over WebSocket.
// Listens for INSERT and UPDATE events on the trackio_store table
// and calls callback(newData) whenever another client saves.
//
// Returns an unsubscribe() function — call it on component unmount.
export function subscribeToChanges(key, callback) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return () => {}

  // Build the Realtime WebSocket URL from the REST URL
  const wsUrl = SUPABASE_URL
    .replace('https://', 'wss://')
    .replace('http://',  'ws://')
    + '/realtime/v1/websocket?apikey=' + SUPABASE_KEY + '&vsn=1.0.0'

  let ws
  let heartbeatInterval
  let reconnectTimeout
  let closed = false
  const ref  = { val: 1 }

  function nextRef() { return String(ref.val++) }

  function connect() {
    if (closed) return
    try {
      ws = new WebSocket(wsUrl)
    } catch { return }

    ws.onopen = () => {
      // 1. Join the Phoenix channel for this table
      ws.send(JSON.stringify({
        topic:   `realtime:public:${TABLE}`,
        event:   'phx_join',
        payload: {
          config: {
            broadcast:  { self: false },
            presence:   { key: '' },
            postgres_changes: [{
              event:  '*',        // INSERT, UPDATE, DELETE
              schema: 'public',
              table:  TABLE,
              filter: `key=eq.${key}`,
            }],
          },
        },
        ref: nextRef(),
      }))

      // 2. Heartbeat every 25 s to keep the socket alive
      heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            topic: 'phoenix', event: 'heartbeat', payload: {}, ref: nextRef()
          }))
        }
      }, 25000)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        // Realtime v2 wraps postgres changes under postgres_changes event
        if (
          msg.event === 'postgres_changes' &&
          msg.payload?.data?.record?.key === key
        ) {
          const newValue = msg.payload.data.record.value
          if (newValue !== undefined) {
            localSet(key, newValue)
            callback(newValue)
          }
        }
      } catch {}
    }

    ws.onclose = () => {
      clearInterval(heartbeatInterval)
      // Auto-reconnect after 3 s unless intentionally closed
      if (!closed) {
        reconnectTimeout = setTimeout(connect, 3000)
      }
    }

    ws.onerror = () => ws.close()
  }

  connect()

  // Return cleanup function
  return () => {
    closed = true
    clearInterval(heartbeatInterval)
    clearTimeout(reconnectTimeout)
    if (ws) ws.close()
  }
}

// ── Public API ────────────────────────────────────────────────
export async function loadData(key) {
  const remote = await remoteGet(key)
  if (remote !== null) { localSet(key, remote); return remote }
  return localGet(key) || []
}

export async function saveData(key, data) {
  localSet(key, data)       // instant local write
  await remoteSet(key, data) // persist + triggers Realtime event to all subscribers
}

// Storage keys used across the app
export const KEYS = {
  tasks:   'trackio:tasks:v1',
  content: 'trackio:content:v1',
}

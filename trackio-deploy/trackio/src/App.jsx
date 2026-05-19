// ============================================================
// App.jsx — Track.IO root shell
// Module registry: add/remove modules in MODULES array only.
// Real-time sync: subscribeToChanges() in storage.js pushes
// updates to all open tabs/devices via Supabase Realtime.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { loadData, saveData, KEYS, subscribeToChanges, migrateLocalToRemote } from './storage.js'
import StatusTracker from './modules/StatusTracker.jsx'
import ContentCalendar from './modules/ContentCalendar.jsx'

// ── Module registry ───────────────────────────────────────────
// To add a new module: import it above and push an entry here.
const MODULES = [
  { key: 'status',  label: 'Status Tracker',  icon: '✦', Component: StatusTracker  },
  { key: 'content', label: 'Content Calendar', icon: '◈', Component: ContentCalendar },
]

const BRAND      = '#12357f'
const BRAND_GOLD = '#f5c518'

// ── Live clock ────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const timeStr = now.toLocaleTimeString('en-MY', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true })
  const dateStr = now.toLocaleDateString('en-MY', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end',
      borderLeft:'1px solid rgba(255,255,255,0.15)', paddingLeft:14, marginLeft:8 }}>
      <span style={{ fontSize:14, fontWeight:700, color:'white', letterSpacing:'0.03em',
        lineHeight:1.2, fontVariantNumeric:'tabular-nums' }}>{timeStr}</span>
      <span style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:500,
        letterSpacing:'0.03em' }}>{dateStr}</span>
    </div>
  )
}

// ── Sync status indicator ─────────────────────────────────────
function SyncIndicator({ status, lastSync }) {
  const map = {
    synced:   { color:'#4ade80', shadow:'0 0 6px #4ade8099', label:'Live' },
    syncing:  { color:BRAND_GOLD, shadow:'0 0 6px #f5c51899', label:'Saving…' },
    incoming: { color:'#60a5fa', shadow:'0 0 8px #60a5fa99', label:'Syncing…' },
    offline:  { color:'#94a3b8', shadow:'none',               label:'Offline' },
  }
  const s = map[status] || map.synced
  const timeStr = lastSync
    ? lastSync.toLocaleTimeString('en-MY', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true })
    : null
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:1 }}>
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        <div style={{ width:7, height:7, borderRadius:'50%',
          background:s.color, boxShadow:s.shadow,
          transition:'background 0.3s, box-shadow 0.3s' }}/>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)',
          fontWeight:600, whiteSpace:'nowrap' }}>{s.label}</span>
      </div>
      {timeStr && (
        <span style={{ fontSize:9, color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap' }}>
          synced {timeStr}
        </span>
      )}
    </div>
  )
}

function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill={BRAND_GOLD} opacity="0.18"/>
        <path d="M16 6C12.134 6 9 9.134 9 13c0 2.387 1.195 4.494 3 5.745V21a1 1 0 001 1h6a1 1 0 001-1v-2.255C21.805 17.494 23 15.387 23 13c0-3.866-3.134-7-7-7z" fill={BRAND_GOLD}/>
        <path d="M12 22h8M13 24.5h6" stroke={BRAND_GOLD} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M19.5 10.5C18.7 9.2 17.4 8.4 16 8.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      </svg>
      <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:19,
        color:'white', letterSpacing:'-0.5px' }}>
        Track<span style={{ color:BRAND_GOLD }}>.IO</span>
      </span>
    </div>
  )
}

// ── App shell ─────────────────────────────────────────────────
export default function App() {
  const [activeModule, setActiveModule] = useState(MODULES[0].key)
  const [tasks,        setTasks]        = useState([])
  const [content,      setContent]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [syncStatus,   setSyncStatus]   = useState('offline')
  const [lastSync,     setLastSync]     = useState(null)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [showMigrate,  setShowMigrate]  = useState(false)
  const [migrating,    setMigrating]    = useState(false)

  // ── Initial data load ───────────────────────────────────────
  useEffect(() => {
    Promise.all([loadData(KEYS.tasks), loadData(KEYS.content)])
      .then(([t, c]) => {
        setTasks(t)
        setContent(c)
        setLoading(false)
        setSyncStatus('synced')
        setLastSync(new Date())
        // Show migrate banner if there is local data that may not be on Supabase yet
        // (loadData auto-migrates on first load, but this handles edge cases)
        const localTasks   = JSON.parse(localStorage.getItem(KEYS.tasks)   || '[]')
        const localContent = JSON.parse(localStorage.getItem(KEYS.content) || '[]')
        if (localTasks.length > 0 || localContent.length > 0) {
          setShowMigrate(true)
          // Auto-hide after 10s if user ignores it
          setTimeout(() => setShowMigrate(false), 10000)
        }
      })
  }, [])

  // ── Real-time subscriptions ─────────────────────────────────
  // Subscribe to remote changes for both data keys.
  // When another user/tab saves, the callback fires with fresh data
  // and we update local state — no page reload needed.
  useEffect(() => {
    if (loading) return // wait until initial load is done

    const unsubTasks = subscribeToChanges(KEYS.tasks, (newData) => {
      setSyncStatus('incoming')
      setTasks(newData)
      setLastSync(new Date())
      setTimeout(() => setSyncStatus('synced'), 1200)
    })

    const unsubContent = subscribeToChanges(KEYS.content, (newData) => {
      setSyncStatus('incoming')
      setContent(newData)
      setLastSync(new Date())
      setTimeout(() => setSyncStatus('synced'), 1200)
    })

    setSyncStatus('synced')

    return () => {
      unsubTasks()
      unsubContent()
    }
  }, [loading])

  // ── Wrapped setters that show "saving" indicator ────────────
  // These are passed to child modules so they still call saveData()
  // normally — we just intercept to update the sync indicator.
  function makeTrackedSetter(setter) {
    return (updater) => {
      setSyncStatus('syncing')
      setter(updater)
      setTimeout(() => { setSyncStatus('synced'); setLastSync(new Date()) }, 800)
    }
  }

  // Force-push all local data to Supabase
  async function handleMigrate() {
    setMigrating(true)
    const result = await migrateLocalToRemote()
    const total = Object.values(result).reduce((s, n) => s + n, 0)
    setMigrating(false)
    setShowMigrate(false)
    setSyncStatus('synced')
    setLastSync(new Date())
    alert(`✅ Synced! Uploaded ${total} record(s) to Supabase. All devices will now see your data.`)
  }

  const ActiveComponent = MODULES.find(m => m.key === activeModule)?.Component
  const activeLabel     = MODULES.find(m => m.key === activeModule)?.label

  return (
    <div style={{ minHeight:'100dvh', background:'#f4f7fd',
      fontFamily:"'Segoe UI','Helvetica Neue',Arial,sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background:BRAND, padding:'0 20px', display:'flex',
        alignItems:'center', height:56, position:'sticky', top:0, zIndex:100,
        boxShadow:'0 2px 12px #12357f44' }}>

        <Logo />

        {/* Desktop nav */}
        <nav style={{ display:'flex', gap:2, marginLeft:28, flex:1 }} className="desktop-nav">
          {MODULES.map(m => (
            <button key={m.key} onClick={() => setActiveModule(m.key)}
              style={{ padding:'8px 16px', border:'none', borderRadius:8, cursor:'pointer',
                fontWeight:600, fontSize:13, background:'transparent',
                color: activeModule===m.key ? 'white' : 'rgba(255,255,255,0.55)',
                borderBottom: activeModule===m.key ? `2px solid ${BRAND_GOLD}` : '2px solid transparent' }}>
              {m.icon} {m.label}
            </button>
          ))}
        </nav>

        {/* Right: sync indicator + clock */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <SyncIndicator status={loading ? 'offline' : syncStatus} lastSync={lastSync} />
          <div className="live-clock"><LiveClock /></div>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(v=>!v)} aria-label="Menu"
          style={{ marginLeft:14, background:'rgba(255,255,255,0.12)', border:'none',
            borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'white', fontSize:16 }}
          className="mobile-menu-btn">☰</button>
      </header>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <div style={{ background:BRAND, padding:'8px 20px 14px',
          display:'flex', flexDirection:'column', gap:4 }} className="mobile-nav">
          {MODULES.map(m => (
            <button key={m.key} onClick={() => { setActiveModule(m.key); setMenuOpen(false) }}
              style={{ padding:'10px 14px', border:'none', borderRadius:8, cursor:'pointer',
                textAlign:'left', fontWeight:600, fontSize:14,
                background: activeModule===m.key ? 'rgba(255,255,255,0.16)' : 'transparent',
                color:      activeModule===m.key ? 'white' : 'rgba(255,255,255,0.65)' }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Migration banner ── */}
      {showMigrate && !loading && (
        <div style={{ background:'#fffbeb', borderBottom:'1px solid #f5c518',
          padding:'10px 20px', display:'flex', alignItems:'center',
          gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, color:'#92400e', flex:1, minWidth:200 }}>
            💡 <strong>You have local data</strong> that may not be synced to other devices yet.
          </span>
          <button onClick={handleMigrate} disabled={migrating}
            style={{ padding:'7px 18px', borderRadius:8, border:'none',
              background: migrating ? '#94a3b8' : '#12357f',
              color:'white', cursor: migrating ? 'default' : 'pointer',
              fontSize:13, fontWeight:700, whiteSpace:'nowrap' }}>
            {migrating ? 'Uploading…' : '⬆ Sync to all devices'}
          </button>
          <button onClick={() => setShowMigrate(false)}
            style={{ background:'none', border:'none', cursor:'pointer',
              color:'#94a3b8', fontSize:18, lineHeight:1 }}>✕</button>
        </div>
      )}

      {/* ── Main ── */}
      <main style={{ maxWidth:1280, margin:'0 auto', padding:'24px 16px 60px' }}>
        <div style={{ marginBottom:20 }}>
          <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:BRAND }}>{activeLabel}</h1>
          <p style={{ margin:'3px 0 0', fontSize:13, color:'#94a3b8' }}>
            {activeModule==='status'
              ? 'Track tasks across weeks — assign status, attach links, and monitor progress.'
              : 'Plan and track social media content across all platforms.'}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>💡</div>
            <p>Loading your workspace…</p>
          </div>
        ) : (
          ActiveComponent && (
            <ActiveComponent
              tasks={tasks}     setTasks={makeTrackedSetter(setTasks)}
              content={content} setContent={makeTrackedSetter(setContent)}
            />
          )
        )}
      </main>

      {/* Responsive CSS */}
      <style>{`
        .desktop-nav    { display: flex !important; }
        .mobile-menu-btn{ display: none !important; }
        .mobile-nav     { display: none !important; }
        .live-clock     { display: flex !important; }
        @media (max-width: 600px) {
          .desktop-nav    { display: none  !important; }
          .mobile-menu-btn{ display: block !important; }
          .mobile-nav     { display: flex  !important; }
          .live-clock     { display: none  !important; }
        }
      `}</style>
    </div>
  )
}

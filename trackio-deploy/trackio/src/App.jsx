// ============================================================
// App.jsx — Track.IO root shell
// Module registry: add/remove modules in MODULES array only.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { loadData, saveData, KEYS } from './storage.js'
import StatusTracker from './modules/StatusTracker.jsx'
import ContentCalendar from './modules/ContentCalendar.jsx'

// ── Module registry ──────────────────────────────────────────
// To add a new module: import it above and push an entry here.
const MODULES = [
  { key: 'status',  label: 'Status Tracker',   icon: '✦', Component: StatusTracker  },
  { key: 'content', label: 'Content Calendar',  icon: '◈', Component: ContentCalendar },
]

const BRAND      = '#12357f'
const BRAND_GOLD = '#f5c518'

function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill={BRAND_GOLD} opacity="0.18"/>
        <path d="M16 6C12.134 6 9 9.134 9 13c0 2.387 1.195 4.494 3 5.745V21a1 1 0 001 1h6a1 1 0 001-1v-2.255C21.805 17.494 23 15.387 23 13c0-3.866-3.134-7-7-7z" fill={BRAND_GOLD}/>
        <path d="M12 22h8M13 24.5h6" stroke={BRAND_GOLD} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M19.5 10.5C18.7 9.2 17.4 8.4 16 8.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      </svg>
      <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:19, color:'white', letterSpacing:'-0.5px' }}>
        Track<span style={{ color:BRAND_GOLD }}>.IO</span>
      </span>
    </div>
  )
}

export default function App() {
  const [activeModule, setActiveModule] = useState(MODULES[0].key)
  const [tasks,   setTasks]   = useState([])
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    Promise.all([loadData(KEYS.tasks), loadData(KEYS.content)])
      .then(([t, c]) => { setTasks(t); setContent(c); setLoading(false) })
  }, [])

  const ActiveComponent = MODULES.find(m => m.key === activeModule)?.Component
  const activeLabel     = MODULES.find(m => m.key === activeModule)?.label

  return (
    <div style={{ minHeight:'100dvh', background:'#f4f7fd', fontFamily:"'Segoe UI','Helvetica Neue',Arial,sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background:BRAND, padding:'0 20px', display:'flex',
        alignItems:'center', height:56, gap:0, position:'sticky', top:0, zIndex:100,
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

        {/* Sync dot */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background: loading ? BRAND_GOLD : '#4ade80',
            boxShadow: loading ? 'none' : '0 0 6px #4ade8099' }} />
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:500, whiteSpace:'nowrap' }}>
            {loading ? 'Loading…' : 'Live'}
          </span>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(v=>!v)} aria-label="Menu"
          style={{ marginLeft:14, background:'rgba(255,255,255,0.12)', border:'none',
            borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'white', fontSize:16 }}
          className="mobile-menu-btn">☰</button>
      </header>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <div style={{ background:BRAND, padding:'8px 20px 14px', display:'flex', flexDirection:'column', gap:4 }}
          className="mobile-nav">
          {MODULES.map(m => (
            <button key={m.key} onClick={() => { setActiveModule(m.key); setMenuOpen(false) }}
              style={{ padding:'10px 14px', border:'none', borderRadius:8, cursor:'pointer',
                textAlign:'left', fontWeight:600, fontSize:14,
                background: activeModule===m.key ? 'rgba(255,255,255,0.16)' : 'transparent',
                color: activeModule===m.key ? 'white' : 'rgba(255,255,255,0.65)' }}>
              {m.icon} {m.label}
            </button>
          ))}
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
              tasks={tasks}       setTasks={setTasks}
              content={content}   setContent={setContent}
            />
          )
        )}
      </main>

      {/* Responsive CSS */}
      <style>{`
        .desktop-nav { display: flex !important; }
        .mobile-menu-btn { display: none !important; }
        .mobile-nav { display: none !important; }
        @media (max-width: 600px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

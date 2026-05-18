// ============================================================
// ui.jsx — Shared UI primitives
// All stateless, theme-aware, mobile-friendly components.
// ============================================================

import { useState, useEffect, useRef } from 'react'

export const BRAND      = '#12357f'
export const BRAND_LIGHT= '#1a4ba8'
export const BRAND_PALE = '#e8eef8'
export const BRAND_GOLD = '#f5c518'

export const STATUS_OPTIONS = [
  { key:'pending',     label:'Pending',     color:'#94a3b8', bg:'#f1f5f9' },
  { key:'in_progress', label:'In Progress', color:'#2563eb', bg:'#eff6ff' },
  { key:'in_review',   label:'In Review',   color:'#d97706', bg:'#fffbeb' },
  { key:'blocked',     label:'Blocked',     color:'#dc2626', bg:'#fef2f2' },
  { key:'done',        label:'Done',        color:'#16a34a', bg:'#f0fdf4' },
]

export const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

export const PLATFORMS = [
  { key:'msia_fb',     label:'MY · Facebook'  },
  { key:'msia_ig',     label:'MY · Instagram' },
  { key:'msia_tiktok', label:'MY · TikTok'    },
  { key:'sg_fb',       label:'SG · Facebook'  },
  { key:'sg_ig',       label:'SG · Instagram' },
  { key:'sg_tiktok',   label:'SG · TikTok'    },
  { key:'xhs',         label:'XHS (小红书)'   },
]

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7)
}
export function getWeekOfMonth(date) {
  const d = new Date(date)
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay()
  return Math.ceil((d.getDate() + firstDay) / 7)
}
export function getWeeksInMonth(year, month) {
  const total = new Date(year, month+1, 0).getDate()
  const first = new Date(year, month, 1).getDay()
  return Math.ceil((total + first) / 7)
}

// ── Status badge (clickable dropdown) ───────────────────────
export function StatusBadge({ status, onChange, editable=false }) {
  const s = STATUS_OPTIONS.find(o=>o.key===status) || STATUS_OPTIONS[0]
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    if (!open) return
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>
      <button onClick={() => editable && setOpen(v=>!v)}
        style={{ background:s.bg, color:s.color, border:`1px solid ${s.color}44`,
          borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:600,
          cursor:editable?'pointer':'default', whiteSpace:'nowrap' }}>
        {s.label}
      </button>
      {open && (
        <div style={{ position:'absolute', top:'110%', left:0, zIndex:500, background:'white',
          border:'1px solid #e2e8f0', borderRadius:8, boxShadow:'0 4px 20px #0002',
          minWidth:140, overflow:'hidden' }}>
          {STATUS_OPTIONS.map(opt => (
            <div key={opt.key} onClick={() => { onChange(opt.key); setOpen(false) }}
              style={{ padding:'8px 14px', cursor:'pointer', fontSize:13,
                background: opt.key===status ? opt.bg : 'white', color: opt.color, fontWeight:600 }}
              onMouseEnter={e => e.currentTarget.style.background=opt.bg}
              onMouseLeave={e => e.currentTarget.style.background=opt.key===status?opt.bg:'white'}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide }) {
  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  return (
    <div style={{ position:'fixed', inset:0, background:'#0007', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'white', borderRadius:14, width:'100%',
        maxWidth:wide?680:520, maxHeight:'92dvh', overflow:'auto',
        boxShadow:'0 8px 40px #0003' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 20px 12px', borderBottom:'1px solid #f1f5f9',
          position:'sticky', top:0, background:'white', zIndex:1 }}>
          <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:BRAND }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20,
            cursor:'pointer', color:'#94a3b8', lineHeight:1, padding:'0 4px' }}>✕</button>
        </div>
        <div style={{ padding:'18px 20px 22px' }}>{children}</div>
      </div>
    </div>
  )
}

// ── Form Input ───────────────────────────────────────────────
export function Input({ label, value, onChange, placeholder, multiline }) {
  const base = { width:'100%', boxSizing:'border-box', padding:'8px 12px',
    border:'1px solid #e2e8f0', borderRadius:7, fontSize:14, fontFamily:'inherit',
    outline:'none', color:'#1e293b', background:'#fafbfc',
    resize: multiline ? 'vertical' : undefined,
    minHeight: multiline ? 72 : undefined }
  return (
    <div style={{ marginBottom:13 }}>
      {label && <label style={{ display:'block', fontSize:11, fontWeight:700,
        color:'#64748b', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>}
      {multiline
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base} rows={3}/>
        : <input    value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base}/>}
    </div>
  )
}

// ── Multi-link input ─────────────────────────────────────────
export function LinksInput({ label, links, onChange }) {
  const update = (i, field, val) => onChange(links.map((l,idx)=>idx===i?{...l,[field]:val}:l))
  const add    = ()  => onChange([...links, {url:'', label:''}])
  const remove = (i) => onChange(links.filter((_,idx)=>idx!==i))
  return (
    <div style={{ marginBottom:13 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
        <label style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>
        <button onClick={add} style={{ fontSize:11, color:BRAND, background:BRAND_PALE,
          border:'none', borderRadius:5, padding:'2px 8px', cursor:'pointer', fontWeight:700 }}>+ Add</button>
      </div>
      {links.map((l,i) => (
        <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
          <input value={l.label} onChange={e=>update(i,'label',e.target.value)}
            placeholder="Label" style={{ width:90, flexShrink:0, padding:'7px 9px',
              border:'1px solid #e2e8f0', borderRadius:7, fontSize:12, outline:'none', background:'#fafbfc' }}/>
          <input value={l.url} onChange={e=>update(i,'url',e.target.value)}
            placeholder="https://…" style={{ flex:1, padding:'7px 9px', minWidth:0,
              border:'1px solid #e2e8f0', borderRadius:7, fontSize:12, outline:'none', background:'#fafbfc' }}/>
          <button onClick={()=>remove(i)} style={{ background:'#fee2e2', border:'none',
            borderRadius:6, color:'#dc2626', padding:'0 9px', cursor:'pointer', fontSize:14 }}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Month / Year picker ──────────────────────────────────────
export function MonthYearPicker({ year, month, onChange }) {
  const [open,     setOpen]     = useState(false)
  const [pickYear, setPickYear] = useState(year)
  const ref = useRef()
  useEffect(() => { setPickYear(year) }, [open, year])
  useEffect(() => {
    if (!open) return
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={()=>setOpen(v=>!v)}
        style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:8,
          padding:'7px 13px', cursor:'pointer', fontWeight:600, fontSize:13, color:BRAND,
          display:'flex', alignItems:'center', gap:7 }}>
        📅 {MONTHS[month].slice(0,3)} {year} <span style={{ fontSize:10, color:'#94a3b8' }}>▾</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'110%', left:0, zIndex:400, background:'white',
          border:'1px solid #e2e8f0', borderRadius:10, boxShadow:'0 8px 24px #0002',
          padding:14, minWidth:248 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <button onClick={()=>setPickYear(y=>y-1)} style={navBtnStyle}>◀</button>
            <span style={{ fontWeight:700, color:BRAND, fontSize:14 }}>{pickYear}</span>
            <button onClick={()=>setPickYear(y=>y+1)} style={navBtnStyle}>▶</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5 }}>
            {MONTHS.map((m,i) => (
              <button key={m} onClick={()=>{ onChange(pickYear,i); setOpen(false) }}
                style={{ padding:'7px 4px', border:'none', borderRadius:7, cursor:'pointer',
                  fontSize:12, fontWeight:500,
                  background: i===month && pickYear===year ? BRAND : '#f8fafc',
                  color:       i===month && pickYear===year ? 'white' : '#374151' }}>
                {m.slice(0,3)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
const navBtnStyle = { background:'none', border:'1px solid #e2e8f0', borderRadius:6,
  padding:'3px 9px', cursor:'pointer', fontSize:12, color:BRAND }

// ── Inline date picker (popup calendar) ─────────────────────
// value: "YYYY-MM-DD" string | onChange: (val) => void
export function DatePicker({ label, value, onChange }) {
  const today     = new Date()
  const initYear  = value ? parseInt(value.slice(0,4)) : today.getFullYear()
  const initMonth = value ? parseInt(value.slice(5,7))-1 : today.getMonth()

  const [open,      setOpen]      = useState(false)
  const [pickYear,  setPickYear]  = useState(initYear)
  const [pickMonth, setPickMonth] = useState(initMonth)
  const ref = useRef()

  // Sync internal state when value changes externally
  useEffect(() => {
    if (value) {
      setPickYear(parseInt(value.slice(0,4)))
      setPickMonth(parseInt(value.slice(5,7))-1)
    }
  }, [value])

  useEffect(() => {
    if (!open) return
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const totalDays = new Date(pickYear, pickMonth+1, 0).getDate()
  const firstDow  = new Date(pickYear, pickMonth, 1).getDay()
  const cells     = [...Array(firstDow).fill(null), ...Array.from({length:totalDays},(_,i)=>i+1)]
  while (cells.length % 7 !== 0) cells.push(null)

  function selectDay(d) {
    const str = `${pickYear}-${String(pickMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    onChange(str)
    setOpen(false)
  }

  function isSelected(d) {
    if (!d || !value) return false
    return value === `${pickYear}-${String(pickMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }
  function isToday(d) {
    return d && today.getFullYear()===pickYear && today.getMonth()===pickMonth && today.getDate()===d
  }

  const displayValue = value
    ? new Date(value+'T00:00:00').toLocaleDateString('en-MY',{day:'numeric',month:'short',year:'numeric'})
    : 'Select date…'

  return (
    <div style={{ marginBottom:13 }} ref={ref}>
      {label && <label style={{ display:'block', fontSize:11, fontWeight:700,
        color:'#64748b', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>}
      <button onClick={()=>setOpen(v=>!v)}
        style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px', textAlign:'left',
          border:'1px solid #e2e8f0', borderRadius:7, fontSize:14, fontFamily:'inherit',
          outline:'none', color: value ? '#1e293b' : '#94a3b8', background:'#fafbfc',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span>{displayValue}</span>
        <span style={{ fontSize:14 }}>📅</span>
      </button>

      {open && (
        <div style={{ position:'absolute', zIndex:600, background:'white',
          border:'1px solid #e2e8f0', borderRadius:10, boxShadow:'0 8px 28px #0003',
          padding:14, minWidth:260, marginTop:4 }}>

          {/* Month/Year nav */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <button onClick={()=>{ if(pickMonth===0){setPickMonth(11);setPickYear(y=>y-1)}else setPickMonth(m=>m-1) }}
              style={navBtnStyle}>◀</button>
            <span style={{ fontWeight:700, color:BRAND, fontSize:13 }}>
              {MONTHS[pickMonth]} {pickYear}
            </span>
            <button onClick={()=>{ if(pickMonth===11){setPickMonth(0);setPickYear(y=>y+1)}else setPickMonth(m=>m+1) }}
              style={navBtnStyle}>▶</button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
            {['S','M','T','W','T','F','S'].map((d,i)=>(
              <div key={i} style={{ textAlign:'center', fontSize:10, fontWeight:700,
                color:'#94a3b8', padding:'2px 0' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {cells.map((d,i)=>(
              <button key={i} onClick={()=>d&&selectDay(d)} disabled={!d}
                style={{ padding:'6px 0', border:'none', borderRadius:6, cursor:d?'pointer':'default',
                  fontSize:12, fontWeight: isSelected(d)||isToday(d) ? 700 : 400,
                  background: isSelected(d) ? BRAND : isToday(d) ? BRAND_PALE : 'transparent',
                  color:      isSelected(d) ? 'white' : isToday(d) ? BRAND : d ? '#374151' : 'transparent' }}>
                {d||''}
              </button>
            ))}
          </div>

          {/* Clear */}
          {value && (
            <button onClick={()=>{ onChange(''); setOpen(false) }}
              style={{ marginTop:10, width:'100%', padding:'6px 0', border:'1px solid #fee2e2',
                borderRadius:6, background:'#fef2f2', color:'#dc2626', fontSize:12,
                fontWeight:600, cursor:'pointer' }}>Clear date</button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tiny icon button ─────────────────────────────────────────
export const iconBtn = (bg, color) => ({
  background:bg, border:'none', borderRadius:6, padding:'4px 8px',
  cursor:'pointer', fontSize:12, color, lineHeight:1, flexShrink:0
})

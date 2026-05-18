// ============================================================
// ContentCalendar.jsx — Module 2
// Social media content planning.
// Views: Month (full calendar grid) | Week | List
// ============================================================

import { useState } from 'react'
import { saveData, KEYS } from '../storage.js'
import {
  BRAND, BRAND_PALE, PLATFORMS,
  uid, getWeekOfMonth, getWeeksInMonth,
  Modal, Input, LinksInput, MonthYearPicker, DatePicker, iconBtn
} from '../components/ui.jsx'

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Post counting helpers ─────────────────────────────────────
// Each platform selected on a content item = 1 post.
// postCount(item)  → number of posts this item represents
// postsCompleted   → posts marked done (item.completed × platform count)
const postCount    = item => Math.max(1, (item.platforms||[]).length)
const postsTotal   = items => items.reduce((s, c) => s + postCount(c), 0)
const postsDone    = items => items.filter(c => c.completed).reduce((s, c) => s + postCount(c), 0)

// ── Content form ─────────────────────────────────────────────
function ContentForm({ initial, onSave, onClose }) {
  const empty = { platforms:[], postingDate:'', caption:'', materials:[], remarks:'', postedLinks:[], completed:false }
  const [form, setForm] = useState(initial||empty)
  const field = k => v => setForm(f=>({...f,[k]:v}))
  const togglePlatform = key => setForm(f=>({
    ...f, platforms: f.platforms.includes(key) ? f.platforms.filter(p=>p!==key) : [...f.platforms, key]
  }))
  return (
    <>
      <div style={{ marginBottom:13 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b',
          marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Posting Platform(s)</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {PLATFORMS.map(p=>(
            <button key={p.key} onClick={()=>togglePlatform(p.key)}
              style={{ padding:'5px 11px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
                background: form.platforms.includes(p.key) ? BRAND : '#f8fafc',
                color:      form.platforms.includes(p.key) ? 'white' : '#475569',
                border:`1px solid ${form.platforms.includes(p.key) ? BRAND : '#e2e8f0'}` }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <DatePicker label="Posting Date" value={form.postingDate} onChange={field('postingDate')}/>
      <Input label="Content / Caption" value={form.caption}    onChange={field('caption')}    placeholder="Caption or content…" multiline/>
      <LinksInput label="Source Files / Materials" links={form.materials}   onChange={field('materials')}/>
      <Input label="Remarks"           value={form.remarks}    onChange={field('remarks')}    placeholder="Notes…" multiline/>
      <LinksInput label="Posted Links"             links={form.postedLinks} onChange={field('postedLinks')}/>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8,
          border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:13, color:'#64748b' }}>Cancel</button>
        <button onClick={()=>(form.platforms.length||form.caption)&&onSave(form)}
          style={{ padding:'9px 20px', borderRadius:8, border:'none',
            background:BRAND, color:'white', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          {initial ? 'Save Changes' : 'Add Content'}
        </button>
      </div>
    </>
  )
}

// ── Content card (used in week + list views) ─────────────────
function ContentCard({ item, onToggle, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const platforms = PLATFORMS.filter(p=>(item.platforms||[]).includes(p.key))
  return (
    <div style={{ background: item.completed ? '#f0fdf4' : 'white',
      border:`1px solid ${item.completed ? '#86efac' : '#e8eef8'}`,
      borderRadius:10, padding:'11px 13px', marginBottom:7,
      borderLeft:`3px solid ${item.completed ? '#16a34a' : BRAND}` }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
        <button onClick={()=>onToggle(item.id)}
          style={{ flexShrink:0, width:22, height:22, borderRadius:6, marginTop:1,
            border:`2px solid ${item.completed ? '#16a34a' : '#cbd5e1'}`,
            background: item.completed ? '#16a34a' : 'white',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {item.completed && <span style={{ color:'white', fontWeight:900, fontSize:12, lineHeight:1 }}>✓</span>}
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:3 }}>
            {platforms.map(p=>(
              <span key={p.key} style={{ fontSize:10, background:BRAND_PALE, color:BRAND,
                borderRadius:4, padding:'1px 6px', fontWeight:600, whiteSpace:'nowrap' }}>{p.label}</span>
            ))}
            {item.postingDate && (
              <span style={{ fontSize:10, color:'#94a3b8', alignSelf:'center' }}>📅 {item.postingDate}</span>
            )}
            {platforms.length > 0 && (
              <span style={{ fontSize:10, background: item.completed ? '#dcfce7' : '#f1f5f9',
                color: item.completed ? '#15803d' : '#64748b',
                borderRadius:4, padding:'1px 6px', fontWeight:700, whiteSpace:'nowrap' }}>
                {platforms.length} post{platforms.length!==1?'s':''}
              </span>
            )}
          </div>
          {item.caption && (
            <p style={{ margin:0, fontSize:12, color: item.completed ? '#166534' : '#475569',
              lineHeight:1.5, display:'-webkit-box', WebkitLineClamp: expanded ? 'none' : 2,
              WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.caption}</p>
          )}
        </div>
        <div style={{ display:'flex', gap:3, flexShrink:0 }}>
          <button onClick={()=>setExpanded(v=>!v)} style={iconBtn('#e8eef8',BRAND)}>{expanded?'▲':'▼'}</button>
          <button onClick={()=>onEdit(item)}        style={iconBtn('#f0fdf4','#16a34a')}>✎</button>
          <button onClick={()=>onDelete(item.id)}   style={iconBtn('#fef2f2','#dc2626')}>✕</button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop:9, paddingTop:9, borderTop:'1px solid #f1f5f9' }}>
          {(item.materials||[]).filter(s=>s.url).length>0 && (
            <div style={{ marginBottom:7 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>Materials</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {(item.materials||[]).filter(s=>s.url).map((s,i)=>(
                  <a key={i} href={s.url} target="_blank" rel="noreferrer"
                    style={{ fontSize:11, color:BRAND, background:BRAND_PALE, borderRadius:5,
                      padding:'2px 7px', textDecoration:'none', fontWeight:500 }}>📎 {s.label||'File'}</a>
                ))}
              </div>
            </div>
          )}
          {(item.postedLinks||[]).filter(s=>s.url).length>0 && (
            <div style={{ marginBottom:7 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>Posted Links</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {(item.postedLinks||[]).filter(s=>s.url).map((s,i)=>(
                  <a key={i} href={s.url} target="_blank" rel="noreferrer"
                    style={{ fontSize:11, color:'#16a34a', background:'#f0fdf4', borderRadius:5,
                      padding:'2px 7px', textDecoration:'none', fontWeight:500 }}>🔗 {s.label||'Post'}</a>
                ))}
              </div>
            </div>
          )}
          {item.remarks && (
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>Remarks</div>
              <p style={{ margin:0, fontSize:12, color:'#475569' }}>{item.remarks}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Day cell popup (shown when clicking a day in month grid) ──
function DayPopup({ date, items, onToggle, onEdit, onDelete, onAdd, onClose }) {
  const d = new Date(date + 'T00:00:00')
  const label = d.toLocaleDateString('en-MY', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  return (
    <Modal title={label} onClose={onClose} wide>
      <div style={{ marginBottom:14 }}>
        <button onClick={onAdd}
          style={{ padding:'8px 16px', borderRadius:8, border:'none',
            background:BRAND, color:'white', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          + Add Content for this day
        </button>
      </div>
      {items.length===0 && (
        <div style={{ textAlign:'center', padding:'24px 0', color:'#94a3b8', fontSize:13 }}>
          No content scheduled for this day.
        </div>
      )}
      {items.map(item=>(
        <ContentCard key={item.id} item={item}
          onToggle={onToggle} onEdit={onEdit} onDelete={onDelete}/>
      ))}
    </Modal>
  )
}

// ── Month calendar grid ───────────────────────────────────────
function MonthGrid({ year, month, content, onDayClick }) {
  const firstDow  = new Date(year, month, 1).getDay()   // 0=Sun
  const totalDays = new Date(year, month+1, 0).getDate()
  const today     = new Date()
  const isToday   = (d) => today.getFullYear()===year && today.getMonth()===month && today.getDate()===d

  // Build map: "YYYY-MM-DD" -> items[]
  const dayMap = {}
  content.forEach(c => {
    if (!c.postingDate) return
    const d = new Date(c.postingDate)
    if (d.getFullYear()===year && d.getMonth()===month) {
      const key = c.postingDate.slice(0,10)
      if (!dayMap[key]) dayMap[key] = []
      dayMap[key].push(c)
    }
  })

  // Build grid cells: nulls for leading empty days, then 1..totalDays
  const cells = [...Array(firstDow).fill(null), ...Array.from({length:totalDays},(_,i)=>i+1)]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  // Split into weeks for KPI row
  const weeks = []
  for (let i=0; i<cells.length; i+=7) weeks.push(cells.slice(i,i+7))

  function dateStr(d) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }

  return (
    <div style={{ background:'white', border:'1px solid #e8eef8', borderRadius:12, overflow:'hidden' }}>
      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr) 80px', background:BRAND }}>
        {DAY_LABELS.map(d=>(
          <div key={d} style={{ padding:'8px 0', textAlign:'center', fontSize:11,
            fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'0.06em' }}>{d}</div>
        ))}
        <div style={{ padding:'8px 0', textAlign:'center', fontSize:11,
          fontWeight:700, color:'rgba(255,255,255,0.7)', letterSpacing:'0.06em' }}>KPI</div>
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => {
        // Count posts (platform × item) for the whole week row
        const weekDays  = week.filter(Boolean)
        const weekItems = weekDays.flatMap(d => dayMap[dateStr(d)]||[])
        const wDone  = postsDone(weekItems)
        const wTotal = postsTotal(weekItems)

        return (
          <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr) 80px',
            borderTop: wi===0 ? 'none' : '1px solid #f1f5f9' }}>
            {week.map((day, di) => {
              if (!day) return (
                <div key={di} style={{ minHeight:90, background:'#fafbfc',
                  borderRight:'1px solid #f1f5f9', padding:6 }}/>
              )
              const key   = dateStr(day)
              const items = dayMap[key]||[]
              const dDone = postsDone(items)   // posts done on this day

              return (
                <div key={di} onClick={()=>onDayClick(key)}
                  style={{ minHeight:90, padding:'6px 7px', cursor:'pointer',
                    borderRight:'1px solid #f1f5f9',
                    background: isToday(day) ? '#f0f5ff' : 'white',
                    transition:'background 0.12s' }}
                  onMouseEnter={e=>e.currentTarget.style.background= isToday(day)?'#e8f0fe':'#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background= isToday(day)?'#f0f5ff':'white'}>

                  {/* Day number */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{
                      fontSize:13, fontWeight: isToday(day) ? 800 : 500,
                      color: isToday(day) ? 'white' : '#374151',
                      background: isToday(day) ? BRAND : 'transparent',
                      borderRadius:'50%', width:24, height:24,
                      display:'flex', alignItems:'center', justifyContent:'center'
                    }}>{day}</span>
                    {dDone>0 && (
                      <span style={{ fontSize:9, fontWeight:700, color:'#16a34a',
                        background:'#f0fdf4', borderRadius:8, padding:'1px 5px' }}>✓{dDone}</span>
                    )}
                  </div>

                  {/* Content pills — one pill per platform per item */}
                  {items.flatMap((item, ii) =>
                    (item.platforms||[item]).map((platKey, pi) => {
                      const plat = typeof platKey==='string'
                        ? PLATFORMS.find(p=>p.key===platKey)
                        : PLATFORMS.find(p=>(item.platforms||[]).includes(p.key))
                      return (
                        <div key={`${ii}-${pi}`} style={{
                          fontSize:10, lineHeight:1.3, marginBottom:2, padding:'2px 5px',
                          borderRadius:4, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          background: item.completed ? '#dcfce7' : BRAND_PALE,
                          color:      item.completed ? '#15803d' : BRAND,
                          textDecoration: item.completed ? 'line-through' : 'none',
                          opacity: item.completed ? 0.8 : 1
                        }}>
                          {plat ? plat.label.split('·')[1]?.trim()||plat.label : '—'}
                          {item.caption ? ` ${item.caption.slice(0,15)}` : ''}
                        </div>
                      )
                    })
                  ).slice(0,4)}
                  {postsTotal(items)>4 && (
                    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>+{postsTotal(items)-4} more</div>
                  )}
                </div>
              )
            })}

            {/* KPI cell — posts done / total posts */}
            <div style={{ minHeight:90, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', padding:6,
              background: wDone>0 ? '#f0fdf4' : '#fafbfc',
              borderLeft:'1px solid #f1f5f9' }}>
              <div style={{ fontSize:18, fontWeight:800, color: wDone>0 ? '#16a34a' : '#cbd5e1' }}>{wDone}</div>
              <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>/{wTotal}</div>
              <div style={{ fontSize:9, color:'#94a3b8', marginTop:2 }}>done</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main module ──────────────────────────────────────────────
export default function ContentCalendar({ content, setContent }) {
  const now = new Date()
  const [year,       setYear]       = useState(now.getFullYear())
  const [month,      setMonth]      = useState(now.getMonth())
  const [view,       setView]       = useState('month')
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState(null)
  // dayPopup stores ONLY the selected date string — items are always derived live from content
  const [dayPopupDate, setDayPopupDate] = useState(null)
  const [prefillDate,  setPrefillDate]  = useState('')
  const totalWeeks = getWeeksInMonth(year, month)

  // ── Derived data (always live from content) ──────────────────
  const monthItems = content.filter(c => {
    if (!c.postingDate) return false
    const d = new Date(c.postingDate + 'T00:00:00')
    return d.getFullYear()===year && d.getMonth()===month
  })
  const weekItems = w => monthItems.filter(c => {
    const d = new Date(c.postingDate + 'T00:00:00')
    return getWeekOfMonth(d)===w
  })
  // Items for the currently open day popup — always fresh
  const dayPopupItems = dayPopupDate
    ? content.filter(c => c.postingDate && c.postingDate.slice(0,10) === dayPopupDate)
    : []

  // ── Mutators — all update the single content source of truth ─
  function addContent(form) {
    const item = { ...form, id:uid(), createdAt:new Date().toISOString() }
    setContent(prev => { const next = [...prev, item]; saveData(KEYS.content, next); return next })
    setShowForm(false)
    setPrefillDate('')
    // Keep the day popup open so user sees the newly added item immediately
  }
  function toggleComplete(id) {
    setContent(prev => { const next = prev.map(c => c.id===id ? {...c, completed:!c.completed} : c); saveData(KEYS.content, next); return next })
  }
  function saveEdit(form) {
    setContent(prev => { const next = prev.map(c => c.id===editing.id ? {...form, id:c.id, createdAt:c.createdAt} : c); saveData(KEYS.content, next); return next })
    setEditing(null)
  }
  function deleteContent(id) {
    if (!confirm('Delete this content?')) return
    setContent(prev => { const next = prev.filter(c => c.id!==id); saveData(KEYS.content, next); return next })
  }

  function handleDayClick(date) {
    setDayPopupDate(date)
  }

  // KPI chip for week view — counts posts (platforms), not items
  function KpiChip({ w }) {
    const items = weekItems(w)
    const done  = postsDone(items)
    const total = postsTotal(items)
    return (
      <div style={{ display:'inline-flex', alignItems:'center', gap:4,
        background: done>0 ? '#f0fdf4' : '#f8fafc',
        border:`1px solid ${done>0 ? '#86efac' : '#e2e8f0'}`,
        borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700,
        color: done>0 ? '#16a34a' : '#94a3b8' }}>
        KPI ✓ {done}/{total} posts
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center', marginBottom:16 }}>
        <MonthYearPicker year={year} month={month} onChange={(y,m)=>{ setYear(y); setMonth(m) }}/>
        <div style={{ display:'flex', gap:4 }}>
          {['month','week','list'].map(v=>(
            <button key={v} onClick={()=>setView(v)}
              style={{ padding:'6px 12px', borderRadius:7, border:'1px solid #e2e8f0',
                background:view===v?BRAND_PALE:'white', color:view===v?BRAND:'#374151',
                cursor:'pointer', fontSize:12, fontWeight:600 }}>
              {v==='month'?'📅 Month':v==='week'?'📆 Week':'☰ List'}
            </button>
          ))}
        </div>
        <button onClick={()=>setShowForm(true)}
          style={{ marginLeft:'auto', padding:'8px 16px', borderRadius:8, border:'none',
            background:BRAND, color:'white', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          + New Content
        </button>
      </div>

      {/* ── Month calendar grid ── */}
      {view==='month' && (
        <MonthGrid
          year={year} month={month} content={content}
          onDayClick={date => handleDayClick(date)}
        />
      )}

      {/* ── Week view ── */}
      {view==='week' && (
        <div>
          {Array.from({length:totalWeeks},(_,i)=>i+1).map(w => {
            const wItems = weekItems(w)
            return (
              <div key={w} style={{ marginBottom:22 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
                  <div style={{ background:BRAND, color:'white', borderRadius:7,
                    padding:'3px 12px', fontWeight:700, fontSize:12 }}>Week {w}</div>
                  <KpiChip w={w}/>
                  <div style={{ flex:1, height:'1px', background:'#e8eef8' }}/>
                </div>
                {wItems.length===0 && (
                  <div style={{ border:'1.5px dashed #e2e8f0', borderRadius:10, padding:'14px 0',
                    textAlign:'center', color:'#cbd5e1', fontSize:12 }}>No content scheduled</div>
                )}
                {wItems.map(item=>(
                  <ContentCard key={item.id} item={item}
                    onToggle={toggleComplete} onEdit={setEditing} onDelete={deleteContent}/>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ── List view ── */}
      {view==='list' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {[
              { label:'Total Posts',   val:postsTotal(monthItems),                        color:'#475569' },
              { label:'✓ Done',        val:postsDone(monthItems),                         color:'#16a34a' },
              { label:'Pending',       val:postsTotal(monthItems)-postsDone(monthItems),  color:'#94a3b8' },
            ].map(s=>(
              <div key={s.label} style={{ background:'#f8fafc', border:'1px solid #e2e8f0',
                borderRadius:20, padding:'3px 12px', fontSize:12, color:s.color, fontWeight:600 }}>
                {s.label}: {s.val}
              </div>
            ))}
          </div>
          <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:600 }}>
              <thead>
                <tr style={{ background:BRAND_PALE }}>
                  {['✓','Date','Platforms','Caption','Materials','Posted','Remarks',''].map((h,i)=>(
                    <th key={i} style={{ padding:'9px 10px', textAlign:'left', fontWeight:700,
                      color:BRAND, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em',
                      borderBottom:`2px solid #dce8f8`, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthItems.length===0 && (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:28, color:'#94a3b8' }}>No content this month</td></tr>
                )}
                {monthItems.map((c,i)=>(
                  <tr key={c.id} style={{ background:i%2===0?'white':'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'9px 10px' }}>
                      <button onClick={()=>toggleComplete(c.id)}
                        style={{ width:20, height:20, borderRadius:5,
                          border:`2px solid ${c.completed?'#16a34a':'#cbd5e1'}`,
                          background:c.completed?'#16a34a':'white', cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {c.completed&&<span style={{ color:'white', fontWeight:900, fontSize:11, lineHeight:1 }}>✓</span>}
                      </button>
                    </td>
                    <td style={{ padding:'9px 10px', whiteSpace:'nowrap', color:'#475569' }}>{c.postingDate}</td>
                    <td style={{ padding:'9px 10px' }}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                        {PLATFORMS.filter(p=>(c.platforms||[]).includes(p.key)).map(p=>(
                          <span key={p.key} style={{ fontSize:10, background:BRAND_PALE, color:BRAND,
                            borderRadius:4, padding:'1px 5px', fontWeight:600, whiteSpace:'nowrap' }}>{p.label}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding:'9px 10px', color:'#64748b', maxWidth:160 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.caption}</div>
                    </td>
                    <td style={{ padding:'9px 10px' }}>
                      {(c.materials||[]).filter(s=>s.url).map((s,j)=>(
                        <a key={j} href={s.url} target="_blank" rel="noreferrer"
                          style={{ display:'block', color:BRAND, fontSize:11, whiteSpace:'nowrap' }}>📎 {s.label||'File'}</a>
                      ))}
                    </td>
                    <td style={{ padding:'9px 10px' }}>
                      {(c.postedLinks||[]).filter(s=>s.url).map((s,j)=>(
                        <a key={j} href={s.url} target="_blank" rel="noreferrer"
                          style={{ display:'block', color:'#16a34a', fontSize:11, whiteSpace:'nowrap' }}>🔗 {s.label||'Link'}</a>
                      ))}
                    </td>
                    <td style={{ padding:'9px 10px', color:'#94a3b8', maxWidth:120 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.remarks}</div>
                    </td>
                    <td style={{ padding:'9px 10px' }}>
                      <div style={{ display:'flex', gap:3 }}>
                        <button onClick={()=>setEditing(c)}       style={iconBtn('#f0fdf4','#16a34a')}>✎</button>
                        <button onClick={()=>deleteContent(c.id)} style={iconBtn('#fef2f2','#dc2626')}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day popup (from calendar click) — items derived live from content */}
      {dayPopupDate && (
        <DayPopup
          date={dayPopupDate}
          items={dayPopupItems}
          onToggle={toggleComplete}
          onEdit={item => setEditing(item)}
          onDelete={deleteContent}
          onAdd={() => { setPrefillDate(dayPopupDate); setDayPopupDate(null); setShowForm(true) }}
          onClose={() => setDayPopupDate(null)}
        />
      )}

      {/* Add / Edit forms */}
      {showForm && (
        <Modal title="Add New Content" onClose={()=>{ setShowForm(false); setPrefillDate('') }} wide>
          <ContentForm
            initial={prefillDate ? { platforms:[], postingDate:prefillDate, caption:'', materials:[], remarks:'', postedLinks:[], completed:false } : undefined}
            onSave={addContent}
            onClose={()=>{ setShowForm(false); setPrefillDate('') }}
          />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Content" onClose={()=>setEditing(null)} wide>
          <ContentForm initial={editing} onSave={saveEdit} onClose={()=>setEditing(null)}/>
        </Modal>
      )}
    </div>
  )
}

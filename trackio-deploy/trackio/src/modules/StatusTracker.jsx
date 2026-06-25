// ============================================================
// StatusTracker.jsx — Module 1
// Task management with board/table views, week rotation,
// status badges, source links, and duplicate-to-week.
// ============================================================

import { useState } from 'react'
import { saveData, KEYS } from '../storage.js'
import {
  BRAND, BRAND_PALE, STATUS_OPTIONS, MONTHS,
  uid, getWeekOfMonth, getWeeksInMonth,
  StatusBadge, Modal, Input, LinksInput, MonthYearPicker, iconBtn
} from '../components/ui.jsx'

// Returns a date string for the start of a given week in a month
function weekToDate(year, month, week) {
  const firstDow = new Date(year, month, 1).getDay()
  const day = (week - 1) * 7 - firstDow + 1
  const clamped = Math.max(1, Math.min(day, new Date(year, month+1, 0).getDate()))
  return `${year}-${String(month+1).padStart(2,'0')}-${String(clamped).padStart(2,'0')}`
}

// ── Task form (add / edit) ────────────────────────────────────
function TaskForm({ initial, onSave, onClose }) {
  const today      = new Date()
  const todayYear  = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayWeek  = getWeekOfMonth(today)

  const empty = { name:'', overview:'', sources:[], remarks:'', status:'todo' }
  const [form,      setForm]      = useState(initial || empty)
  const [taskYear,  setTaskYear]  = useState(
    initial?.createdAt ? new Date(initial.createdAt).getFullYear() : todayYear
  )
  const [taskMonth, setTaskMonth] = useState(
    initial?.createdAt ? new Date(initial.createdAt).getMonth() : todayMonth
  )
  const [taskWeek,  setTaskWeek]  = useState(
    initial?.createdAt ? getWeekOfMonth(new Date(initial.createdAt)) : todayWeek
  )

  const field = k => v => setForm(f=>({...f,[k]:v}))
  const totalWeeks = getWeeksInMonth(taskYear, taskMonth)

  function handleSave() {
    if (!form.name.trim()) return
    const createdAt = weekToDate(taskYear, taskMonth, taskWeek) + 'T00:00:00.000Z'
    onSave({ ...form, createdAt })
  }

  return (
    <>
      <Input label="Task Name"  value={form.name}     onChange={field('name')}     placeholder="Enter task name…"/>
      <Input label="Overview"   value={form.overview} onChange={field('overview')} placeholder="Brief description…" multiline/>
      <LinksInput label="Source Files / Links" links={form.sources} onChange={field('sources')}/>
      <Input label="Remarks"    value={form.remarks}  onChange={field('remarks')}  placeholder="Notes or remarks…" multiline/>

      {/* Week assignment */}
      <div style={{ marginBottom:14 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b',
          marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Assign to Week</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <button onClick={()=>{ if(taskMonth===0){setTaskMonth(11);setTaskYear(y=>y-1);setTaskWeek(1)}else{setTaskMonth(m=>m-1);setTaskWeek(1)} }}
              style={miniNavBtn}>◀</button>
            <span style={{ fontSize:12, fontWeight:700, color:BRAND, minWidth:90, textAlign:'center' }}>
              {MONTHS[taskMonth].slice(0,3)} {taskYear}
            </span>
            <button onClick={()=>{ if(taskMonth===11){setTaskMonth(0);setTaskYear(y=>y+1);setTaskWeek(1)}else{setTaskMonth(m=>m+1);setTaskWeek(1)} }}
              style={miniNavBtn}>▶</button>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {Array.from({length:totalWeeks},(_,i)=>i+1).map(w=>(
              <button key={w} onClick={()=>setTaskWeek(w)}
                style={{ padding:'5px 11px', borderRadius:7, border:'1px solid #e2e8f0',
                  background: taskWeek===w ? BRAND : '#f8fafc',
                  color:      taskWeek===w ? 'white' : '#374151',
                  cursor:'pointer', fontSize:12, fontWeight:700 }}>
                W{w}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop:5, fontSize:11, color:'#94a3b8' }}>
          Currently: <strong style={{ color:BRAND }}>{MONTHS[taskMonth]} {taskYear} — Week {taskWeek}</strong>
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom:14 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b',
          marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Status</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {STATUS_OPTIONS.map(s => (
            <button key={s.key} onClick={()=>setForm(f=>({...f,status:s.key}))}
              style={{ background: form.status===s.key ? s.bg : '#f8fafc',
                color: form.status===s.key ? s.color : '#64748b',
                border:`1px solid ${form.status===s.key ? s.color+'55' : '#e2e8f0'}`,
                borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8,
          border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:13, color:'#64748b' }}>Cancel</button>
        <button onClick={handleSave}
          style={{ padding:'9px 20px', borderRadius:8, border:'none',
            background:BRAND, color:'white', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          {initial ? 'Save Changes' : 'Add Task'}
        </button>
      </div>
    </>
  )
}

const miniNavBtn = { background:'none', border:'1px solid #e2e8f0', borderRadius:6,
  padding:'3px 8px', cursor:'pointer', fontSize:11, color:BRAND }

// ── Duplicate modal — pick target week ───────────────────────
function DuplicateModal({ task, onDuplicate, onClose }) {
  const today      = new Date()
  const [dupYear,  setDupYear]  = useState(today.getFullYear())
  const [dupMonth, setDupMonth] = useState(today.getMonth())
  const [dupWeek,  setDupWeek]  = useState(getWeekOfMonth(today))
  const totalWeeks = getWeeksInMonth(dupYear, dupMonth)

  function handleDuplicate() {
    const createdAt = weekToDate(dupYear, dupMonth, dupWeek) + 'T00:00:00.000Z'
    onDuplicate({ ...task, id: uid(), createdAt })
    onClose()
  }

  return (
    <Modal title="Duplicate Task to Week" onClose={onClose}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:13, color:'#64748b', marginBottom:14 }}>
          Duplicating: <strong style={{ color:BRAND }}>{task.name}</strong>
        </div>
        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b',
          marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Target Week</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <button onClick={()=>{ if(dupMonth===0){setDupMonth(11);setDupYear(y=>y-1);setDupWeek(1)}else{setDupMonth(m=>m-1);setDupWeek(1)} }}
              style={miniNavBtn}>◀</button>
            <span style={{ fontSize:12, fontWeight:700, color:BRAND, minWidth:90, textAlign:'center' }}>
              {MONTHS[dupMonth].slice(0,3)} {dupYear}
            </span>
            <button onClick={()=>{ if(dupMonth===11){setDupMonth(0);setDupYear(y=>y+1);setDupWeek(1)}else{setDupMonth(m=>m+1);setDupWeek(1)} }}
              style={miniNavBtn}>▶</button>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {Array.from({length:totalWeeks},(_,i)=>i+1).map(w=>(
              <button key={w} onClick={()=>setDupWeek(w)}
                style={{ padding:'5px 11px', borderRadius:7, border:'1px solid #e2e8f0',
                  background: dupWeek===w ? BRAND : '#f8fafc',
                  color:      dupWeek===w ? 'white' : '#374151',
                  cursor:'pointer', fontSize:12, fontWeight:700 }}>
                W{w}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop:8, fontSize:11, color:'#94a3b8' }}>
          Target: <strong style={{ color:BRAND }}>{MONTHS[dupMonth]} {dupYear} — Week {dupWeek}</strong>
        </div>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8,
          border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:13, color:'#64748b' }}>Cancel</button>
        <button onClick={handleDuplicate}
          style={{ padding:'9px 20px', borderRadius:8, border:'none',
            background:BRAND, color:'white', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          ⧉ Duplicate
        </button>
      </div>
    </Modal>
  )
}

// ── Task card ─────────────────────────────────────────────────
// Row 1: action icons (right-aligned)
// Row 2: task name + status badge
// Expanded: overview, sources, remarks
function TaskCard({ task, onStatusChange, onEdit, onDelete, onDuplicate }) {
  const [expanded, setExpanded] = useState(false)

  const hasDetails = task.overview ||
    (task.sources||[]).filter(s=>s.url).length > 0 ||
    task.remarks

  return (
    <div style={{ background:'white', border:'1px solid #e8eef8', borderRadius:10,
      padding:'10px 12px', marginBottom:7, borderLeft:`3px solid ${BRAND}22` }}>

      {/* Row 1 — action icons, right-aligned */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:3, marginBottom:7 }}>
        {hasDetails && (
          <button onClick={()=>setExpanded(v=>!v)} title="Toggle details"
            style={iconBtn('#e8eef8', BRAND)}>{expanded ? '▲' : '▼'}</button>
        )}
        <button onClick={()=>onDuplicate(task)} title="Duplicate to another week"
          style={iconBtn('#f0f4ff', '#6366f1')}>⧉</button>
        <button onClick={()=>onEdit(task)}      title="Edit"
          style={iconBtn('#f0fdf4','#16a34a')}>✎</button>
        <button onClick={()=>onDelete(task.id)} title="Delete"
          style={iconBtn('#fef2f2','#dc2626')}>✕</button>
      </div>

      {/* Row 2 — task name */}
      <div style={{ marginBottom:6 }}>
        <span style={{ fontWeight:700, fontSize:13, color:'#1e293b',
          wordBreak:'break-word' }}>{task.name}</span>
      </div>

      {/* Row 3 — status badge */}
      <div>
        <StatusBadge status={task.status} onChange={s=>onStatusChange(task.id,s)} editable/>
      </div>

      {/* Expanded details — overview, sources, remarks */}
      {expanded && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid #f1f5f9' }}>
          {task.overview && (
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                letterSpacing:'0.07em', marginBottom:3 }}>Overview</div>
              <p style={{ margin:0, fontSize:12, color:'#475569', lineHeight:1.6 }}>{task.overview}</p>
            </div>
          )}
          {(task.sources||[]).filter(s=>s.url).length>0 && (
            <div style={{ marginBottom:7 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                letterSpacing:'0.07em', marginBottom:4 }}>Sources</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {(task.sources||[]).filter(s=>s.url).map((s,i)=>(
                  <a key={i} href={s.url} target="_blank" rel="noreferrer"
                    style={{ fontSize:11, color:BRAND, background:BRAND_PALE, borderRadius:5,
                      padding:'2px 8px', textDecoration:'none', fontWeight:500 }}>
                    🔗 {s.label||s.url.slice(0,28)}
                  </a>
                ))}
              </div>
            </div>
          )}
          {task.remarks && (
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                letterSpacing:'0.07em', marginBottom:2 }}>Remarks</div>
              <p style={{ margin:0, fontSize:12, color:'#475569' }}>{task.remarks}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main module ───────────────────────────────────────────────
export default function StatusTracker({ tasks, setTasks }) {
  const now = new Date()
  // Change 4: default week is the CURRENT real week, stays on selected week
  const [year,        setYear]        = useState(now.getFullYear())
  const [month,       setMonth]       = useState(now.getMonth())
  const [week,        setWeek]        = useState(getWeekOfMonth(now))
  const [view,        setView]        = useState('board')
  const [showForm,    setShowForm]    = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [duplicating, setDuplicating] = useState(null) // task being duplicated
  const totalWeeks = getWeeksInMonth(year, month)

  const weekTasks = tasks.filter(t => {
    if (!t.createdAt) return true
    const d = new Date(t.createdAt)
    return d.getFullYear()===year && d.getMonth()===month && getWeekOfMonth(d)===week
  })

  const grouped = STATUS_OPTIONS.reduce((acc,s)=>{
    acc[s.key] = weekTasks.filter(t=>t.status===s.key)
    return acc
  }, {})

  function addTask(form) {
    const t = { ...form, id:uid() }
    setTasks(prev=>{ const next=[...prev,t]; saveData(KEYS.tasks,next); return next })
    setShowForm(false)
  }
  function updateStatus(id, status) {
    setTasks(prev=>{ const next=prev.map(t=>t.id===id?{...t,status}:t); saveData(KEYS.tasks,next); return next })
  }
  function saveEdit(form) {
    setTasks(prev=>{ const next=prev.map(t=>t.id===editing.id?{...form,id:t.id,createdAt:t.createdAt}:t); saveData(KEYS.tasks,next); return next })
    setEditing(null)
  }
  function deleteTask(id) {
    if(!confirm('Delete this task?')) return
    setTasks(prev=>{ const next=prev.filter(t=>t.id!==id); saveData(KEYS.tasks,next); return next })
  }
  // Change 2: duplicate task — adds a copy with new id and target week's createdAt
  function duplicateTask(newTask) {
    setTasks(prev=>{ const next=[...prev, newTask]; saveData(KEYS.tasks,next); return next })
  }

  // Change 4: when month changes, try to preserve the selected week
  // if it exists in the new month, otherwise fall back to week 1
  function handleMonthChange(y, m) {
    setYear(y)
    setMonth(m)
    const newTotalWeeks = getWeeksInMonth(y, m)
    setWeek(w => Math.min(w, newTotalWeeks))
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center', marginBottom:16 }}>
        <MonthYearPicker year={year} month={month} onChange={handleMonthChange}/>
        <div style={{ display:'flex', gap:4 }}>
          {Array.from({length:totalWeeks},(_,i)=>i+1).map(w=>(
            <button key={w} onClick={()=>setWeek(w)}
              style={{ padding:'6px 11px', borderRadius:7, border:'1px solid #e2e8f0',
                background:week===w?BRAND:'white', color:week===w?'white':'#374151',
                cursor:'pointer', fontSize:12, fontWeight:700 }}>W{w}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:4, marginLeft:'auto' }}>
          {['board','table'].map(v=>(
            <button key={v} onClick={()=>setView(v)}
              style={{ padding:'6px 12px', borderRadius:7, border:'1px solid #e2e8f0',
                background:view===v?BRAND_PALE:'white', color:view===v?BRAND:'#374151',
                cursor:'pointer', fontSize:12, fontWeight:600 }}>
              {v==='board'?'⊞ Board':'☰ Table'}
            </button>
          ))}
        </div>
        <button onClick={()=>setShowForm(true)}
          style={{ padding:'8px 16px', borderRadius:8, border:'none',
            background:BRAND, color:'white', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          + New Task
        </button>
      </div>

      {/* Status summary chips */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
        {STATUS_OPTIONS.map(s=>(
          <div key={s.key} style={{ background:s.bg, color:s.color, border:`1px solid ${s.color}33`,
            borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>
            {s.label}: {grouped[s.key]?.length ?? 0}
          </div>
        ))}
        <span style={{ marginLeft:'auto', fontSize:12, color:'#94a3b8', alignSelf:'center' }}>
          {weekTasks.length} task{weekTasks.length!==1?'s':''} · Week {week}
        </span>
      </div>

      {/* Board view — all status columns in one horizontal scrollable row */}
      {view==='board' && (
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:8 }}>
          <div style={{ display:'flex', gap:12, minWidth:'max-content', alignItems:'flex-start' }}>
            {STATUS_OPTIONS.map(s=>(
              <div key={s.key} style={{ width:220, flexShrink:0 }}>
                {/* Column header */}
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8,
                  padding:'6px 10px', background:s.bg, borderRadius:8,
                  border:`1px solid ${s.color}33` }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:s.color,
                    textTransform:'uppercase', letterSpacing:'0.07em', flex:1 }}>{s.label}</span>
                  <span style={{ fontSize:11, background:'white', color:s.color,
                    borderRadius:10, padding:'1px 7px', fontWeight:800,
                    border:`1px solid ${s.color}44` }}>
                    {grouped[s.key]?.length ?? 0}
                  </span>
                </div>
                {/* Cards */}
                {(grouped[s.key]||[]).map(t=>(
                  <TaskCard key={t.id} task={t}
                    onStatusChange={updateStatus}
                    onEdit={setEditing}
                    onDelete={deleteTask}
                    onDuplicate={setDuplicating}
                  />
                ))}
                {(grouped[s.key]||[]).length===0 && (
                  <div style={{ border:'1.5px dashed #e2e8f0', borderRadius:10, padding:'20px 0',
                    textAlign:'center', color:'#cbd5e1', fontSize:12 }}>Empty</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table view */}
      {view==='table' && (
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:560 }}>
            <thead>
              <tr style={{ background:BRAND_PALE }}>
                {['Task','Overview','Status','Sources','Remarks',''].map(h=>(
                  <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700,
                    color:BRAND, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em',
                    borderBottom:`2px solid #dce8f8`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekTasks.length===0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:28, color:'#94a3b8' }}>No tasks this week</td></tr>
              )}
              {weekTasks.map((t,i)=>(
                <tr key={t.id} style={{ background:i%2===0?'white':'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'9px 12px', fontWeight:600, color:'#1e293b', maxWidth:140, wordBreak:'break-word' }}>{t.name}</td>
                  <td style={{ padding:'9px 12px', color:'#64748b', maxWidth:180 }}>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.overview}</div>
                  </td>
                  <td style={{ padding:'9px 12px' }}>
                    <StatusBadge status={t.status} onChange={s=>updateStatus(t.id,s)} editable/>
                  </td>
                  <td style={{ padding:'9px 12px' }}>
                    {(t.sources||[]).filter(s=>s.url).map((s,j)=>(
                      <a key={j} href={s.url} target="_blank" rel="noreferrer"
                        style={{ display:'block', color:BRAND, fontSize:11, whiteSpace:'nowrap' }}>
                        🔗 {s.label||'Link'}
                      </a>
                    ))}
                  </td>
                  <td style={{ padding:'9px 12px', color:'#64748b', maxWidth:140 }}>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.remarks}</div>
                  </td>
                  <td style={{ padding:'9px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>setDuplicating(t)} title="Duplicate" style={iconBtn('#f0f4ff','#6366f1')}>⧉</button>
                      <button onClick={()=>setEditing(t)}     style={iconBtn('#f0fdf4','#16a34a')}>✎</button>
                      <button onClick={()=>deleteTask(t.id)}  style={iconBtn('#fef2f2','#dc2626')}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <Modal title="Add New Task" onClose={()=>setShowForm(false)}>
          <TaskForm onSave={addTask} onClose={()=>setShowForm(false)}/>
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Task" onClose={()=>setEditing(null)}>
          <TaskForm initial={editing} onSave={saveEdit} onClose={()=>setEditing(null)}/>
        </Modal>
      )}
      {duplicating && (
        <DuplicateModal
          task={duplicating}
          onDuplicate={duplicateTask}
          onClose={()=>setDuplicating(null)}
        />
      )}
    </div>
  )
}

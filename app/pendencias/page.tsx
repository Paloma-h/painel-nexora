'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'

const PRIOS = [
  { key:'CRITICAL', label:'🔴 Urgente', color:'#e05252' },
  { key:'HIGH',     label:'🟠 Alta',    color:'#e08c42' },
  { key:'MEDIUM',   label:'🟡 Média',   color:'#d4b84a' },
  { key:'LOW',      label:'🟢 Depois',  color:'#4caf7d' },
]



export default function PendenciasPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Captura rápida
  const [quickTitle, setQuickTitle] = useState('')
  const [quickPrio, setQuickPrio] = useState('CRITICAL')
  const [adding, setAdding] = useState(false)

  // Edição
  const [editingId, setEditingId] = useState<string|null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrio, setEditPrio] = useState('CRITICAL')

  // Mostrar concluídas
  const [showDone, setShowDone] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('type', 'pendencia')
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  async function add() {
    if (!quickTitle.trim()) return
    setAdding(true)
    await supabase.from('tasks').insert({
      id: crypto.randomUUID(),
      title: quickTitle.trim(),
      priority: quickPrio,
      type: 'pendencia',
      status: 'PENDING',
      user_id: USER_ID
    })
    setQuickTitle('')
    setAdding(false)
    load()
  }

  async function complete(id: string) {
    await supabase.from('tasks').update({ status: 'DONE' }).eq('id', id)
    load()
  }

  async function reopen(id: string) {
    await supabase.from('tasks').update({ status: 'PENDING' }).eq('id', id)
    load()
  }

  async function remove(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) return
    await supabase.from('tasks').update({ title: editTitle.trim(), priority: editPrio }).eq('id', id)
    setEditingId(null)
    load()
  }

  const prioOrder: any = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const pending = tasks
    .filter(t => t.status !== 'DONE')
    .sort((a, b) => (prioOrder[a.priority] ?? 2) - (prioOrder[b.priority] ?? 2))
  const done = tasks.filter(t => t.status === 'DONE')

  const pColor: any = { CRITICAL:'#e05252', HIGH:'#e08c42', MEDIUM:'#d4b84a', LOW:'#4caf7d' }

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />
      <div style={{flex:1,padding:'32px',overflowY:'auto'}}>
        <div style={{maxWidth:'680px',margin:'0 auto'}}>

          {/* Título */}
          <div style={{marginBottom:'28px'}}>
            <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>Pendências</h1>
            <p style={{color:'#444',fontSize:'15px',marginTop:'4px'}}>
              {pending.length} para fazer{done.length>0?` · ${done.length} concluída${done.length>1?'s':''}`:''}
            </p>
          </div>

          {/* ── CAPTURA RÁPIDA ── */}
          <div style={{background:'#fff',border:'1px solid #d0d0d8',borderRadius:'16px',padding:'18px',marginBottom:'32px'}}>
            <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
              <input
                autoFocus
                placeholder="O que precisa ser feito? (Enter para adicionar)"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
                style={{flex:1,background:'#fff',border:'1px solid #d0d0d8',borderRadius:'10px',padding:'12px 14px',color:'#111',fontSize:'15px',outline:'none'}}
              />
              <button
                onClick={add}
                disabled={!quickTitle.trim() || adding}
                style={{padding:'12px 20px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:700,cursor:'pointer',opacity:!quickTitle.trim()||adding?0.4:1,flexShrink:0}}
              >
                + Adicionar
              </button>
            </div>
            {/* Seletor de prioridade */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px'}}>
              {PRIOS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setQuickPrio(p.key)}
                  style={{padding:'8px 4px',borderRadius:'8px',border:`1px solid ${quickPrio===p.key?p.color:'rgba(255,255,255,0.07)'}`,background:quickPrio===p.key?`${p.color}22`:'transparent',color:quickPrio===p.key?p.color:'#444',fontSize:'15px',cursor:'pointer',fontWeight:quickPrio===p.key?700:400,transition:'all 0.15s'}}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── LISTA ── */}
          {loading ? (
            <p style={{color:'#444',textAlign:'center',padding:'40px'}}>Carregando...</p>
          ) : pending.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 0'}}>
              <p style={{fontSize:'48px',marginBottom:'12px'}}>✅</p>
              <p style={{color:'#333',fontSize:'18px',fontWeight:600}}>Tudo em dia!</p>
              <p style={{color:'#555',fontSize:'15px',marginTop:'4px'}}>Adicione uma pendência acima.</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {pending.map(t => {
                const isEditing = editingId === t.id
                const pc = pColor[t.priority] || '#888'
                return (
                  <div key={t.id} style={{borderRadius:'14px',background:'#fff',border:`1px solid ${pc}33`,overflow:'hidden'}}>
                    {isEditing ? (
                      /* Modo edição inline */
                      <div style={{padding:'14px 16px'}}>
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => { if(e.key==='Enter') saveEdit(t.id); if(e.key==='Escape') setEditingId(null) }}
                          style={{width:'100%',background:'#fff',border:'1px solid #d0d0d8',borderRadius:'8px',padding:'10px 12px',color:'#111',fontSize:'15px',outline:'none',marginBottom:'10px',boxSizing:'border-box'}}
                        />
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',marginBottom:'10px'}}>
                          {PRIOS.map(p => (
                            <button key={p.key} onClick={() => setEditPrio(p.key)} style={{padding:'7px 4px',borderRadius:'8px',border:`1px solid ${editPrio===p.key?p.color:'rgba(255,255,255,0.07)'}`,background:editPrio===p.key?`${p.color}22`:'transparent',color:editPrio===p.key?p.color:'#444',fontSize:'15px',cursor:'pointer',fontWeight:editPrio===p.key?700:400}}>{p.label}</button>
                          ))}
                        </div>
                        <div style={{display:'flex',gap:'8px'}}>
                          <button onClick={() => saveEdit(t.id)} style={{flex:1,padding:'9px',background:'#5b50d6',border:'none',borderRadius:'8px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>Salvar</button>
                          <button onClick={() => setEditingId(null)} style={{padding:'9px 14px',background:'transparent',border:'1px solid #d0d0d8',borderRadius:'8px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
                          <button onClick={() => { remove(t.id); setEditingId(null) }} style={{padding:'9px 14px',background:'rgba(224,82,82,0.1)',border:'1px solid rgba(224,82,82,0.2)',borderRadius:'8px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>Apagar</button>
                        </div>
                      </div>
                    ) : (
                      /* Modo normal */
                      <div style={{display:'flex',alignItems:'center',gap:'14px',padding:'16px'}}>
                        {/* Checkbox grande */}
                        <div
                          onClick={() => complete(t.id)}
                          style={{width:'26px',height:'26px',borderRadius:'8px',border:`2px solid ${pc}`,background:'transparent',flexShrink:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                        />
                        {/* Prioridade dot + título */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                            <div style={{width:'8px',height:'8px',borderRadius:'50%',background:pc,flexShrink:0}}/>
                            <span style={{color:'#333',fontSize:'15px'}}>{PRIOS.find(p=>p.key===t.priority)?.label.split(' ')[1]||''}</span>
                          </div>
                          <p style={{color:'#111',fontSize:'15px',fontWeight:500,lineHeight:1.4}}>{t.title}</p>
                          {t.notes && <p style={{color:'#444',fontSize:'15px',marginTop:'3px'}}>{t.notes}</p>}
                        </div>
                        {/* Editar */}
                        <button
                          onClick={() => { setEditingId(t.id); setEditTitle(t.title); setEditPrio(t.priority||'MEDIUM') }}
                          style={{padding:'7px 10px',background:'#fff',border:'none',borderRadius:'8px',color:'#444',fontSize:'15px',cursor:'pointer',flexShrink:0}}
                        >✎</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── CONCLUÍDAS ── */}
          {done.length > 0 && (
            <div style={{marginTop:'32px'}}>
              <button
                onClick={() => setShowDone(v => !v)}
                style={{background:'transparent',border:'none',color:'#444',fontSize:'15px',cursor:'pointer',textTransform:'uppercase',letterSpacing:'1px',padding:0,marginBottom:'10px'}}
              >
                {showDone ? '▲' : '▼'} Concluídas ({done.length})
              </button>
              {showDone && (
                <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                  {done.map(t => (
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderRadius:'12px',background:'#fff',opacity:0.5}}>
                      <div onClick={() => reopen(t.id)} style={{width:'26px',height:'26px',borderRadius:'8px',background:'#5b50d6',flexShrink:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',color:'#111'}}>✓</div>
                      <p style={{flex:1,color:'#444',fontSize:'15px',textDecoration:'line-through'}}>{t.title}</p>
                      <button onClick={() => remove(t.id)} style={{padding:'4px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'6px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'
const CATEGORIA = 'campanha2026'

const PRIOS = [
  { key:'CRITICAL', label:'🔴 Urgente', color:'#dc2626' },
  { key:'HIGH',     label:'🟠 Alta',    color:'#c2410c' },
  { key:'MEDIUM',   label:'🟡 Média',   color:'#854d0e' },
  { key:'LOW',      label:'🟢 Depois',  color:'#15803d' },
]

export default function Campanha2026Page() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [quickTitle, setQuickTitle] = useState('')
  const [quickPrio, setQuickPrio] = useState('CRITICAL')
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState<string|null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrio, setEditPrio] = useState('CRITICAL')

  const [showDone, setShowDone] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('tasks').select('*').eq('user_id', USER_ID).eq('type', 'pendencia').eq('category', CATEGORIA).order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  async function add() {
    if (!quickTitle.trim()) return
    setAdding(true)
    await supabase.from('tasks').insert({id:crypto.randomUUID(),title:quickTitle.trim(),priority:quickPrio,type:'pendencia',status:'PENDING',category:CATEGORIA,user_id:USER_ID})
    setQuickTitle(''); setAdding(false); load()
  }

  async function complete(id:string) { await supabase.from('tasks').update({status:'DONE'}).eq('id',id); load() }
  async function reopen(id:string) { await supabase.from('tasks').update({status:'PENDING'}).eq('id',id); load() }
  async function remove(id:string) { if (!confirm('Apagar?')) return; await supabase.from('tasks').delete().eq('id',id); load() }

  async function saveEdit(id:string) {
    if (!editTitle.trim()) return
    await supabase.from('tasks').update({title:editTitle.trim(),priority:editPrio}).eq('id',id)
    setEditingId(null); load()
  }

  const prioOrder:any = {CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3}
  const pending = tasks.filter(t=>t.status!=='DONE').sort((a,b)=>(prioOrder[a.priority]??2)-(prioOrder[b.priority]??2))
  const done = tasks.filter(t=>t.status==='DONE')
  const pColor:any = {CRITICAL:'#dc2626',HIGH:'#ea580c',MEDIUM:'#ca8a04',LOW:'#16a34a'}

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />
      <div style={{flex:1,padding:'32px',overflowY:'auto'}}>
        <div style={{maxWidth:'760px',margin:'0 auto'}}>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <div>
              <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>🗳️ Campanha 2026</h1>
              <p style={{color:'#444',fontSize:'14px',marginTop:'4px'}}>{pending.length} para fazer{done.length>0?` · ${done.length} concluída${done.length>1?'s':''}`:''}</p>
            </div>
          </div>

          <div style={{background:'#fff',border:'2px solid #7c3aed33',borderRadius:'16px',padding:'16px',marginBottom:'24px'}}>
            <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
              <input autoFocus placeholder="O que precisa ser feito na campanha? (Enter)" value={quickTitle} onChange={e=>setQuickTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
                style={{flex:1,background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'10px 14px',color:'#111',fontSize:'14px',outline:'none'}} />
              <button onClick={add} disabled={!quickTitle.trim()||adding}
                style={{padding:'10px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!quickTitle.trim()||adding?0.4:1,flexShrink:0}}>+ Adicionar</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'4px'}}>
              {PRIOS.map(p=>(
                <button key={p.key} onClick={()=>setQuickPrio(p.key)} style={{padding:'6px',borderRadius:'7px',border:`1px solid ${quickPrio===p.key?p.color:'#f0f0f3'}`,background:quickPrio===p.key?`${p.color}22`:'transparent',color:quickPrio===p.key?p.color:'#444',fontSize:'12px',cursor:'pointer',fontWeight:quickPrio===p.key?700:400}}>{p.label}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <p style={{color:'#aaa',fontSize:'13px',textAlign:'center',padding:'20px 0'}}>Carregando...</p>
          ) : pending.length===0 ? (
            <p style={{color:'#aaa',fontSize:'13px',textAlign:'center',padding:'20px 0'}}>Nenhuma pendência da campanha por enquanto.</p>
          ) : (
            <div>
              {pending.map(t => {
                const pc = pColor[t.priority]||'#888'
                const isEditing = editingId===t.id
                return (
                  <div key={t.id} style={{padding:'10px 12px',borderRadius:'10px',background:'#fafafa',border:`1px solid ${pc}22`,marginBottom:'6px'}}>
                    {isEditing ? (
                      <div>
                        <input autoFocus value={editTitle} onChange={e=>setEditTitle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveEdit(t.id);if(e.key==='Escape')setEditingId(null)}}
                          style={{width:'100%',background:'#fff',border:'1px solid #ddd',borderRadius:'6px',padding:'7px 10px',color:'#111',fontSize:'13px',outline:'none',marginBottom:'6px',boxSizing:'border-box'}} />
                        <div style={{display:'flex',gap:'4px'}}>
                          {PRIOS.map(p=>(
                            <button key={p.key} onClick={()=>setEditPrio(p.key)} style={{flex:1,padding:'4px',borderRadius:'5px',border:`1px solid ${editPrio===p.key?p.color:'#eee'}`,background:editPrio===p.key?`${p.color}22`:'#fff',color:editPrio===p.key?p.color:'#aaa',fontSize:'10px',cursor:'pointer',fontWeight:editPrio===p.key?700:400}}>{p.label.split(' ')[1]}</button>
                          ))}
                        </div>
                        <div style={{display:'flex',gap:'4px',marginTop:'6px'}}>
                          <button onClick={()=>saveEdit(t.id)} style={{flex:1,padding:'6px',background:'#7c3aed',border:'none',borderRadius:'6px',color:'#fff',fontSize:'11px',fontWeight:600,cursor:'pointer'}}>Salvar</button>
                          <button onClick={()=>setEditingId(null)} style={{padding:'6px 10px',background:'#fff',border:'1px solid #ddd',borderRadius:'6px',color:'#666',fontSize:'11px',cursor:'pointer'}}>✕</button>
                          <button onClick={()=>{remove(t.id);setEditingId(null)}} style={{padding:'6px 10px',background:'#fff',border:'1px solid #fca5a5',borderRadius:'6px',color:'#dc2626',fontSize:'11px',cursor:'pointer'}}>🗑</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div onClick={()=>complete(t.id)} style={{width:'20px',height:'20px',borderRadius:'6px',border:`2px solid ${pc}`,flexShrink:0,cursor:'pointer'}} />
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                            <div style={{width:'6px',height:'6px',borderRadius:'50%',background:pc,flexShrink:0}} />
                            <span style={{fontSize:'11px',color:pc}}>{PRIOS.find(p=>p.key===t.priority)?.label.split(' ')[1]}</span>
                          </div>
                          <p style={{fontSize:'14px',color:'#111',fontWeight:500,lineHeight:1.3}}>{t.title}</p>
                        </div>
                        <button onClick={()=>{setEditingId(t.id);setEditTitle(t.title);setEditPrio(t.priority||'MEDIUM')}} style={{background:'none',border:'none',color:'#bbb',cursor:'pointer',fontSize:'13px',flexShrink:0}}>✎</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {done.length > 0 && (
            <div style={{marginTop:'24px'}}>
              <button onClick={()=>setShowDone(v=>!v)} style={{background:'transparent',border:'none',color:'#444',fontSize:'13px',cursor:'pointer',textTransform:'uppercase',letterSpacing:'1px',padding:0,marginBottom:'10px'}}>
                {showDone?'▲':'▼'} Concluídas ({done.length})
              </button>
              {showDone && (
                <div>
                  {done.map(t=>(
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',borderRadius:'10px',background:'#fafafa',opacity:0.5,marginBottom:'4px'}}>
                      <div onClick={()=>reopen(t.id)} style={{width:'20px',height:'20px',borderRadius:'6px',background:'#7c3aed',flexShrink:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#fff'}}>✓</div>
                      <p style={{flex:1,color:'#444',fontSize:'12px',textDecoration:'line-through'}}>{t.title}</p>
                      <button onClick={()=>remove(t.id)} style={{background:'none',border:'none',color:'#dc2626',cursor:'pointer',fontSize:'12px'}}>✕</button>
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

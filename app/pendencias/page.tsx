'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'

const PRIOS = [
  { key:'CRITICAL', label:'🔴 Urgente', color:'#dc2626' },
  { key:'HIGH',     label:'🟠 Alta',    color:'#c2410c' },
  { key:'MEDIUM',   label:'🟡 Média',   color:'#854d0e' },
  { key:'LOW',      label:'🟢 Depois',  color:'#15803d' },
]



const EMP_TIPOS = ['Emprestei','Me emprestaram','Cedi','Me cederam']

function EmprestadosPanel() {
  const [items, setItems] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({item:'',pessoa:'',tipo:'Emprestei',data:'',valor:'',notas:''})
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadEmp() }, [])
  async function loadEmp() {
    const {data} = await supabase.from('emprestados').select('*').eq('user_id',USER_ID).eq('status','pendente').order('created_at',{ascending:false})
    setItems(data||[])
  }

  async function saveEmp() {
    if (!form.item.trim()||!form.pessoa.trim()) return
    setSaving(true)
    await supabase.from('emprestados').insert({id:crypto.randomUUID(),item:form.item.trim(),pessoa:form.pessoa.trim(),tipo:form.tipo,data:form.data||null,valor:form.valor?parseFloat(form.valor):null,notas:form.notas||null,status:'pendente',user_id:USER_ID})
    setShowForm(false); setSaving(false); setForm({item:'',pessoa:'',tipo:'Emprestei',data:'',valor:'',notas:''}); loadEmp()
  }

  async function devolver(id:string) {
    await supabase.from('emprestados').update({status:'devolvido'}).eq('id',id); loadEmp()
  }

  async function delEmp(id:string) {
    if (!confirm('Apagar?')) return
    await supabase.from('emprestados').delete().eq('id',id); loadEmp()
  }

  const emprestei = items.filter(i=>i.tipo==='Emprestei'||i.tipo==='Cedi')
  const meEmprestaram = items.filter(i=>i.tipo==='Me emprestaram'||i.tipo==='Me cederam')

  return (
    <div style={{background:'#fff',border:'2px solid #e5e5ea',borderRadius:'16px',padding:'18px',height:'fit-content'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
        <h2 style={{color:'#111',fontSize:'16px',fontWeight:700}}>🤝 Emprestados / Cedidos</h2>
        <button onClick={()=>setShowForm(!showForm)} style={{padding:'5px 12px',background:'#7c3aed',border:'none',borderRadius:'8px',color:'#fff',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>+ Novo</button>
      </div>

      {showForm && (
        <div style={{background:'#f5f3ff',border:'1px solid #e9e5ff',borderRadius:'12px',padding:'12px',marginBottom:'12px'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            <input placeholder="O que? *" value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))} style={{background:'#fff',border:'1px solid #ddd',borderRadius:'8px',padding:'8px 10px',fontSize:'13px',color:'#111',outline:'none'}} />
            <input placeholder="Quem? *" value={form.pessoa} onChange={e=>setForm(f=>({...f,pessoa:e.target.value}))} style={{background:'#fff',border:'1px solid #ddd',borderRadius:'8px',padding:'8px 10px',fontSize:'13px',color:'#111',outline:'none'}} />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px'}}>
              {EMP_TIPOS.map(t=>(
                <button key={t} onClick={()=>setForm(f=>({...f,tipo:t}))} style={{padding:'6px',borderRadius:'6px',border:`1px solid ${form.tipo===t?'#7c3aed':'#e5e5ea'}`,background:form.tipo===t?'#f5f3ff':'#fff',color:form.tipo===t?'#7c3aed':'#666',fontSize:'11px',cursor:'pointer',fontWeight:form.tipo===t?700:400}}>{t}</button>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
              <input type="date" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} style={{background:'#fff',border:'1px solid #ddd',borderRadius:'8px',padding:'8px',fontSize:'12px',color:'#111',outline:'none',colorScheme:'light'}} />
              <input placeholder="Valor R$" type="number" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} style={{background:'#fff',border:'1px solid #ddd',borderRadius:'8px',padding:'8px',fontSize:'12px',color:'#111',outline:'none'}} />
            </div>
            <div style={{display:'flex',gap:'6px'}}>
              <button onClick={saveEmp} disabled={!form.item.trim()||!form.pessoa.trim()||saving} style={{flex:1,padding:'8px',background:'#7c3aed',border:'none',borderRadius:'8px',color:'#fff',fontSize:'12px',fontWeight:600,cursor:'pointer',opacity:!form.item.trim()||!form.pessoa.trim()||saving?0.4:1}}>{saving?'...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'8px 12px',background:'#fff',border:'1px solid #ddd',borderRadius:'8px',color:'#666',fontSize:'12px',cursor:'pointer'}}>✕</button>
            </div>
          </div>
        </div>
      )}

      {items.length===0 && !showForm && <p style={{color:'#aaa',fontSize:'13px',textAlign:'center',padding:'20px 0'}}>Nenhum item</p>}

      {emprestei.length>0 && (
        <div style={{marginBottom:'12px'}}>
          <p style={{fontSize:'11px',color:'#dc2626',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>📤 Eu emprestei / cedi</p>
          {emprestei.map((i:any)=>(
            <div key={i.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',marginBottom:'4px'}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:'13px',color:'#111',fontWeight:600}}>{i.item}</p>
                <p style={{fontSize:'11px',color:'#666'}}>→ {i.pessoa}{i.valor?` · R$ ${Number(i.valor).toFixed(2)}`:''}{i.data?` · ${new Date(i.data+'T12:00:00').toLocaleDateString('pt-BR')}`:''}</p>
              </div>
              <button onClick={()=>devolver(i.id)} style={{padding:'4px 8px',background:'#16a34a',border:'none',borderRadius:'6px',color:'#fff',fontSize:'10px',fontWeight:700,cursor:'pointer'}}>Devolveu</button>
              <button onClick={()=>delEmp(i.id)} style={{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:'12px'}}>✕</button>
            </div>
          ))}
        </div>
      )}

      {meEmprestaram.length>0 && (
        <div>
          <p style={{fontSize:'11px',color:'#0891b2',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>📥 Me emprestaram / cederam</p>
          {meEmprestaram.map((i:any)=>(
            <div key={i.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',background:'#ecfeff',border:'1px solid #a5f3fc',borderRadius:'10px',marginBottom:'4px'}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:'13px',color:'#111',fontWeight:600}}>{i.item}</p>
                <p style={{fontSize:'11px',color:'#666'}}>← {i.pessoa}{i.valor?` · R$ ${Number(i.valor).toFixed(2)}`:''}{i.data?` · ${new Date(i.data+'T12:00:00').toLocaleDateString('pt-BR')}`:''}</p>
              </div>
              <button onClick={()=>devolver(i.id)} style={{padding:'4px 8px',background:'#0891b2',border:'none',borderRadius:'6px',color:'#fff',fontSize:'10px',fontWeight:700,cursor:'pointer'}}>Devolvi</button>
              <button onClick={()=>delEmp(i.id)} style={{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:'12px'}}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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

  const pColor: any = { CRITICAL:'#dc2626', HIGH:'#ea580c', MEDIUM:'#ca8a04', LOW:'#16a34a' }

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />
      <div style={{flex:1,padding:'32px',overflowY:'auto'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 340px',gap:'28px',alignItems:'start'}}>
        <div>

          {/* Título */}
          <div style={{marginBottom:'28px'}}>
            <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>Pendências</h1>
            <p style={{color:'#444',fontSize:'15px',marginTop:'4px'}}>
              {pending.length} para fazer{done.length>0?` · ${done.length} concluída${done.length>1?'s':''}`:''}
            </p>
          </div>

          {/* ── CAPTURA RÁPIDA ── */}
          <div style={{background:'#fff',border:'2px solid #bbb',borderRadius:'16px',padding:'18px',marginBottom:'32px'}}>
            <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
              <input
                autoFocus
                placeholder="O que precisa ser feito? (Enter para adicionar)"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
                style={{flex:1,background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'12px 14px',color:'#111',fontSize:'15px',outline:'none'}}
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
                  style={{padding:'8px 4px',borderRadius:'8px',border:`1px solid ${quickPrio===p.key?p.color:'#f0f0f3'}`,background:quickPrio===p.key?`${p.color}22`:'transparent',color:quickPrio===p.key?p.color:'#444',fontSize:'15px',cursor:'pointer',fontWeight:quickPrio===p.key?700:400,transition:'all 0.15s'}}
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
                          style={{width:'100%',background:'#fff',border:'2px solid #bbb',borderRadius:'8px',padding:'10px 12px',color:'#111',fontSize:'15px',outline:'none',marginBottom:'10px',boxSizing:'border-box'}}
                        />
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',marginBottom:'10px'}}>
                          {PRIOS.map(p => (
                            <button key={p.key} onClick={() => setEditPrio(p.key)} style={{padding:'7px 4px',borderRadius:'8px',border:`1px solid ${editPrio===p.key?p.color:'#f0f0f3'}`,background:editPrio===p.key?`${p.color}22`:'transparent',color:editPrio===p.key?p.color:'#444',fontSize:'15px',cursor:'pointer',fontWeight:editPrio===p.key?700:400}}>{p.label}</button>
                          ))}
                        </div>
                        <div style={{display:'flex',gap:'8px'}}>
                          <button onClick={() => saveEdit(t.id)} style={{flex:1,padding:'9px',background:'#5b50d6',border:'none',borderRadius:'8px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>Salvar</button>
                          <button onClick={() => setEditingId(null)} style={{padding:'9px 14px',background:'transparent',border:'2px solid #bbb',borderRadius:'8px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
                          <button onClick={() => { remove(t.id); setEditingId(null) }} style={{padding:'9px 14px',background:'#fff',border:'2px solid #ef4444',borderRadius:'8px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>Apagar</button>
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
                      <button onClick={() => remove(t.id)} style={{padding:'4px 8px',background:'#fff',border:'none',borderRadius:'6px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Painel lateral: Emprestados */}
        <EmprestadosPanel />
        </div>
      </div>
    </div>
  )
}

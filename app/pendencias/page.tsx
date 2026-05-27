'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

const USER_ID = 'paloma'
const PRIO_COLOR: any = {CRITICAL:'#e05252',HIGH:'#e05252',MEDIUM:'#d4b84a',LOW:'#4caf7d'}
const PRIO_LABEL: any = {CRITICAL:'Urgente',HIGH:'Alta',MEDIUM:'Média',LOW:'Depois'}

function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  async function logout() { await supabase.auth.signOut(); router.push('/login') }
  return (
    <div style={{width:'160px',background:'#0d0d1a',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',padding:'20px 12px',flexShrink:0,minHeight:'100vh'}}>
      <div style={{color:'#7c6ff7',fontWeight:700,fontSize:'16px',marginBottom:'28px',padding:'0 4px'}}>NEXORA</div>
      <Link href="/dashboard" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/dashboard'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/dashboard'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/dashboard'?500:400}}>Dashboard</Link>
      <Link href="/agenda" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/agenda'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/agenda'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/agenda'?500:400}}>Agenda</Link>
      <Link href="/pendencias" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/pendencias'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/pendencias'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/pendencias'?500:400}}>Pendências</Link>
      <Link href="/crm" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/crm'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/crm'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/crm'?500:400}}>CRM</Link>
      <Link href="/financeiro" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/financeiro'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/financeiro'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/financeiro'?500:400}}>Financeiro</Link>
      <div style={{marginTop:'auto'}}>
        <button onClick={logout} style={{display:'block',width:'100%',padding:'9px 12px',borderRadius:'10px',fontSize:'12px',color:'rgba(255,255,255,0.2)',background:'transparent',border:'none',textAlign:'left',cursor:'pointer'}}>Sair</button>
      </div>
    </div>
  )
}

export default function PendenciasPage() {
  const [pendencias, setPendencias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({title:'',priority:'MEDIUM',notes:''})
  const [saving, setSaving] = useState(false)
  const [filterPrio, setFilterPrio] = useState('Todas')
  const [filterStatus, setFilterStatus] = useState('pendentes')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('tasks').select('*').eq('user_id', USER_ID).eq('type','pendencia').order('created_at', {ascending:false})
    setPendencias(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm({title:'',priority:'MEDIUM',notes:''}); setShowForm(true) }
  function openEdit(p: any) { setEditing(p); setForm({title:p.title,priority:p.priority||'MEDIUM',notes:p.notes||''}); setShowForm(true) }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    if (editing) {
      await supabase.from('tasks').update({title:form.title.trim(),priority:form.priority,notes:form.notes||null}).eq('id', editing.id)
    } else {
      await supabase.from('tasks').insert({id:crypto.randomUUID(),title:form.title.trim(),priority:form.priority,notes:form.notes||null,type:'pendencia',status:'PENDING',user_id:USER_ID})
    }
    setShowForm(false); setSaving(false); load()
  }

  async function remove(id: string) {
    await supabase.from('tasks').delete().eq('id', id); load()
  }

  async function complete(id: string) {
    await supabase.from('tasks').update({status:'DONE'}).eq('id', id); load()
  }

  async function reopen(id: string) {
    await supabase.from('tasks').update({status:'PENDING'}).eq('id', id); load()
  }

  const filtered = pendencias.filter(p => {
    const matchStatus = filterStatus === 'todas' || (filterStatus === 'pendentes' ? p.status !== 'DONE' : p.status === 'DONE')
    const matchPrio = filterPrio === 'Todas' || p.priority === filterPrio
    return matchStatus && matchPrio
  })

  const pendentes = pendencias.filter(p => p.status !== 'DONE').length
  const concluidas = pendencias.filter(p => p.status === 'DONE').length

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,padding:'32px',overflowY:'auto'}}>
        <div style={{maxWidth:'700px',margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
            <div>
              <h1 style={{color:'#fff',fontSize:'22px',fontWeight:700}}>Pendências</h1>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>{pendentes} pendentes · {concluidas} concluídas</p>
            </div>
            <button onClick={openNew} style={{padding:'8px 18px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Nova</button>
          </div>

          <div style={{display:'flex',gap:'8px',marginBottom:'20px',flexWrap:'wrap'}}>
            <div style={{display:'flex',gap:'4px',background:'rgba(255,255,255,0.04)',borderRadius:'10px',padding:'4px'}}>
              {['pendentes','concluidas','todas'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{padding:'5px 12px',borderRadius:'7px',border:'none',background:filterStatus===s?'rgba(91,80,214,0.3)':'transparent',color:filterStatus===s?'#a89ff7':'rgba(255,255,255,0.35)',fontSize:'12px',cursor:'pointer',fontWeight:filterStatus===s?500:400}}>
                  {s==='pendentes'?'Pendentes':s==='concluidas'?'Concluídas':'Todas'}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:'4px',background:'rgba(255,255,255,0.04)',borderRadius:'10px',padding:'4px'}}>
              {['Todas','CRITICAL','HIGH','MEDIUM','LOW'].map(p => (
                <button key={p} onClick={() => setFilterPrio(p)} style={{padding:'5px 12px',borderRadius:'7px',border:'none',background:filterPrio===p?`${p==='Todas'?'rgba(91,80,214,0.3)':PRIO_COLOR[p]+'33'}`:'transparent',color:filterPrio===p?(p==='Todas'?'#a89ff7':PRIO_COLOR[p]):'rgba(255,255,255,0.35)',fontSize:'12px',cursor:'pointer',fontWeight:filterPrio===p?500:400}}>
                  {p==='Todas'?'Todas':PRIO_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {loading ? <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {filtered.length===0 && <p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhuma pendência encontrada</p>}
              {filtered.map(p => (
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:`1px solid ${p.status==='DONE'?'rgba(255,255,255,0.05)':PRIO_COLOR[p.priority||'MEDIUM']+'22'}`}}>
                  <div onClick={() => p.status==='DONE' ? reopen(p.id) : complete(p.id)} style={{width:'18px',height:'18px',borderRadius:'5px',border:p.status==='DONE'?'none':'1px solid rgba(255,255,255,0.2)',background:p.status==='DONE'?'#5b50d6':'transparent',flexShrink:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#fff'}}>{p.status==='DONE'?'✓':''}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{color:p.status==='DONE'?'rgba(255,255,255,0.3)':'#fff',fontSize:'13px',fontWeight:500,textDecoration:p.status==='DONE'?'line-through':'none'}}>{p.title}</p>
                    {p.notes && <p style={{color:'rgba(255,255,255,0.25)',fontSize:'11px',marginTop:'2px'}}>{p.notes}</p>}
                  </div>
                  <span style={{fontSize:'11px',padding:'2px 10px',borderRadius:'6px',background:`${PRIO_COLOR[p.priority||'MEDIUM']}22`,color:PRIO_COLOR[p.priority||'MEDIUM'],fontWeight:500}}>{PRIO_LABEL[p.priority||'MEDIUM']}</span>
                  <button onClick={() => openEdit(p)} style={{padding:'5px 8px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'7px',color:'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer'}}>✎</button>
                  <button onClick={() => remove(p.id)} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'12px',cursor:'pointer'}}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div style={{width:'100%',maxWidth:'400px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <h2 style={{color:'#fff',fontSize:'15px',fontWeight:600}}>{editing?'Editar pendência':'Nova pendência'}</h2>
              <button onClick={() => setShowForm(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input autoFocus placeholder="Descrição *" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <textarea placeholder="Observações" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none',resize:'none',height:'80px'}} />
              <div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'6px'}}>Prioridade</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px'}}>
                  {(['CRITICAL','HIGH','MEDIUM','LOW'] as const).map(p => (
                    <button key={p} onClick={() => setForm(f=>({...f,priority:p}))} style={{padding:'8px 4px',borderRadius:'8px',border:`1px solid ${form.priority===p?PRIO_COLOR[p]:'rgba(255,255,255,0.08)'}`,background:form.priority===p?`${PRIO_COLOR[p]}22`:'transparent',color:form.priority===p?PRIO_COLOR[p]:'rgba(255,255,255,0.3)',fontSize:'11px',cursor:'pointer',fontWeight:form.priority===p?600:400}}>
                      {PRIO_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                <button onClick={save} disabled={!form.title.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!form.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
                {editing && <button onClick={() => {remove(editing.id);setShowForm(false)}} style={{padding:'10px 14px',background:'rgba(224,82,82,0.1)',border:'1px solid rgba(224,82,82,0.2)',borderRadius:'10px',color:'#e05252',fontSize:'13px',cursor:'pointer'}}>Apagar</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'
const CATS = ['Negócio','App','Conteúdo','Produto','Marketing','Pessoal','Saúde','Educação','Outro']
const STATUS_LIST = ['💡 Ideia','🔧 Desenvolvendo','⏸ Pausado','✅ Concluído']
const statusColor: any = {'💡 Ideia':'#d4b84a','🔧 Desenvolvendo':'#7c6ff7','⏸ Pausado':'#888','✅ Concluído':'#4caf7d'}



const inp: any = {width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'9px 12px',color:'#fff',fontSize:'13px',outline:'none',boxSizing:'border-box'}
const sel: any = {width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'9px 12px',color:'#fff',fontSize:'13px',outline:'none'}

const EMPTY = {title:'',description:'',inspiration_url:'',category:'Negócio',status:'💡 Ideia',notes:''}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterCat, setFilterCat] = useState('Todas')
  const [expandedId, setExpandedId] = useState<string|null>(null)

  // Captura rápida
  const [quickTitle, setQuickTitle] = useState('')
  const [quickUrl, setQuickUrl] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const {data} = await supabase.from('projetos').select('*').eq('user_id',USER_ID).order('created_at',{ascending:false})
    setProjetos(data||[])
    setLoading(false)
  }

  async function quickCapture() {
    if (!quickTitle.trim()) return
    setQuickSaving(true)
    const now = new Date().toISOString()
    await supabase.from('projetos').insert({
      id:crypto.randomUUID(), title:quickTitle.trim(),
      inspiration_url:quickUrl||null, status:'💡 Ideia',
      category:'Negócio', user_id:USER_ID, created_at:now, updated_at:now
    })
    setQuickTitle(''); setQuickUrl('')
    setQuickSaving(false); load()
  }

  function openNew() {
    setEditing(null); setForm(EMPTY); setShowForm(true)
  }

  function openEdit(item:any) {
    setEditing(item)
    setForm({title:item.title,description:item.description||'',inspiration_url:item.inspiration_url||'',category:item.category||'Negócio',status:item.status||'💡 Ideia',notes:item.notes||''})
    setShowForm(true)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    const data = {title:form.title.trim(),description:form.description||null,inspiration_url:form.inspiration_url||null,category:form.category,status:form.status,notes:form.notes||null,user_id:USER_ID,updated_at:now}
    if (editing) {
      await supabase.from('projetos').update(data).eq('id',editing.id)
    } else {
      await supabase.from('projetos').insert({...data,id:crypto.randomUUID(),created_at:now})
    }
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Apagar este projeto/ideia?')) return
    await supabase.from('projetos').delete().eq('id',id); load()
  }

  async function changeStatus(id:string, newStatus:string) {
    await supabase.from('projetos').update({status:newStatus,updated_at:new Date().toISOString()}).eq('id',id)
    load()
  }

  const filtered = projetos.filter(p => {
    const ms = p.title.toLowerCase().includes(search.toLowerCase()) || (p.description||'').toLowerCase().includes(search.toLowerCase())
    const mf = filterStatus==='Todos' || p.status===filterStatus
    const mc = filterCat==='Todas' || p.category===filterCat
    return ms && mf && mc
  })

  const ideias = projetos.filter(p=>p.status==='💡 Ideia').length
  const desenvolvendo = projetos.filter(p=>p.status==='🔧 Desenvolvendo').length
  const concluidos = projetos.filter(p=>p.status==='✅ Concluído').length

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
        <div style={{maxWidth:'860px',margin:'0 auto'}}>

          {/* Cabeçalho */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
            <div>
              <h1 style={{color:'#fff',fontSize:'22px',fontWeight:700}}>💡 Projetos & Ideias</h1>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>{projetos.length} ideia{projetos.length!==1?'s':''} capturada{projetos.length!==1?'s':''}</p>
            </div>
            <button onClick={openNew} style={{padding:'9px 18px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Novo Projeto</button>
          </div>

          {/* ⚡ Captura rápida — para TDAH */}
          <div style={{background:'rgba(212,184,74,0.06)',border:'1px solid rgba(212,184,74,0.2)',borderRadius:'14px',padding:'18px',marginBottom:'24px'}}>
            <p style={{color:'#d4b84a',fontSize:'12px',fontWeight:600,marginBottom:'12px',textTransform:'uppercase',letterSpacing:'1px'}}>⚡ Captura rápida — anota antes de esquecer!</p>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
              <input
                placeholder="Nome da ideia ou projeto..."
                value={quickTitle}
                onChange={e=>setQuickTitle(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&quickUrl===''&&quickCapture()}
                style={{...inp,flex:1,fontSize:'14px',padding:'11px 14px'}}
              />
              <button onClick={quickCapture} disabled={!quickTitle.trim()||quickSaving} style={{padding:'11px 20px',background:'#d4b84a',border:'none',borderRadius:'10px',color:'#000',fontSize:'13px',fontWeight:700,cursor:'pointer',opacity:!quickTitle.trim()||quickSaving?0.4:1,flexShrink:0}}>
                {quickSaving?'...':'Capturar 💡'}
              </button>
            </div>
            <input
              placeholder="🔗 Link de inspiração (opcional)"
              value={quickUrl}
              onChange={e=>setQuickUrl(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&quickCapture()}
              style={{...inp,fontSize:'12px',padding:'8px 12px'}}
            />
          </div>

          {/* KPIs */}
          {projetos.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'20px'}}>
              <div style={{background:'rgba(212,184,74,0.06)',border:'1px solid rgba(212,184,74,0.12)',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <p style={{color:'#d4b84a',fontSize:'22px',fontWeight:700}}>{ideias}</p>
                <p style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',marginTop:'2px'}}>💡 Ideias</p>
              </div>
              <div style={{background:'rgba(124,111,247,0.06)',border:'1px solid rgba(124,111,247,0.12)',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <p style={{color:'#a89ff7',fontSize:'22px',fontWeight:700}}>{desenvolvendo}</p>
                <p style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',marginTop:'2px'}}>🔧 Desenvolvendo</p>
              </div>
              <div style={{background:'rgba(76,175,125,0.06)',border:'1px solid rgba(76,175,125,0.12)',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <p style={{color:'#4caf7d',fontSize:'22px',fontWeight:700}}>{concluidos}</p>
                <p style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',marginTop:'2px'}}>✅ Concluídos</p>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
            <input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:'160px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none'}}/>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...sel,width:'auto',padding:'8px 12px',fontSize:'12px'}}>
              <option value="Todos">Todos status</option>
              {STATUS_LIST.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...sel,width:'auto',padding:'8px 12px',fontSize:'12px'}}>
              <option value="Todas">Todas categorias</option>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Lista de projetos */}
          {loading ? <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {filtered.length===0 && (
                <div style={{textAlign:'center',padding:'60px 0'}}>
                  <p style={{fontSize:'40px',marginBottom:'12px'}}>💡</p>
                  <p style={{color:'rgba(255,255,255,0.3)',fontSize:'14px'}}>Nenhuma ideia ainda. Use a captura rápida acima!</p>
                </div>
              )}
              {filtered.map(item=>{
                const expanded = expandedId===item.id
                const sc = statusColor[item.status]||'#888'
                return (
                  <div key={item.id} style={{borderRadius:'14px',background:'rgba(255,255,255,0.04)',border:`1px solid ${item.status==='🔧 Desenvolvendo'?'rgba(124,111,247,0.2)':item.status==='💡 Ideia'?'rgba(212,184,74,0.15)':'rgba(255,255,255,0.07)'}`,overflow:'hidden'}}>
                    {/* Cabeçalho do card */}
                    <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'16px',cursor:'pointer'}} onClick={()=>setExpandedId(expanded?null:item.id)}>
                      <div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${sc}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>
                        {item.status==='💡 Ideia'?'💡':item.status==='🔧 Desenvolvendo'?'🔧':item.status==='✅ Concluído'?'✅':'⏸'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginBottom:'4px'}}>
                          <p style={{color:'#fff',fontSize:'14px',fontWeight:600}}>{item.title}</p>
                          <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'5px',background:`${sc}22`,color:sc}}>{item.status}</span>
                          {item.category && <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'5px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.3)'}}>{item.category}</span>}
                        </div>
                        {item.description && <p style={{color:'rgba(255,255,255,0.4)',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.description}</p>}
                        {item.inspiration_url && (
                          <a href={item.inspiration_url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{display:'inline-flex',alignItems:'center',gap:'4px',color:'rgba(124,111,247,0.8)',fontSize:'11px',marginTop:'4px',textDecoration:'none'}}>
                            🔗 Ver inspiração
                          </a>
                        )}
                      </div>
                      <div style={{display:'flex',gap:'6px',alignItems:'center',flexShrink:0}}>
                        <button onClick={e=>{e.stopPropagation();openEdit(item)}} style={{padding:'5px 10px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'7px',color:'rgba(255,255,255,0.4)',fontSize:'11px',cursor:'pointer'}}>✎</button>
                        <button onClick={e=>{e.stopPropagation();remove(item.id)}} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'11px',cursor:'pointer'}}>✕</button>
                        <span style={{color:'rgba(255,255,255,0.2)',fontSize:'12px'}}>{expanded?'▲':'▼'}</span>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {expanded && (
                      <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',padding:'16px',background:'rgba(0,0,0,0.15)'}}>
                        {item.notes && (
                          <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'10px',padding:'12px',marginBottom:'12px'}}>
                            <p style={{color:'rgba(255,255,255,0.2)',fontSize:'10px',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Notas</p>
                            <p style={{color:'rgba(255,255,255,0.6)',fontSize:'13px',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{item.notes}</p>
                          </div>
                        )}
                        {item.inspiration_url && (
                          <div style={{background:'rgba(124,111,247,0.06)',borderRadius:'10px',padding:'12px',marginBottom:'12px'}}>
                            <p style={{color:'rgba(255,255,255,0.2)',fontSize:'10px',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Link de Inspiração</p>
                            <a href={item.inspiration_url} target="_blank" rel="noopener noreferrer" style={{color:'#a89ff7',fontSize:'13px',wordBreak:'break-all'}}>{item.inspiration_url}</a>
                          </div>
                        )}
                        {/* Mudar status direto */}
                        <div>
                          <p style={{color:'rgba(255,255,255,0.2)',fontSize:'10px',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Mudar status</p>
                          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                            {STATUS_LIST.map(s=>(
                              <button key={s} onClick={()=>changeStatus(item.id,s)} style={{padding:'6px 12px',borderRadius:'8px',border:`1px solid ${item.status===s?statusColor[s]:'rgba(255,255,255,0.08)'}`,background:item.status===s?`${statusColor[s]}22`:'transparent',color:item.status===s?statusColor[s]:'rgba(255,255,255,0.35)',fontSize:'12px',cursor:'pointer',fontWeight:item.status===s?600:400}}>{s}</button>
                            ))}
                          </div>
                        </div>
                        <p style={{color:'rgba(255,255,255,0.15)',fontSize:'10px',marginTop:'12px'}}>Criado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de formulário completo */}
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'520px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600}}>{editing?'Editar Projeto':'Novo Projeto'}</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div>
                <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Nome *</label>
                <input autoFocus placeholder="Nome do projeto ou ideia" value={form.title} onChange={e=>setForm((f:any)=>({...f,title:e.target.value}))} style={inp}/>
              </div>
              <div>
                <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>🔗 Link de inspiração</label>
                <input placeholder="https://..." value={form.inspiration_url} onChange={e=>setForm((f:any)=>({...f,inspiration_url:e.target.value}))} style={inp}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div>
                  <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Categoria</label>
                  <select value={form.category} onChange={e=>setForm((f:any)=>({...f,category:e.target.value}))} style={sel}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Status</label>
                  <select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))} style={sel}>{STATUS_LIST.map(s=><option key={s}>{s}</option>)}</select>
                </div>
              </div>
              <div>
                <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Descrição</label>
                <textarea placeholder="O que é essa ideia?" value={form.description} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))} style={{...inp,resize:'none',height:'70px'}}/>
              </div>
              <div>
                <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Notas / Próximos passos</label>
                <textarea placeholder="Anotações, referências, próximos passos..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'90px'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.title.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!form.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

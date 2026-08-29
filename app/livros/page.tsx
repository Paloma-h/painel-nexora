'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'

const inp: any = {width:'100%',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'9px 12px',color:'#111',fontSize:'15px',outline:'none',boxSizing:'border-box'}
const sel: any = {width:'100%',background:'#ffffff',border:'2px solid #bbb',borderRadius:'10px',padding:'9px 12px',color:'#111',fontSize:'15px',outline:'none'}

function Fld({label,children}:{label:string,children:any}) {
  return <div><label style={{fontSize:'15px',color:'#444',display:'block',marginBottom:'4px'}}>{label}</label>{children}</div>
}

const CATEGORIES = ['Desenvolvimento Pessoal','Negócios','Finanças','Marketing','Tecnologia','Saúde','Espiritualidade','Ficção','Biografia','Outro']
const STATUS_LIST = ['Quero ler','Lendo','Pausado','Concluído']
const EMPTY = {name:'',author:'',category:'Desenvolvimento Pessoal',total_pages:'',current_page:'',status:'Quero ler',rating:'',notes:'',started_at:'',finished_at:''}
const statusColor: any = {'Lendo':'#7c6ff7','Pausado':'#d4b84a','Concluído':'#4caf7d','Quero ler':'#888'}

export default function LivrosPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [expandedId, setExpandedId] = useState<string|null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const {data} = await supabase.from('educacao_livros').select('*').eq('user_id',USER_ID).order('updated_at',{ascending:false})
    setItems(data||[])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm({...EMPTY}); setShowForm(true) }

  function openEdit(item:any) {
    setEditing(item)
    setForm({name:item.name,author:item.author||'',category:item.category||'Desenvolvimento Pessoal',total_pages:item.total_pages?.toString()||'',current_page:item.current_page?.toString()||'',status:item.status||'Quero ler',rating:item.rating?.toString()||'',notes:item.notes||'',started_at:item.started_at||'',finished_at:item.finished_at||''})
    setShowForm(true)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    const data: any = {name:form.name.trim(),author:form.author||null,category:form.category,total_pages:form.total_pages?parseInt(form.total_pages):null,current_page:form.current_page?parseInt(form.current_page):null,status:form.status,rating:form.rating?parseInt(form.rating):null,notes:form.notes||null,started_at:form.started_at||null,finished_at:form.finished_at||null,user_id:USER_ID,updated_at:now}
    if (editing) { await supabase.from('educacao_livros').update(data).eq('id',editing.id) }
    else { await supabase.from('educacao_livros').insert({...data,id:crypto.randomUUID(),created_at:now}) }
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir livro?')) return
    await supabase.from('educacao_livros').delete().eq('id',id); load()
  }

  function calcProgress(item:any) {
    if (item.total_pages && item.current_page) return Math.round((item.current_page/item.total_pages)*100)
    return null
  }

  const filtered = items.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || (c.author||'').toLowerCase().includes(search.toLowerCase())
    return (filterStatus==='Todos' || c.status===filterStatus) && ms
  })

  const lendo = items.filter(c=>c.status==='Lendo').length
  const concluidos = items.filter(c=>c.status==='Concluído').length
  const querLer = items.filter(c=>c.status==='Quero ler').length

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />
      <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
        <div style={{maxWidth:'860px',margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <div>
              <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>📚 Livros</h1>
              <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{items.length} livro{items.length!==1?'s':''} cadastrado{items.length!==1?'s':''}</p>
            </div>
            <button onClick={openNew} style={{padding:'8px 18px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo Livro</button>
          </div>
          {items.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'20px'}}>
              <div style={{background:'#fff',border:'1px solid #e0dbff',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <p style={{color:'#5b21b6',fontSize:'22px',fontWeight:700}}>{lendo}</p>
                <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>Lendo</p>
              </div>
              <div style={{background:'#fff',border:'1px solid #ddf5e8',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <p style={{color:'#15803d',fontSize:'22px',fontWeight:700}}>{concluidos}</p>
                <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>Concluídos</p>
              </div>
              <div style={{background:'#fff',border:'1px solid #ebebeb',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <p style={{color:'#444',fontSize:'22px',fontWeight:700}}>{querLer}</p>
                <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>Quero ler</p>
              </div>
            </div>
          )}
          <div style={{display:'flex',gap:'10px',marginBottom:'16px'}}>
            <input placeholder="Buscar livro ou autor..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'8px 12px',color:'#111',fontSize:'15px',outline:'none'}}/>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...sel,width:'auto',padding:'8px 12px',fontSize:'15px'}}>
              <option value="Todos">Todos</option>
              {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          {loading ? <p style={{color:'#444',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {filtered.length===0 && <p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhum livro encontrado</p>}
              {filtered.map(item => {
                const pct = calcProgress(item)
                const expanded = expandedId===item.id
                return (
                  <div key={item.id} style={{borderRadius:'14px',background:'#fff',border:`1px solid ${item.status==='Lendo'?'#d4cdff':'#f0f0f3'}`,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',cursor:'pointer'}} onClick={()=>setExpandedId(expanded?null:item.id)}>
                      <div style={{width:'42px',height:'42px',borderRadius:'10px',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>📖</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                          <p style={{color:'#111',fontSize:'15px',fontWeight:600}}>{item.name}</p>
                          <span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${statusColor[item.status]||'#888'}22`,color:statusColor[item.status]||'#888'}}>{item.status}</span>
                        </div>
                        <div style={{display:'flex',gap:'10px',marginTop:'4px',flexWrap:'wrap',alignItems:'center'}}>
                          {item.author && <span style={{color:'#444',fontSize:'15px'}}>{item.author}</span>}
                          {item.category && <span style={{color:'#444',fontSize:'15px'}}>· {item.category}</span>}
                          {item.rating && <span style={{color:'#854d0e',fontSize:'15px'}}>· {'★'.repeat(item.rating)}</span>}
                        </div>
                        {pct !== null && (
                          <div style={{marginTop:'8px',display:'flex',alignItems:'center',gap:'8px'}}>
                            <div style={{flex:1,height:'4px',background:'#fff',borderRadius:'2px',overflow:'hidden'}}>
                              <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:item.status==='Concluído'?'#4caf7d':'#7c6ff7',borderRadius:'2px'}}/>
                            </div>
                            <span style={{color:'#444',fontSize:'12px',flexShrink:0}}>{pct}%</span>
                          </div>
                        )}
                      </div>
                      <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                        <button onClick={e=>{e.stopPropagation();openEdit(item)}} style={{padding:'5px 9px',background:'#fff',border:'none',borderRadius:'7px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Editar</button>
                        <button onClick={e=>{e.stopPropagation();remove(item.id)}} style={{padding:'5px 8px',background:'#fff',border:'none',borderRadius:'7px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>✕</button>
                        <span style={{color:'#555',fontSize:'15px'}}>{expanded?'▲':'▼'}</span>
                      </div>
                    </div>
                    {expanded && item.notes && (
                      <div style={{borderTop:'2px solid #bbb',padding:'14px 16px',background:'rgba(0,0,0,0.2)'}}>
                        <div style={{background:'#fff',borderRadius:'10px',padding:'12px'}}>
                          <p style={{color:'#555',fontSize:'12px',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Notas</p>
                          <p style={{color:'#444',fontSize:'15px',whiteSpace:'pre-wrap'}}>{item.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'520px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'2px solid #bbb',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>{editing?'Editar Livro':'Novo Livro'}</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Título *"><input placeholder="Ex: Pai Rico Pai Pobre" value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Autor"><input placeholder="Nome do autor" value={form.author} onChange={e=>setForm((f:any)=>({...f,author:e.target.value}))} style={inp}/></Fld>
                <Fld label="Categoria"><select value={form.category} onChange={e=>setForm((f:any)=>({...f,category:e.target.value}))} style={sel}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <Fld label="Status"><select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))} style={sel}>{STATUS_LIST.map(s=><option key={s}>{s}</option>)}</select></Fld>
                <Fld label="Página atual"><input type="number" min="0" placeholder="120" value={form.current_page} onChange={e=>setForm((f:any)=>({...f,current_page:e.target.value}))} style={inp}/></Fld>
                <Fld label="Total páginas"><input type="number" min="0" placeholder="300" value={form.total_pages} onChange={e=>setForm((f:any)=>({...f,total_pages:e.target.value}))} style={inp}/></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <Fld label="Avaliação (1-5)"><input type="number" min="1" max="5" placeholder="5" value={form.rating} onChange={e=>setForm((f:any)=>({...f,rating:e.target.value}))} style={inp}/></Fld>
                <Fld label="Início"><input type="date" value={form.started_at} onChange={e=>setForm((f:any)=>({...f,started_at:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                <Fld label="Conclusão"><input type="date" value={form.finished_at} onChange={e=>setForm((f:any)=>({...f,finished_at:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              </div>
              <Fld label="Notas"><textarea placeholder="Resumo, insights, onde parei..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'80px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #bbb',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
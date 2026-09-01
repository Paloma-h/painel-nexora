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
const GENRES = ['Drama','Comédia','Ação','Terror','Romance','Documentário','Animação','Suspense','Ficção Científica','Outro']
const TYPES = ['Filme','Série','Documentário','Anime','Mini-série']
const PLATFORMS = ['Netflix','Amazon Prime','Disney+','HBO Max','Globoplay','YouTube','Cinema','Outro']
const STATUS_LIST = ['Quero assistir','Assistindo','Pausado','Concluído']
const EMPTY = {name:'',genre:'Drama',type:'Filme',platform:'Netflix',season:'',episode:'',total_seasons:'',total_episodes:'',status:'Quero assistir',rating:'',notes:'',started_date:'',watched_date:'',stopped_at:''}
const statusColor: any = {'Assistindo':'#7c6ff7','Pausado':'#d4b84a','Concluído':'#4caf7d','Quero assistir':'#888'}
const platformColor: any = {'Netflix':'#e05252','Amazon Prime':'#4267B2','Disney+':'#4267B2','HBO Max':'#7c6ff7','Globoplay':'#e08c42','YouTube':'#e05252','Cinema':'#4caf7d','Outro':'#888'}
const typeIcon: any = {'Filme':'🎬','Série':'📺','Documentário':'🎥','Anime':'⛩️','Mini-série':'📽️'}

export default function FilmesPage() {
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
    const {data} = await supabase.from('educacao_filmes').select('*').eq('user_id',USER_ID).order('updated_at',{ascending:false})
    setItems(data||[]); setLoading(false)
  }
  function openNew() { setEditing(null); setForm({...EMPTY}); setShowForm(true) }
  function openEdit(item:any) {
    setEditing(item)
    setForm({name:item.name,genre:item.genre||'Drama',type:item.type||'Filme',platform:item.platform||'Netflix',season:item.season?.toString()||'',episode:item.episode?.toString()||'',total_seasons:item.total_seasons?.toString()||'',total_episodes:item.total_episodes?.toString()||'',status:item.status||'Quero assistir',rating:item.rating?.toString()||'',notes:item.notes||'',started_date:item.started_date||'',watched_date:item.watched_date||'',stopped_at:item.stopped_at||''})
    setShowForm(true)
  }
  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    const data: any = {name:form.name.trim(),genre:form.genre,type:form.type,platform:form.platform,season:form.season?parseInt(form.season):null,episode:form.episode?parseInt(form.episode):null,total_seasons:form.total_seasons?parseInt(form.total_seasons):null,total_episodes:form.total_episodes?parseInt(form.total_episodes):null,status:form.status,rating:form.rating?parseInt(form.rating):null,notes:form.notes||null,started_date:form.started_date||null,watched_date:form.watched_date||null,stopped_at:form.stopped_at||null,user_id:USER_ID,updated_at:now}
    if (editing) { await supabase.from('educacao_filmes').update(data).eq('id',editing.id) }
    else { await supabase.from('educacao_filmes').insert({...data,id:crypto.randomUUID(),created_at:now}) }
    setSaving(false); setShowForm(false); load()
  }
  async function remove(id:string) {
    if (!confirm('Excluir?')) return
    await supabase.from('educacao_filmes').delete().eq('id',id); load()
  }
  function calcProgress(item:any) {
    if (item.type==='Filme') return item.status==='Concluído'?100:null
    if (item.total_episodes && item.episode) return Math.round((item.episode/item.total_episodes)*100)
    if (item.total_seasons && item.season) return Math.round((item.season/item.total_seasons)*100)
    return null
  }
  const filtered = items.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) && (filterStatus==='Todos'||c.status===filterStatus))
  const assistindo = items.filter(c=>c.status==='Assistindo').length
  const concluidos = items.filter(c=>c.status==='Concluído').length
  const querAssistir = items.filter(c=>c.status==='Quero assistir').length
  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />
      <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
        <div style={{maxWidth:'860px',margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <div>
              <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>🎬 Filmes & Séries</h1>
              <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{items.length} título{items.length!==1?'s':''} cadastrado{items.length!==1?'s':''}</p>
            </div>
            <button onClick={openNew} style={{padding:'8px 18px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo Título</button>
          </div>
          {items.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'20px'}}>
              <div style={{background:'#fff',border:'1px solid #e0dbff',borderRadius:'12px',padding:'14px',textAlign:'center'}}><p style={{color:'#5b21b6',fontSize:'22px',fontWeight:700}}>{assistindo}</p><p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>Assistindo</p></div>
              <div style={{background:'#fff',border:'1px solid #ddf5e8',borderRadius:'12px',padding:'14px',textAlign:'center'}}><p style={{color:'#15803d',fontSize:'22px',fontWeight:700}}>{concluidos}</p><p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>Concluídos</p></div>
              <div style={{background:'#fff',border:'1px solid #ebebeb',borderRadius:'12px',padding:'14px',textAlign:'center'}}><p style={{color:'#444',fontSize:'22px',fontWeight:700}}>{querAssistir}</p><p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>Quero assistir</p></div>
            </div>
          )}
          <div style={{display:'flex',gap:'10px',marginBottom:'16px'}}>
            <input placeholder="Buscar título..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'8px 12px',color:'#111',fontSize:'15px',outline:'none'}}/>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...sel,width:'auto',padding:'8px 12px',fontSize:'15px'}}><option value="Todos">Todos</option>{STATUS_LIST.map(s=><option key={s}>{s}</option>)}</select>
          </div>
          {loading ? <p style={{color:'#444',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {filtered.length===0 && <p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhum título encontrado</p>}
              {filtered.map(item => {
                const pct = calcProgress(item)
                const expanded = expandedId===item.id
                return (
                  <div key={item.id} style={{borderRadius:'14px',background:'#fff',border:`1px solid ${item.status==='Assistindo'?'#d4cdff':'#f0f0f3'}`,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',cursor:'pointer'}} onClick={()=>setExpandedId(expanded?null:item.id)}>
                      <div style={{width:'42px',height:'42px',borderRadius:'10px',background:`${platformColor[item.platform]||'#888'}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>{typeIcon[item.type]||'🎬'}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                          <p style={{color:'#111',fontSize:'15px',fontWeight:600}}>{item.name}</p>
                          <span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${statusColor[item.status]||'#888'}22`,color:statusColor[item.status]||'#888'}}>{item.status}</span>
                          <span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${platformColor[item.platform]||'#888'}18`,color:platformColor[item.platform]||'#888'}}>{item.platform}</span>
                        </div>
                        <div style={{display:'flex',gap:'10px',marginTop:'4px',flexWrap:'wrap',alignItems:'center'}}>
                          <span style={{color:'#444',fontSize:'15px'}}>{item.type}</span>
                          {item.genre && <span style={{color:'#444',fontSize:'15px'}}>· {item.genre}</span>}
                          {item.rating && <span style={{color:'#854d0e',fontSize:'15px'}}>· {'★'.repeat(item.rating)}</span>}
                          {item.stopped_at && <span style={{color:'#7c3aed',fontSize:'13px',fontWeight:600}}>⏱️ Parei: {item.stopped_at}</span>}
                          {item.watched_date && <span style={{color:'#16a34a',fontSize:'13px'}}>📅 {new Date(item.watched_date+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                        </div>
                        {pct !== null && <div style={{marginTop:'8px',display:'flex',alignItems:'center',gap:'8px'}}><div style={{flex:1,height:'4px',background:'#fff',borderRadius:'2px',overflow:'hidden'}}><div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:item.status==='Concluído'?'#4caf7d':'#7c6ff7',borderRadius:'2px'}}/></div><span style={{color:'#444',fontSize:'12px'}}>{pct}%</span></div>}
                      </div>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button onClick={e=>{e.stopPropagation();openEdit(item)}} style={{padding:'5px 9px',background:'#fff',border:'none',borderRadius:'7px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Editar</button>
                        <button onClick={e=>{e.stopPropagation();remove(item.id)}} style={{padding:'5px 8px',background:'#fff',border:'none',borderRadius:'7px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>✕</button>
                        <span style={{color:'#555',fontSize:'15px'}}>{expanded?'▲':'▼'}</span>
                      </div>
                    </div>
                    {expanded && item.notes && <div style={{borderTop:'2px solid #bbb',padding:'14px 16px',background:'rgba(0,0,0,0.2)'}}><div style={{background:'#fff',borderRadius:'10px',padding:'12px'}}><p style={{color:'#555',fontSize:'12px',marginBottom:'4px',textTransform:'uppercase'}}>Notas</p><p style={{color:'#444',fontSize:'15px',whiteSpace:'pre-wrap'}}>{item.notes}</p></div></div>}
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
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>{editing?'Editar Título':'Novo Título'}</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Título *"><input placeholder="Ex: Breaking Bad" value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <Fld label="Tipo"><select value={form.type} onChange={e=>setForm((f:any)=>({...f,type:e.target.value}))} style={sel}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></Fld>
                <Fld label="Gênero"><select value={form.genre} onChange={e=>setForm((f:any)=>({...f,genre:e.target.value}))} style={sel}>{GENRES.map(g=><option key={g}>{g}</option>)}</select></Fld>
                <Fld label="Plataforma"><select value={form.platform} onChange={e=>setForm((f:any)=>({...f,platform:e.target.value}))} style={sel}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <Fld label="Status"><select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))} style={sel}>{STATUS_LIST.map(s=><option key={s}>{s}</option>)}</select></Fld>
                <Fld label="Temporada atual"><input type="number" min="0" placeholder="2" value={form.season} onChange={e=>setForm((f:any)=>({...f,season:e.target.value}))} style={inp}/></Fld>
                <Fld label="Episódio atual"><input type="number" min="0" placeholder="5" value={form.episode} onChange={e=>setForm((f:any)=>({...f,episode:e.target.value}))} style={inp}/></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <Fld label="Avaliação (1-5)"><input type="number" min="1" max="5" placeholder="5" value={form.rating} onChange={e=>setForm((f:any)=>({...f,rating:e.target.value}))} style={inp}/></Fld>
                <Fld label="Total temporadas"><input type="number" min="0" placeholder="5" value={form.total_seasons} onChange={e=>setForm((f:any)=>({...f,total_seasons:e.target.value}))} style={inp}/></Fld>
                <Fld label="Total episódios"><input type="number" min="0" placeholder="62" value={form.total_episodes} onChange={e=>setForm((f:any)=>({...f,total_episodes:e.target.value}))} style={inp}/></Fld>
              </div>
              <div style={{background:'#faf5ff',border:'2px solid #e9d5ff',borderRadius:'10px',padding:'12px'}}>
                <p style={{color:'#7c3aed',fontSize:'13px',fontWeight:700,marginBottom:'8px'}}>📅 Controle de progresso</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                  <Fld label="Comecei em"><input type="date" value={form.started_date} onChange={e=>setForm((f:any)=>({...f,started_date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                  <Fld label="Assistido em"><input type="date" value={form.watched_date} onChange={e=>setForm((f:any)=>({...f,watched_date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                  <Fld label="Parei em (min/ep)"><input placeholder="1:23:00 ou Ep 5" value={form.stopped_at} onChange={e=>setForm((f:any)=>({...f,stopped_at:e.target.value}))} style={inp}/></Fld>
                </div>
              </div>
              <Fld label="Notas"><textarea placeholder="O que achei, recomendações..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'80px'}}/></Fld>
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
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'



const inp: any = {width:'100%',background:'#fff',border:'1px solid #e5e5ea',borderRadius:'10px',padding:'9px 12px',color:'#1a1a2e',fontSize:'15px',outline:'none',boxSizing:'border-box'}
const sel: any = {width:'100%',background:'#ffffff',border:'1px solid #e5e5ea',borderRadius:'10px',padding:'9px 12px',color:'#1a1a2e',fontSize:'15px',outline:'none'}

function Fld({label,children}:{label:string,children:any}) {
  return <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>{label}</label>{children}</div>
}

const PLATFORMS = ['Udemy','YouTube','Hotmart','Coursera','Alura','Kiwify','Instagram','Particular','Outro']
const CATEGORIES = ['Marketing','Vendas','Saúde','Tecnologia','Negócios','Finanças','Desenvolvimento Pessoal','Design','Idiomas','Outro']
const STATUS_LIST = ['Em andamento','Pausado','Concluído','Não iniciado']

const EMPTY = {
  name:'', platform:'Udemy', category:'Marketing', url:'',
  instructor:'', total_modules:'', total_lessons:'',
  current_module:'', current_lesson:'', current_module_name:'',
  last_watched:'', progress_pct:'', status:'Em andamento', notes:''
}

const statusColor: any = {'Em andamento':'#7c6ff7','Pausado':'#d4b84a','Concluído':'#4caf7d','Não iniciado':'#888'}
const platformColor: any = {'Udemy':'#a435f0','YouTube':'#e05252','Hotmart':'#e08c42','Coursera':'#4267B2','Alura':'#4caf7d','Kiwify':'#7c6ff7','Instagram':'#e08c42','Particular':'#4caf7d','Outro':'#888'}

export default function EducacaoPage() {
  const [cursos, setCursos] = useState<any[]>([])
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
    const {data} = await supabase.from('educacao_cursos').select('*').eq('user_id',USER_ID).order('updated_at',{ascending:false})
    setCursos(data||[])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm({...EMPTY, last_watched: new Date().toISOString().split('T')[0]})
    setShowForm(true)
  }

  function openEdit(item:any) {
    setEditing(item)
    setForm({
      name:item.name, platform:item.platform||'Udemy', category:item.category||'Marketing',
      url:item.url||'', instructor:item.instructor||'',
      total_modules:item.total_modules?.toString()||'',
      total_lessons:item.total_lessons?.toString()||'',
      current_module:item.current_module?.toString()||'',
      current_lesson:item.current_lesson?.toString()||'',
      current_module_name:item.current_module_name||'',
      last_watched:item.last_watched||'',
      progress_pct:item.progress_pct?.toString()||'',
      status:item.status||'Em andamento', notes:item.notes||''
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    const data: any = {
      name:form.name.trim(), platform:form.platform, category:form.category,
      url:form.url||null, instructor:form.instructor||null,
      total_modules:form.total_modules?parseInt(form.total_modules):null,
      total_lessons:form.total_lessons?parseInt(form.total_lessons):null,
      current_module:form.current_module?parseInt(form.current_module):null,
      current_lesson:form.current_lesson?parseInt(form.current_lesson):null,
      current_module_name:form.current_module_name||null,
      last_watched:form.last_watched||null,
      progress_pct:form.progress_pct?parseFloat(form.progress_pct):null,
      status:form.status, notes:form.notes||null,
      user_id:USER_ID, updated_at:now
    }
    if (editing) {
      await supabase.from('educacao_cursos').update(data).eq('id',editing.id)
    } else {
      await supabase.from('educacao_cursos').insert({...data,id:crypto.randomUUID(),created_at:now})
    }
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir curso?')) return
    await supabase.from('educacao_cursos').delete().eq('id',id); load()
  }

  // Progresso automático
  function calcProgress(item:any) {
    if (item.progress_pct) return item.progress_pct
    if (item.total_lessons && item.current_lesson) return Math.round((item.current_lesson/item.total_lessons)*100)
    if (item.total_modules && item.current_module) return Math.round((item.current_module/item.total_modules)*100)
    return null
  }

  const formProgress = () => {
    if (form.progress_pct) return parseFloat(form.progress_pct)
    if (form.total_lessons && form.current_lesson) return Math.round((parseInt(form.current_lesson)/parseInt(form.total_lessons))*100)
    if (form.total_modules && form.current_module) return Math.round((parseInt(form.current_module)/parseInt(form.total_modules))*100)
    return null
  }

  const filtered = cursos.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || (c.instructor||'').toLowerCase().includes(search.toLowerCase())
    const mf = filterStatus==='Todos' || c.status===filterStatus
    return ms && mf
  })

  const emAndamento = cursos.filter(c=>c.status==='Em andamento').length
  const pausados = cursos.filter(c=>c.status==='Pausado').length
  const concluidos = cursos.filter(c=>c.status==='Concluído').length

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#f5f5f7',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
        <div style={{maxWidth:'860px',margin:'0 auto'}}>

          {/* Cabeçalho */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <div>
              <h1 style={{color:'#1a1a2e',fontSize:'22px',fontWeight:700}}>📚 Educação</h1>
              <p style={{color:'#999',fontSize:'15px',marginTop:'2px'}}>{cursos.length} curso{cursos.length!==1?'s':''} cadastrado{cursos.length!==1?'s':''}</p>
            </div>
            <button onClick={openNew} style={{padding:'8px 18px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo Curso</button>
          </div>

          {/* KPIs */}
          {cursos.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'20px'}}>
              <div style={{background:'rgba(124,111,247,0.08)',border:'1px solid rgba(124,111,247,0.15)',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <p style={{color:'#a89ff7',fontSize:'22px',fontWeight:700}}>{emAndamento}</p>
                <p style={{color:'#999',fontSize:'15px',marginTop:'2px'}}>Em andamento</p>
              </div>
              <div style={{background:'rgba(212,184,74,0.06)',border:'1px solid rgba(212,184,74,0.12)',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <p style={{color:'#d4b84a',fontSize:'22px',fontWeight:700}}>{pausados}</p>
                <p style={{color:'#999',fontSize:'15px',marginTop:'2px'}}>Pausados</p>
              </div>
              <div style={{background:'rgba(76,175,125,0.06)',border:'1px solid rgba(76,175,125,0.12)',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <p style={{color:'#4caf7d',fontSize:'22px',fontWeight:700}}>{concluidos}</p>
                <p style={{color:'#999',fontSize:'15px',marginTop:'2px'}}>Concluídos</p>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={{display:'flex',gap:'10px',marginBottom:'16px'}}>
            <input placeholder="Buscar curso ou instrutor..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,background:'#fff',border:'1px solid #e5e5ea',borderRadius:'10px',padding:'8px 12px',color:'#1a1a2e',fontSize:'15px',outline:'none'}}/>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...sel,width:'auto',padding:'8px 12px',fontSize:'15px'}}>
              <option value="Todos">Todos</option>
              {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Lista de cursos */}
          {loading ? <p style={{color:'#999',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {filtered.length===0 && <p style={{color:'#bbb',textAlign:'center',padding:'40px'}}>Nenhum curso encontrado</p>}
              {filtered.map(item => {
                const pct = calcProgress(item)
                const expanded = expandedId===item.id
                return (
                  <div key={item.id} style={{borderRadius:'14px',background:'#fff',border:`1px solid ${item.status==='Em andamento'?'rgba(124,111,247,0.2)':'rgba(255,255,255,0.07)'}`,overflow:'hidden'}}>
                    {/* Cabeçalho do card */}
                    <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',cursor:'pointer'}} onClick={()=>setExpandedId(expanded?null:item.id)}>
                      <div style={{width:'42px',height:'42px',borderRadius:'10px',background:`${platformColor[item.platform]||'#888'}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>
                        {item.platform==='YouTube'?'▶️':item.platform==='Udemy'?'🎓':item.platform==='Hotmart'?'🔥':'📖'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                          <p style={{color:'#1a1a2e',fontSize:'15px',fontWeight:600}}>{item.name}</p>
                          <span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${statusColor[item.status]||'#888'}22`,color:statusColor[item.status]||'#888'}}>{item.status}</span>
                          <span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${platformColor[item.platform]||'#888'}18`,color:platformColor[item.platform]||'#888'}}>{item.platform}</span>
                        </div>
                        <div style={{display:'flex',gap:'10px',marginTop:'4px',flexWrap:'wrap',alignItems:'center'}}>
                          {item.instructor && <span style={{color:'#999',fontSize:'15px'}}>{item.instructor}</span>}
                          {item.category && <span style={{color:'#aaa',fontSize:'15px'}}>· {item.category}</span>}
                          {item.last_watched && <span style={{color:'#bbb',fontSize:'15px'}}>· Visto: {new Date(item.last_watched+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                        </div>
                        {/* Barra de progresso */}
                        {pct !== null && (
                          <div style={{marginTop:'8px',display:'flex',alignItems:'center',gap:'8px'}}>
                            <div style={{flex:1,height:'4px',background:'#fff',borderRadius:'2px',overflow:'hidden'}}>
                              <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:item.status==='Concluído'?'#4caf7d':'#7c6ff7',borderRadius:'2px',transition:'width 0.3s'}}/>
                            </div>
                            <span style={{color:'#999',fontSize:'12px',flexShrink:0}}>{pct}%</span>
                          </div>
                        )}
                      </div>
                      <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{padding:'5px 9px',background:'rgba(124,111,247,0.12)',border:'1px solid rgba(124,111,247,0.2)',borderRadius:'7px',color:'#a89ff7',fontSize:'15px',textDecoration:'none'}}>Abrir</a>}
                        <button onClick={e=>{e.stopPropagation();openEdit(item)}} style={{padding:'5px 9px',background:'#fff',border:'none',borderRadius:'7px',color:'#888',fontSize:'15px',cursor:'pointer'}}>Editar</button>
                        <button onClick={e=>{e.stopPropagation();remove(item.id)}} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>✕</button>
                        <span style={{color:'#bbb',fontSize:'15px'}}>{expanded?'▲':'▼'}</span>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {expanded && (
                      <div style={{borderTop:'1px solid #e5e5ea',padding:'14px 16px',background:'rgba(0,0,0,0.2)'}}>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'12px'}}>
                          <div style={{background:'#fff',borderRadius:'10px',padding:'12px',textAlign:'center'}}>
                            <p style={{color:'#999',fontSize:'12px',marginBottom:'4px'}}>Módulo atual</p>
                            <p style={{color:'#a89ff7',fontSize:'18px',fontWeight:700}}>{item.current_module||'—'}{item.total_modules?` / ${item.total_modules}`:''}</p>
                            {item.current_module_name && <p style={{color:'#999',fontSize:'12px',marginTop:'2px'}}>{item.current_module_name}</p>}
                          </div>
                          <div style={{background:'#fff',borderRadius:'10px',padding:'12px',textAlign:'center'}}>
                            <p style={{color:'#999',fontSize:'12px',marginBottom:'4px'}}>Aula atual</p>
                            <p style={{color:'#4caf7d',fontSize:'18px',fontWeight:700}}>{item.current_lesson||'—'}{item.total_lessons?` / ${item.total_lessons}`:''}</p>
                          </div>
                          <div style={{background:'#fff',borderRadius:'10px',padding:'12px',textAlign:'center'}}>
                            <p style={{color:'#999',fontSize:'12px',marginBottom:'4px'}}>Progresso</p>
                            <p style={{color:pct!==null?(pct>=100?'#4caf7d':'#d4b84a'):'#999',fontSize:'18px',fontWeight:700}}>{pct!==null?`${pct}%`:'—'}</p>
                          </div>
                        </div>
                        {item.notes && (
                          <div style={{background:'#fff',borderRadius:'10px',padding:'12px'}}>
                            <p style={{color:'#bbb',fontSize:'12px',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Onde parei / Notas</p>
                            <p style={{color:'#666',fontSize:'15px',whiteSpace:'pre-wrap'}}>{item.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de formulário */}
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'560px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'1px solid #e5e5ea',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#1a1a2e',fontSize:'18px',fontWeight:600}}>{editing?'Editar Curso':'Novo Curso'}</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#999',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome do curso *"><input placeholder="Ex: Tráfego Pago do Zero ao Avançado" value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Plataforma"><select value={form.platform} onChange={e=>setForm((f:any)=>({...f,platform:e.target.value}))} style={sel}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select></Fld>
                <Fld label="Categoria"><select value={form.category} onChange={e=>setForm((f:any)=>({...f,category:e.target.value}))} style={sel}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Fld>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Instrutor"><input placeholder="Nome do instrutor" value={form.instructor} onChange={e=>setForm((f:any)=>({...f,instructor:e.target.value}))} style={inp}/></Fld>
                <Fld label="Status"><select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))} style={sel}>{STATUS_LIST.map(s=><option key={s}>{s}</option>)}</select></Fld>
              </div>

              <Fld label="Link do curso"><input placeholder="https://..." value={form.url} onChange={e=>setForm((f:any)=>({...f,url:e.target.value}))} style={inp}/></Fld>

              <div style={{borderTop:'1px solid #e5e5ea',paddingTop:'12px'}}>
                <p style={{color:'#aaa',fontSize:'12px',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>Onde parei</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'8px'}}>
                  <Fld label="Módulo atual"><input type="number" min="0" placeholder="3" value={form.current_module} onChange={e=>setForm((f:any)=>({...f,current_module:e.target.value}))} style={inp}/></Fld>
                  <Fld label="Total módulos"><input type="number" min="0" placeholder="10" value={form.total_modules} onChange={e=>setForm((f:any)=>({...f,total_modules:e.target.value}))} style={inp}/></Fld>
                  <Fld label="Aula atual"><input type="number" min="0" placeholder="15" value={form.current_lesson} onChange={e=>setForm((f:any)=>({...f,current_lesson:e.target.value}))} style={inp}/></Fld>
                  <Fld label="Total aulas"><input type="number" min="0" placeholder="80" value={form.total_lessons} onChange={e=>setForm((f:any)=>({...f,total_lessons:e.target.value}))} style={inp}/></Fld>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginTop:'8px'}}>
                  <Fld label="Nome do módulo / seção"><input placeholder="Ex: Módulo 3 — Campanhas" value={form.current_module_name} onChange={e=>setForm((f:any)=>({...f,current_module_name:e.target.value}))} style={inp}/></Fld>
                  <Fld label="Último acesso"><input type="date" value={form.last_watched} onChange={e=>setForm((f:any)=>({...f,last_watched:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                </div>
                {formProgress()!==null && (
                  <div style={{marginTop:'8px',display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{flex:1,height:'6px',background:'#fff',borderRadius:'3px',overflow:'hidden'}}>
                      <div style={{width:`${Math.min(formProgress()!,100)}%`,height:'100%',background:'#7c6ff7',borderRadius:'3px'}}/>
                    </div>
                    <span style={{color:'#888',fontSize:'15px'}}>{formProgress()}%</span>
                  </div>
                )}
              </div>

              <Fld label="Notas / Onde parei exatamente">
                <textarea placeholder="Ex: Parei na aula 15 do módulo 3, faltou entender a parte de remarketing..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'80px'}}/>
              </Fld>
            </div>

            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'1px solid #e5e5ea',borderRadius:'10px',color:'#888',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

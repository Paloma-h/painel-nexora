'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

const USER_ID = 'paloma'
const PRIO_COLOR: any = { CRITICAL:'#e05252', HIGH:'#e08c42', MEDIUM:'#d4b84a', LOW:'#4caf7d' }
const PRIO_LABEL: any = { CRITICAL:'🔴 Urgente', HIGH:'🟠 Alta', MEDIUM:'🟡 Média', LOW:'🟢 Depois' }
const PRIO_KEYS = ['CRITICAL','HIGH','MEDIUM','LOW']
const CATS = ['Empresa','Casa','Faculdade','Documentos','Campanhas','Financeiro','Pessoal','Geral']
const MISSION_CATS = ['trabalho','marketing','vendas','pessoal','saúde','financeiro','educação','geral']

function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  async function logout() { await supabase.auth.signOut(); router.push('/login') }
  const link = (href: string, label: string) => (
    <Link href={href} style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path===href?'#a89ff7':'rgba(255,255,255,0.35)',background:path===href?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path===href?500:400}}>{label}</Link>
  )
  return (
    <div style={{width:'160px',background:'#0d0d1a',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',padding:'20px 12px',flexShrink:0,minHeight:'100vh'}}>
      <div style={{color:'#7c6ff7',fontWeight:700,fontSize:'16px',marginBottom:'28px',padding:'0 4px'}}>NEXORA</div>
      {link('/dashboard','Dashboard')}
      {link('/agenda','Agenda')}
      {link('/pendencias','Pendências')}
      {link('/crm','CRM')}
      {link('/financeiro','Financeiro')}
      <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',margin:'10px 0'}}/>
      {link('/projetos','Projetos')}
      {link('/saude','Saúde')}
      {link('/educacao','Educação')}
      <div style={{marginTop:'auto'}}>
        <button onClick={logout} style={{display:'block',width:'100%',padding:'9px 12px',borderRadius:'10px',fontSize:'12px',color:'rgba(255,255,255,0.2)',background:'transparent',border:'none',textAlign:'left',cursor:'pointer'}}>Sair</button>
      </div>
    </div>
  )
}

const inp: any = {width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'9px 12px',color:'#fff',fontSize:'13px',outline:'none',boxSizing:'border-box'}
const sel: any = {width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'9px 12px',color:'#fff',fontSize:'13px',outline:'none'}

function Modal({title,onClose,children}:{title:string,onClose:()=>void,children:any}){
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'480px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)',height:'fit-content'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h2 style={{color:'#fff',fontSize:'15px',fontWeight:600}}>{title}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function PendenciasPage() {
  const [tab, setTab] = useState('foco')
  const [missions, setMissions] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMissionForm, setShowMissionForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingMission, setEditingMission] = useState<any>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickPrio, setQuickPrio] = useState('MEDIUM')
  const [quickSaving, setQuickSaving] = useState(false)
  const [selectedMission, setSelectedMission] = useState<string|null>(null)
  const [mForm, setMForm] = useState({title:'',description:'',category:'geral'})
  const [tForm, setTForm] = useState({title:'',notes:'',priority:'MEDIUM',category:'Pessoal',mission_id:'',step_order:'0',depends_on:'',estimated_time:'',scheduled_date:''})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [m,t] = await Promise.all([
      supabase.from('missions').select('*').eq('user_id',USER_ID).order('created_at',{ascending:true}),
      supabase.from('tasks').select('*').eq('user_id',USER_ID).eq('type','pendencia').order('step_order',{ascending:true})
    ])
    setMissions(m.data||[])
    setTasks(t.data||[])
    setLoading(false)
  }

  // Quick add
  async function quickAdd() {
    if (!quickTitle.trim()) return
    setQuickSaving(true)
    await supabase.from('tasks').insert({id:crypto.randomUUID(),title:quickTitle.trim(),priority:quickPrio,type:'pendencia',status:'PENDING',category:'Pessoal',user_id:USER_ID})
    setQuickTitle('')
    setQuickSaving(false)
    load()
  }

  async function saveMission() {
    if (!mForm.title.trim()) return
    setSaving(true)
    editingMission
      ? await supabase.from('missions').update({title:mForm.title.trim(),description:mForm.description||null,category:mForm.category}).eq('id',editingMission.id)
      : await supabase.from('missions').insert({id:crypto.randomUUID(),title:mForm.title.trim(),description:mForm.description||null,category:mForm.category,status:'ativa',user_id:USER_ID})
    setShowMissionForm(false); setSaving(false); load()
  }

  async function saveTask() {
    if (!tForm.title.trim()) return
    setSaving(true)
    const data:any = {title:tForm.title.trim(),notes:tForm.notes||null,priority:tForm.priority,category:tForm.category,type:'pendencia',status:'PENDING',mission_id:tForm.mission_id||null,step_order:parseInt(tForm.step_order)||0,depends_on:tForm.depends_on||null,estimated_time:tForm.estimated_time||null,scheduled_date:tForm.scheduled_date||null,user_id:USER_ID}
    editingTask
      ? await supabase.from('tasks').update(data).eq('id',editingTask.id)
      : await supabase.from('tasks').insert({...data,id:crypto.randomUUID()})
    setShowTaskForm(false); setSaving(false); load()
  }

  async function completeTask(id:string) { await supabase.from('tasks').update({status:'DONE'}).eq('id',id); load() }
  async function reopenTask(id:string) { await supabase.from('tasks').update({status:'PENDING'}).eq('id',id); load() }
  async function deleteTask(id:string) { if(!confirm('Apagar?')) return; await supabase.from('tasks').delete().eq('id',id); load() }
  async function deleteMission(id:string) {
    if (!confirm('Apagar missão e todas as etapas?')) return
    await supabase.from('tasks').delete().eq('mission_id',id)
    await supabase.from('missions').delete().eq('id',id); load()
  }

  function getMissionTasks(mid:string) { return tasks.filter(t=>t.mission_id===mid).sort((a,b)=>(a.step_order||0)-(b.step_order||0)) }
  function getFreeTasks() { return tasks.filter(t=>!t.mission_id) }
  function getMissionProgress(mid:string) { const mt=getMissionTasks(mid); if(!mt.length) return 0; return Math.round((mt.filter(t=>t.status==='DONE').length/mt.length)*100) }
  function getNextAction(mid:string) { return getMissionTasks(mid).find(t=>t.status!=='DONE') }
  function isUnlocked(task:any) { if(!task.depends_on) return true; const dep=tasks.find(t=>t.id===task.depends_on); return dep?dep.status==='DONE':true }

  const pendentes = getFreeTasks().filter(t=>t.status!=='DONE')
  const concluidas = getFreeTasks().filter(t=>t.status==='DONE')

  // Ordenar por prioridade
  const prioOrder:any = {CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3}
  const sortedPendentes = [...pendentes].sort((a,b)=>(prioOrder[a.priority]||2)-(prioOrder[b.priority]||2))

  // Tarefa principal para o foco
  const mainTask = sortedPendentes[0] || null
  const missionNext = (() => {
    for (const m of missions) { const n=getNextAction(m.id); if(n&&isUnlocked(n)) return {task:n,mission:m} }
    return null
  })()
  const focusItem = mainTask
    ? (missionNext && prioOrder[missionNext.task.priority||'MEDIUM'] < prioOrder[mainTask.priority||'MEDIUM'] ? missionNext : {task:mainTask,mission:null})
    : missionNext

  const tabs = [
    {id:'foco', label:'🎯 Foco'},
    {id:'lista', label:'📋 Lista'},
    {id:'missoes', label:'🚀 Missões'},
  ]

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <div style={{background:'#0d0d1a',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 28px',display:'flex',gap:'4px',flexShrink:0}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'14px 18px',background:'transparent',border:'none',borderBottom:`2px solid ${tab===t.id?'#7c6ff7':'transparent'}`,color:tab===t.id?'#a89ff7':'rgba(255,255,255,0.35)',fontSize:'13px',cursor:'pointer',fontWeight:tab===t.id?600:400}}>{t.label}</button>
          ))}
        </div>

        <div style={{flex:1,padding:'32px',overflowY:'auto'}}>
          <div style={{maxWidth:'700px',margin:'0 auto'}}>

            {/* ── ABA FOCO ────────────────────────────── */}
            {tab==='foco' && (
              <div>
                {!focusItem ? (
                  <div style={{textAlign:'center',padding:'100px 0'}}>
                    <div style={{fontSize:'56px',marginBottom:'16px'}}>🎉</div>
                    <p style={{color:'#fff',fontSize:'22px',fontWeight:700,marginBottom:'8px'}}>Tudo em dia!</p>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'14px'}}>Nenhuma pendência ativa.</p>
                  </div>
                ) : (
                  <div>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'20px'}}>Foque nisso agora 👇</p>

                    {focusItem.mission && (
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                        <span style={{color:'rgba(255,255,255,0.3)',fontSize:'12px'}}>Missão:</span>
                        <span style={{color:'#a89ff7',fontSize:'13px',fontWeight:500}}>{focusItem.mission.title}</span>
                        <div style={{flex:1,height:'4px',background:'rgba(255,255,255,0.06)',borderRadius:'2px',overflow:'hidden',maxWidth:'100px'}}>
                          <div style={{height:'100%',width:`${getMissionProgress(focusItem.mission.id)}%`,background:'#7c6ff7',borderRadius:'2px'}}/>
                        </div>
                        <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>{getMissionProgress(focusItem.mission.id)}%</span>
                      </div>
                    )}

                    {/* Card principal — grande e limpo */}
                    <div style={{background:'rgba(255,255,255,0.04)',border:`2px solid ${PRIO_COLOR[focusItem.task.priority||'MEDIUM']}55`,borderRadius:'20px',padding:'36px',marginBottom:'20px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
                        <span style={{fontSize:'14px',padding:'5px 14px',borderRadius:'20px',background:`${PRIO_COLOR[focusItem.task.priority||'MEDIUM']}22`,color:PRIO_COLOR[focusItem.task.priority||'MEDIUM'],fontWeight:700}}>{PRIO_LABEL[focusItem.task.priority||'MEDIUM']}</span>
                        {focusItem.task.category && <span style={{fontSize:'12px',padding:'4px 10px',borderRadius:'20px',background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.4)'}}>{focusItem.task.category}</span>}
                        {focusItem.task.estimated_time && <span style={{color:'rgba(255,255,255,0.3)',fontSize:'12px'}}>⏱ {focusItem.task.estimated_time}</span>}
                      </div>
                      <h1 style={{color:'#fff',fontSize:'26px',fontWeight:800,lineHeight:1.3,marginBottom:'12px'}}>{focusItem.task.title}</h1>
                      {focusItem.task.notes && <p style={{color:'rgba(255,255,255,0.4)',fontSize:'14px',lineHeight:1.6,marginBottom:'16px'}}>{focusItem.task.notes}</p>}
                      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'20px'}}>
                        <button onClick={()=>completeTask(focusItem.task.id)} style={{padding:'13px 32px',background:'#5b50d6',border:'none',borderRadius:'12px',color:'#fff',fontSize:'15px',fontWeight:700,cursor:'pointer'}}>✓ Concluir</button>
                        <button onClick={()=>{setEditingTask(focusItem.task);setTForm({title:focusItem.task.title,notes:focusItem.task.notes||'',priority:focusItem.task.priority||'MEDIUM',category:focusItem.task.category||'Pessoal',mission_id:focusItem.task.mission_id||'',step_order:String(focusItem.task.step_order||0),depends_on:focusItem.task.depends_on||'',estimated_time:focusItem.task.estimated_time||'',scheduled_date:focusItem.task.scheduled_date||''});setShowTaskForm(true)}} style={{padding:'13px 22px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'12px',color:'rgba(255,255,255,0.6)',fontSize:'14px',cursor:'pointer'}}>✎ Editar</button>
                      </div>
                    </div>

                    {/* Próximas (só 3) */}
                    {sortedPendentes.filter(t=>t.id!==focusItem.task.id).slice(0,4).length > 0 && (
                      <div>
                        <p style={{color:'rgba(255,255,255,0.2)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>A seguir</p>
                        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                          {sortedPendentes.filter(t=>t.id!==focusItem.task.id).slice(0,4).map(t=>(
                            <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderRadius:'12px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                              <div style={{width:'10px',height:'10px',borderRadius:'50%',background:PRIO_COLOR[t.priority||'MEDIUM'],flexShrink:0}}/>
                              <p style={{flex:1,color:'rgba(255,255,255,0.6)',fontSize:'13px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                              <span style={{color:'rgba(255,255,255,0.2)',fontSize:'11px',flexShrink:0}}>{PRIO_LABEL[t.priority||'MEDIUM'].split(' ')[1]}</span>
                              <button onClick={()=>completeTask(t.id)} style={{padding:'4px 10px',background:'rgba(76,175,125,0.1)',border:'none',borderRadius:'6px',color:'#4caf7d',fontSize:'11px',cursor:'pointer'}}>✓</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── ABA LISTA ────────────────────────────── */}
            {tab==='lista' && (
              <div>
                {/* Quick add */}
                <div style={{background:'rgba(91,80,214,0.08)',border:'1px solid rgba(91,80,214,0.2)',borderRadius:'14px',padding:'16px',marginBottom:'28px'}}>
                  <p style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'1px'}}>⚡ Captura rápida</p>
                  <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
                    <input
                      autoFocus
                      placeholder="O que precisa ser feito?"
                      value={quickTitle}
                      onChange={e=>setQuickTitle(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&quickAdd()}
                      style={{...inp,flex:1,fontSize:'14px',padding:'10px 14px'}}
                    />
                    <button onClick={quickAdd} disabled={!quickTitle.trim()||quickSaving} style={{padding:'10px 18px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!quickTitle.trim()||quickSaving?0.4:1,flexShrink:0}}>Adicionar</button>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    {PRIO_KEYS.map(p=>(
                      <button key={p} onClick={()=>setQuickPrio(p)} style={{flex:1,padding:'7px 4px',borderRadius:'8px',border:`1px solid ${quickPrio===p?PRIO_COLOR[p]:'rgba(255,255,255,0.08)'}`,background:quickPrio===p?`${PRIO_COLOR[p]}22`:'transparent',color:quickPrio===p?PRIO_COLOR[p]:'rgba(255,255,255,0.3)',fontSize:'12px',cursor:'pointer',fontWeight:quickPrio===p?700:400}}>{PRIO_LABEL[p]}</button>
                    ))}
                  </div>
                </div>

                {/* Agrupadas por prioridade */}
                {loading ? <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
                  <div>
                    {PRIO_KEYS.map(prio=>{
                      const items = sortedPendentes.filter(t=>t.priority===prio)
                      if (!items.length) return null
                      return (
                        <div key={prio} style={{marginBottom:'24px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                            <span style={{color:PRIO_COLOR[prio],fontSize:'14px',fontWeight:700}}>{PRIO_LABEL[prio]}</span>
                            <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',background:`${PRIO_COLOR[prio]}18`,color:PRIO_COLOR[prio]}}>{items.length}</span>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                            {items.map(t=>(
                              <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:`1px solid ${PRIO_COLOR[t.priority||'MEDIUM']}22`,cursor:'default'}}>
                                {/* Checkbox grande */}
                                <div onClick={()=>completeTask(t.id)} style={{width:'22px',height:'22px',borderRadius:'6px',border:`2px solid ${PRIO_COLOR[t.priority||'MEDIUM']}66`,background:'transparent',flexShrink:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}/>
                                <div style={{flex:1,minWidth:0}}>
                                  <p style={{color:'#fff',fontSize:'14px',fontWeight:500}}>{t.title}</p>
                                  {t.notes && <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>{t.notes}</p>}
                                  {t.scheduled_date && <p style={{color:'rgba(91,80,214,0.7)',fontSize:'11px',marginTop:'2px'}}>📅 {new Date(t.scheduled_date+'T12:00:00').toLocaleDateString('pt-BR')}</p>}
                                </div>
                                {t.category && <span style={{fontSize:'11px',padding:'3px 9px',borderRadius:'20px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.3)',flexShrink:0}}>{t.category}</span>}
                                <button onClick={()=>{setEditingTask(t);setTForm({title:t.title,notes:t.notes||'',priority:t.priority||'MEDIUM',category:t.category||'Pessoal',mission_id:t.mission_id||'',step_order:String(t.step_order||0),depends_on:t.depends_on||'',estimated_time:t.estimated_time||'',scheduled_date:t.scheduled_date||''});setShowTaskForm(true)}} style={{padding:'5px 9px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'7px',color:'rgba(255,255,255,0.35)',fontSize:'12px',cursor:'pointer',flexShrink:0}}>✎</button>
                                <button onClick={()=>deleteTask(t.id)} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'12px',cursor:'pointer',flexShrink:0}}>✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {sortedPendentes.length===0 && (
                      <div style={{textAlign:'center',padding:'60px 0'}}>
                        <p style={{fontSize:'40px',marginBottom:'12px'}}>✅</p>
                        <p style={{color:'rgba(255,255,255,0.3)',fontSize:'14px'}}>Nenhuma pendência! Use a captura rápida acima.</p>
                      </div>
                    )}

                    {/* Concluídas (colapsável) */}
                    {concluidas.length > 0 && (
                      <div style={{marginTop:'32px',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'20px'}}>
                        <p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>✓ Concluídas ({concluidas.length})</p>
                        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                          {concluidas.map(t=>(
                            <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 16px',borderRadius:'10px',background:'rgba(255,255,255,0.02)',opacity:0.5}}>
                              <div onClick={()=>reopenTask(t.id)} style={{width:'22px',height:'22px',borderRadius:'6px',background:'#5b50d6',flexShrink:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'#fff'}}>✓</div>
                              <p style={{flex:1,color:'rgba(255,255,255,0.3)',fontSize:'13px',textDecoration:'line-through'}}>{t.title}</p>
                              <button onClick={()=>deleteTask(t.id)} style={{padding:'3px 7px',background:'rgba(224,82,82,0.06)',border:'none',borderRadius:'5px',color:'#e05252',fontSize:'11px',cursor:'pointer'}}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── ABA MISSÕES ────────────────────────────── */}
            {tab==='missoes' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
                  <div>
                    <h1 style={{color:'#fff',fontSize:'20px',fontWeight:700}}>🚀 Missões</h1>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>Projetos com múltiplas etapas</p>
                  </div>
                  <button onClick={()=>{setEditingMission(null);setMForm({title:'',description:'',category:'geral'});setShowMissionForm(true)}} style={{padding:'9px 18px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Nova Missão</button>
                </div>

                {missions.length===0 && <p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'60px 0'}}>Nenhuma missão ainda</p>}

                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  {missions.map(m=>{
                    const mt=getMissionTasks(m.id)
                    const prog=getMissionProgress(m.id)
                    const next=getNextAction(m.id)
                    const isExp=selectedMission===m.id
                    return (
                      <div key={m.id} style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${prog===100?'rgba(76,175,125,0.2)':'rgba(255,255,255,0.07)'}`,borderRadius:'14px',overflow:'hidden'}}>
                        <div style={{padding:'18px 20px',cursor:'pointer'}} onClick={()=>setSelectedMission(isExp?null:m.id)}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                                <h2 style={{color:'#fff',fontSize:'15px',fontWeight:600}}>{m.title}</h2>
                                {prog===100 && <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'5px',background:'rgba(76,175,125,0.15)',color:'#4caf7d'}}>✓ Concluída</span>}
                              </div>
                              {m.description && <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px'}}>{m.description}</p>}
                            </div>
                            <div style={{display:'flex',gap:'6px',marginLeft:'12px',alignItems:'center'}}>
                              <button onClick={e=>{e.stopPropagation();setEditingMission(m);setMForm({title:m.title,description:m.description||'',category:m.category||'geral'});setShowMissionForm(true)}} style={{padding:'5px 9px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'7px',color:'rgba(255,255,255,0.4)',fontSize:'11px',cursor:'pointer'}}>✎</button>
                              <button onClick={e=>{e.stopPropagation();deleteMission(m.id)}} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'11px',cursor:'pointer'}}>✕</button>
                              <span style={{color:'rgba(255,255,255,0.2)',fontSize:'12px'}}>{isExp?'▲':'▼'}</span>
                            </div>
                          </div>
                          {/* Barra de progresso */}
                          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                            <div style={{flex:1,height:'6px',background:'rgba(255,255,255,0.06)',borderRadius:'3px',overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${prog}%`,background:prog===100?'#4caf7d':'#7c6ff7',borderRadius:'3px',transition:'width 0.3s'}}/>
                            </div>
                            <span style={{color:'rgba(255,255,255,0.4)',fontSize:'12px',fontWeight:600,minWidth:'40px'}}>{prog}%</span>
                            <span style={{color:'rgba(255,255,255,0.2)',fontSize:'11px'}}>{mt.filter(t=>t.status==='DONE').length}/{mt.length}</span>
                          </div>
                          {next && !isExp && (
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'10px',padding:'8px 12px',background:'rgba(91,80,214,0.06)',borderRadius:'8px'}}>
                              <div style={{width:'7px',height:'7px',borderRadius:'50%',background:PRIO_COLOR[next.priority||'MEDIUM'],flexShrink:0}}/>
                              <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>Próximo:</span>
                              <span style={{color:'#a89ff7',fontSize:'12px',fontWeight:500,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{next.title}</span>
                            </div>
                          )}
                        </div>

                        {isExp && (
                          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',padding:'16px 20px'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                              <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Etapas</span>
                              <button onClick={()=>{setEditingTask(null);setTForm({title:'',notes:'',priority:'MEDIUM',category:'geral',mission_id:m.id,step_order:String(mt.length),depends_on:'',estimated_time:'',scheduled_date:''});setShowTaskForm(true)}} style={{padding:'5px 12px',background:'rgba(91,80,214,0.2)',border:'none',borderRadius:'7px',color:'#a89ff7',fontSize:'11px',cursor:'pointer',fontWeight:600}}>+ Etapa</button>
                            </div>
                            {mt.length===0 && <p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px'}}>Nenhuma etapa ainda</p>}
                            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                              {mt.map((t,idx)=>{
                                const unlocked=isUnlocked(t)
                                const isDone=t.status==='DONE'
                                return (
                                  <div key={t.id} style={{display:'flex',gap:'10px',alignItems:'center'}}>
                                    <div onClick={()=>unlocked&&(isDone?reopenTask(t.id):completeTask(t.id))} style={{width:'24px',height:'24px',borderRadius:'50%',background:isDone?'#5b50d6':unlocked?'transparent':'rgba(255,255,255,0.03)',border:isDone?'none':unlocked?`2px solid ${PRIO_COLOR[t.priority||'MEDIUM']}66`:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:'#fff',flexShrink:0,cursor:unlocked?'pointer':'default'}}>{isDone?'✓':idx+1}</div>
                                    <div style={{flex:1,padding:'10px 14px',borderRadius:'10px',background:isDone?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.04)',border:`1px solid ${isDone?'rgba(255,255,255,0.04)':PRIO_COLOR[t.priority||'MEDIUM']+'22'}`,opacity:unlocked?1:0.4}}>
                                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px'}}>
                                        <p style={{color:isDone?'rgba(255,255,255,0.3)':'#fff',fontSize:'13px',fontWeight:500,textDecoration:isDone?'line-through':'none',flex:1}}>{t.title}</p>
                                        <div style={{display:'flex',gap:'4px',flexShrink:0}}>
                                          {!unlocked && <span style={{fontSize:'11px'}}>🔒</span>}
                                          <button onClick={()=>{setEditingTask(t);setTForm({title:t.title,notes:t.notes||'',priority:t.priority||'MEDIUM',category:t.category||'geral',mission_id:t.mission_id||'',step_order:String(t.step_order||0),depends_on:t.depends_on||'',estimated_time:t.estimated_time||'',scheduled_date:t.scheduled_date||''});setShowTaskForm(true)}} style={{padding:'3px 7px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'5px',color:'rgba(255,255,255,0.3)',fontSize:'11px',cursor:'pointer'}}>✎</button>
                                          <button onClick={()=>deleteTask(t.id)} style={{padding:'3px 6px',background:'rgba(224,82,82,0.06)',border:'none',borderRadius:'5px',color:'#e05252',fontSize:'11px',cursor:'pointer'}}>✕</button>
                                        </div>
                                      </div>
                                      {t.notes && <p style={{color:'rgba(255,255,255,0.25)',fontSize:'11px',marginTop:'3px'}}>{t.notes}</p>}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMissionForm && (
        <Modal title={editingMission?'Editar Missão':'Nova Missão'} onClose={()=>setShowMissionForm(false)}>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <input autoFocus placeholder="Nome da missão *" value={mForm.title} onChange={e=>setMForm(f=>({...f,title:e.target.value}))} style={inp} />
            <textarea placeholder="Objetivo / descrição" value={mForm.description} onChange={e=>setMForm(f=>({...f,description:e.target.value}))} style={{...inp,resize:'none',height:'80px'}} />
            <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Categoria</label>
              <select value={mForm.category} onChange={e=>setMForm(f=>({...f,category:e.target.value}))} style={sel}>{MISSION_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button onClick={saveMission} disabled={!mForm.title.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!mForm.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowMissionForm(false)} style={{padding:'11px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {showTaskForm && (
        <Modal title={editingTask?'Editar Pendência':'Nova Pendência'} onClose={()=>setShowTaskForm(false)}>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <input autoFocus placeholder="Título *" value={tForm.title} onChange={e=>setTForm(f=>({...f,title:e.target.value}))} style={inp} />
            <textarea placeholder="Observações (opcional)" value={tForm.notes} onChange={e=>setTForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'70px'}} />
            <div>
              <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'6px'}}>Prioridade</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px'}}>
                {PRIO_KEYS.map(p=>(
                  <button key={p} onClick={()=>setTForm(f=>({...f,priority:p}))} style={{padding:'8px 4px',borderRadius:'8px',border:`1px solid ${tForm.priority===p?PRIO_COLOR[p]:'rgba(255,255,255,0.08)'}`,background:tForm.priority===p?`${PRIO_COLOR[p]}22`:'transparent',color:tForm.priority===p?PRIO_COLOR[p]:'rgba(255,255,255,0.3)',fontSize:'12px',cursor:'pointer',fontWeight:tForm.priority===p?700:400}}>{PRIO_LABEL[p]}</button>
                ))}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Categoria</label>
                <select value={tForm.category} onChange={e=>setTForm(f=>({...f,category:e.target.value}))} style={sel}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Data</label>
                <input type="date" value={tForm.scheduled_date} onChange={e=>setTForm(f=>({...f,scheduled_date:e.target.value}))} style={{...inp,colorScheme:'dark'}} />
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button onClick={saveTask} disabled={!tForm.title.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!tForm.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              {editingTask && <button onClick={()=>{deleteTask(editingTask.id);setShowTaskForm(false)}} style={{padding:'11px 14px',background:'rgba(224,82,82,0.1)',border:'1px solid rgba(224,82,82,0.2)',borderRadius:'10px',color:'#e05252',fontSize:'13px',cursor:'pointer'}}>Apagar</button>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

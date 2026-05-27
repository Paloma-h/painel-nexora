'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

const USER_ID = 'paloma'
const PRIO_COLOR: any = {CRITICAL:'#e05252',HIGH:'#e05252',MEDIUM:'#d4b84a',LOW:'#4caf7d'}
const PRIO_LABEL: any = {CRITICAL:'Urgente',HIGH:'Alta',MEDIUM:'Média',LOW:'Depois'}
const CATS = ['geral','trabalho','marketing','vendas','pessoal','saúde','financeiro','educação']

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
  const [tab, setTab] = useState('proxima')
  const [missions, setMissions] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMissionForm, setShowMissionForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingMission, setEditingMission] = useState<any>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [selectedMission, setSelectedMission] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [mForm, setMForm] = useState({title:'',description:'',category:'geral'})
  const [tForm, setTForm] = useState({title:'',notes:'',priority:'MEDIUM',mission_id:'',step_order:'0',depends_on:''})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [m, t] = await Promise.all([
      supabase.from('missions').select('*').eq('user_id', USER_ID).order('created_at', {ascending:true}),
      supabase.from('tasks').select('*').eq('user_id', USER_ID).eq('type','pendencia').order('step_order', {ascending:true})
    ])
    setMissions(m.data || [])
    setTasks(t.data || [])
    setLoading(false)
  }

  async function saveMission() {
    if (!mForm.title.trim()) return
    setSaving(true)
    if (editingMission) {
      await supabase.from('missions').update({title:mForm.title.trim(),description:mForm.description||null,category:mForm.category}).eq('id', editingMission.id)
    } else {
      await supabase.from('missions').insert({id:crypto.randomUUID(),title:mForm.title.trim(),description:mForm.description||null,category:mForm.category,status:'ativa',user_id:USER_ID})
    }
    setShowMissionForm(false); setSaving(false); load()
  }

  async function saveTask() {
    if (!tForm.title.trim()) return
    setSaving(true)
    const data: any = {title:tForm.title.trim(),notes:tForm.notes||null,priority:tForm.priority,type:'pendencia',status:'PENDING',mission_id:tForm.mission_id||null,step_order:parseInt(tForm.step_order)||0,depends_on:tForm.depends_on||null,user_id:USER_ID}
    if (editingTask) {
      await supabase.from('tasks').update(data).eq('id', editingTask.id)
    } else {
      await supabase.from('tasks').insert({...data,id:crypto.randomUUID()})
    }
    setShowTaskForm(false); setSaving(false); load()
  }

  async function completeTask(id: string) {
    await supabase.from('tasks').update({status:'DONE'}).eq('id', id); load()
  }

  async function reopenTask(id: string) {
    await supabase.from('tasks').update({status:'PENDING'}).eq('id', id); load()
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id); load()
  }

  async function deleteMission(id: string) {
    if (!confirm('Apagar missão e todas as tarefas?')) return
    await supabase.from('tasks').delete().eq('mission_id', id)
    await supabase.from('missions').delete().eq('id', id)
    load()
  }

  function getMissionTasks(missionId: string) {
    return tasks.filter(t => t.mission_id === missionId).sort((a,b) => (a.step_order||0)-(b.step_order||0))
  }

  function getFreeTasks() {
    return tasks.filter(t => !t.mission_id)
  }

  function getMissionProgress(missionId: string) {
    const mt = getMissionTasks(missionId)
    if (mt.length === 0) return 0
    const done = mt.filter(t => t.status === 'DONE').length
    return Math.round((done/mt.length)*100)
  }

  function getNextAction(missionId: string) {
    const mt = getMissionTasks(missionId)
    return mt.find(t => t.status !== 'DONE')
  }

  function isTaskUnlocked(task: any) {
    if (!task.depends_on) return true
    const dep = tasks.find(t => t.id === task.depends_on)
    return dep ? dep.status === 'DONE' : true
  }

  const allPending = tasks.filter(t => t.status !== 'DONE')
  const nextActions = missions.map(m => ({mission:m, next:getNextAction(m.id)})).filter(x => x.next).slice(0,5)
  const freePending = getFreeTasks().filter(t => t.status !== 'DONE')

  const tabs = [{id:'proxima',label:'Próxima Ação'},{id:'missoes',label:'Missões'},{id:'lista',label:'Lista Geral'}]

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column',overflowY:'auto'}}>
        <div style={{background:'#0d0d1a',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 28px',display:'flex',gap:'4px',alignItems:'center',flexShrink:0}}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab===t.id?'#7c6ff7':'transparent'}`,color:tab===t.id?'#a89ff7':'rgba(255,255,255,0.35)',fontSize:'13px',cursor:'pointer',fontWeight:tab===t.id?600:400}}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
          <div style={{maxWidth:'800px',margin:'0 auto'}}>

            {tab==='proxima' && (
              <div>
                <h1 style={{color:'#fff',fontSize:'20px',fontWeight:700,marginBottom:'6px'}}>Próxima Ação</h1>
                <p style={{color:'rgba(255,255,255,0.3)',fontSize:'13px',marginBottom:'24px'}}>Foque no que importa agora. Um passo de cada vez.</p>

                {nextActions.length === 0 && freePending.length === 0 && (
                  <div style={{textAlign:'center',padding:'60px 0'}}>
                    <p style={{color:'rgba(255,255,255,0.2)',fontSize:'16px'}}>🎉 Nada pendente!</p>
                    <p style={{color:'rgba(255,255,255,0.15)',fontSize:'13px',marginTop:'8px'}}>Todas as tarefas foram concluídas.</p>
                  </div>
                )}

                {nextActions.map(({mission,next}) => next && (
                  <div key={mission.id} style={{marginBottom:'16px',background:'rgba(91,80,214,0.06)',border:'1px solid rgba(91,80,214,0.2)',borderRadius:'14px',padding:'20px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                      <div>
                        <p style={{color:'rgba(255,255,255,0.4)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'2px'}}>{mission.title}</p>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <div style={{height:'4px',width:'100px',background:'rgba(255,255,255,0.08)',borderRadius:'2px',overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${getMissionProgress(mission.id)}%`,background:'#7c6ff7',borderRadius:'2px'}}/>
                          </div>
                          <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>{getMissionProgress(mission.id)}%</span>
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',background:'rgba(255,255,255,0.05)',borderRadius:'10px'}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'50%',background:PRIO_COLOR[next.priority||'MEDIUM'],flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <p style={{color:'#fff',fontSize:'14px',fontWeight:600}}>{next.title}</p>
                        {next.notes&&<p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'3px'}}>{next.notes}</p>}
                      </div>
                      <span style={{fontSize:'11px',padding:'3px 10px',borderRadius:'6px',background:`${PRIO_COLOR[next.priority||'MEDIUM']}22`,color:PRIO_COLOR[next.priority||'MEDIUM']}}>{PRIO_LABEL[next.priority||'MEDIUM']}</span>
                      <button onClick={() => completeTask(next.id)} style={{padding:'7px 14px',background:'rgba(76,175,125,0.15)',border:'1px solid rgba(76,175,125,0.25)',borderRadius:'8px',color:'#4caf7d',fontSize:'12px',cursor:'pointer',fontWeight:600}}>✓ Concluir</button>
                    </div>
                  </div>
                ))}

                {freePending.length > 0 && (
                  <div style={{marginBottom:'16px'}}>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'10px'}}>Pendências soltas</p>
                    <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                      {freePending.slice(0,5).map(t => (
                        <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 14px',background:'rgba(255,255,255,0.04)',border:`1px solid ${PRIO_COLOR[t.priority||'MEDIUM']}22`,borderRadius:'10px'}}>
                          <div style={{width:'8px',height:'8px',borderRadius:'50%',background:PRIO_COLOR[t.priority||'MEDIUM'],flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <p style={{color:'#fff',fontSize:'13px',fontWeight:500}}>{t.title}</p>
                            {t.notes&&<p style={{color:'rgba(255,255,255,0.25)',fontSize:'11px',marginTop:'2px'}}>{t.notes}</p>}
                          </div>
                          <button onClick={() => completeTask(t.id)} style={{padding:'5px 10px',background:'rgba(76,175,125,0.12)',border:'none',borderRadius:'7px',color:'#4caf7d',fontSize:'11px',cursor:'pointer'}}>✓</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab==='missoes' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
                  <div>
                    <h1 style={{color:'#fff',fontSize:'20px',fontWeight:700}}>Missões</h1>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'13px',marginTop:'2px'}}>{missions.length} missões ativas</p>
                  </div>
                  <button onClick={() => {setEditingMission(null);setMForm({title:'',description:'',category:'geral'});setShowMissionForm(true)}} style={{padding:'8px 16px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Nova Missão</button>
                </div>

                {missions.length===0&&<p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhuma missão criada ainda</p>}

                <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                  {missions.map(m => {
                    const mt = getMissionTasks(m.id)
                    const prog = getMissionProgress(m.id)
                    const next = getNextAction(m.id)
                    const isExpanded = selectedMission===m.id
                    return (
                      <div key={m.id} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',overflow:'hidden'}}>
                        <div style={{padding:'18px 20px',cursor:'pointer'}} onClick={() => setSelectedMission(isExpanded?null:m.id)}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                                <h2 style={{color:'#fff',fontSize:'15px',fontWeight:600}}>{m.title}</h2>
                                <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'5px',background:'rgba(91,80,214,0.15)',color:'#a89ff7'}}>{m.category}</span>
                              </div>
                              {m.description&&<p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px'}}>{m.description}</p>}
                            </div>
                            <div style={{display:'flex',gap:'6px',alignItems:'center',marginLeft:'12px'}}>
                              <button onClick={e=>{e.stopPropagation();setEditingMission(m);setMForm({title:m.title,description:m.description||'',category:m.category||'geral'});setShowMissionForm(true)}} style={{padding:'4px 8px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'6px',color:'rgba(255,255,255,0.4)',fontSize:'11px',cursor:'pointer'}}>✎</button>
                              <button onClick={e=>{e.stopPropagation();deleteMission(m.id)}} style={{padding:'4px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'6px',color:'#e05252',fontSize:'11px',cursor:'pointer'}}>✕</button>
                              <span style={{color:'rgba(255,255,255,0.3)',fontSize:'14px'}}>{isExpanded?'▲':'▼'}</span>
                            </div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                            <div style={{flex:1,height:'5px',background:'rgba(255,255,255,0.06)',borderRadius:'3px',overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${prog}%`,background:prog===100?'#4caf7d':'#7c6ff7',borderRadius:'3px',transition:'width 0.3s'}}/>
                            </div>
                            <span style={{color:'rgba(255,255,255,0.4)',fontSize:'12px',fontWeight:600,minWidth:'35px'}}>{prog}%</span>
                            <span style={{color:'rgba(255,255,255,0.25)',fontSize:'11px'}}>{mt.filter(t=>t.status==='DONE').length}/{mt.length} etapas</span>
                          </div>
                          {next&&!isExpanded&&(
                            <div style={{marginTop:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
                              <span style={{color:'rgba(255,255,255,0.25)',fontSize:'11px'}}>Próximo:</span>
                              <span style={{color:'#a89ff7',fontSize:'12px',fontWeight:500}}>{next.title}</span>
                            </div>
                          )}
                        </div>

                        {isExpanded && (
                          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',padding:'16px 20px'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                              <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Etapas</span>
                              <button onClick={() => {setEditingTask(null);setTForm({title:'',notes:'',priority:'MEDIUM',mission_id:m.id,step_order:String(mt.length),depends_on:''});setShowTaskForm(true)}} style={{padding:'5px 10px',background:'rgba(91,80,214,0.2)',border:'none',borderRadius:'7px',color:'#a89ff7',fontSize:'11px',cursor:'pointer',fontWeight:600}}>+ Etapa</button>
                            </div>
                            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                              {mt.length===0&&<p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px',padding:'8px 0'}}>Nenhuma etapa ainda</p>}
                              {mt.map((t,idx) => {
                                const unlocked = isTaskUnlocked(t)
                                const isDone = t.status==='DONE'
                                return (
                                  <div key={t.id} style={{display:'flex',gap:'10px',alignItems:'flex-start'}}>
                                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'4px'}}>
                                      <div style={{width:'18px',height:'18px',borderRadius:'50%',background:isDone?'#5b50d6':unlocked?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.04)',border:isDone?'none':unlocked?'1px solid rgba(255,255,255,0.2)':'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',color:'#fff',flexShrink:0,cursor:unlocked?'pointer':'default'}} onClick={() => unlocked&&(isDone?reopenTask(t.id):completeTask(t.id))}>{isDone?'✓':idx+1}</div>
                                      {idx<mt.length-1&&<div style={{width:'1px',height:'20px',background:'rgba(255,255,255,0.08)',margin:'2px 0'}}/>}
                                    </div>
                                    <div style={{flex:1,padding:'6px 10px',borderRadius:'8px',background:isDone?'rgba(255,255,255,0.02)':unlocked?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.01)',border:`1px solid ${isDone?'rgba(255,255,255,0.04)':unlocked?PRIO_COLOR[t.priority||'MEDIUM']+'22':'rgba(255,255,255,0.04)'}`,opacity:unlocked?1:0.5,marginBottom:'4px'}}>
                                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                        <p style={{color:isDone?'rgba(255,255,255,0.3)':'#fff',fontSize:'13px',fontWeight:500,textDecoration:isDone?'line-through':'none'}}>{t.title}</p>
                                        <div style={{display:'flex',gap:'4px',marginLeft:'8px'}}>
                                          {!isDone&&unlocked&&<span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'5px',background:`${PRIO_COLOR[t.priority||'MEDIUM']}22`,color:PRIO_COLOR[t.priority||'MEDIUM']}}>{PRIO_LABEL[t.priority||'MEDIUM']}</span>}
                                          {!isDone&&!unlocked&&<span style={{fontSize:'10px',color:'rgba(255,255,255,0.2)'}}>🔒 bloqueada</span>}
                                          <button onClick={() => {setEditingTask(t);setTForm({title:t.title,notes:t.notes||'',priority:t.priority||'MEDIUM',mission_id:t.mission_id||'',step_order:String(t.step_order||0),depends_on:t.depends_on||''});setShowTaskForm(true)}} style={{padding:'2px 6px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'5px',color:'rgba(255,255,255,0.3)',fontSize:'10px',cursor:'pointer'}}>✎</button>
                                          <button onClick={() => deleteTask(t.id)} style={{padding:'2px 6px',background:'rgba(224,82,82,0.06)',border:'none',borderRadius:'5px',color:'#e05252',fontSize:'10px',cursor:'pointer'}}>✕</button>
                                        </div>
                                      </div>
                                      {t.notes&&<p style={{color:'rgba(255,255,255,0.25)',fontSize:'11px',marginTop:'3px'}}>{t.notes}</p>}
                                      {t.depends_on&&!isDone&&<p style={{color:'rgba(255,255,255,0.2)',fontSize:'10px',marginTop:'3px'}}>Aguarda: {tasks.find(x=>x.id===t.depends_on)?.title||'tarefa anterior'}</p>}
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

            {tab==='lista' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
                  <div>
                    <h1 style={{color:'#fff',fontSize:'20px',fontWeight:700}}>Lista Geral</h1>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'13px',marginTop:'2px'}}>{tasks.filter(t=>t.status!=='DONE').length} pendentes · {tasks.filter(t=>t.status==='DONE').length} concluídas</p>
                  </div>
                  <button onClick={() => {setEditingTask(null);setTForm({title:'',notes:'',priority:'MEDIUM',mission_id:'',step_order:'0',depends_on:''});setShowTaskForm(true)}} style={{padding:'8px 16px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Nova</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {tasks.length===0&&<p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhuma pendência ainda</p>}
                  {tasks.map(t => (
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:`1px solid ${t.status==='DONE'?'rgba(255,255,255,0.05)':PRIO_COLOR[t.priority||'MEDIUM']+'22'}`}}>
                      <div onClick={() => t.status==='DONE'?reopenTask(t.id):completeTask(t.id)} style={{width:'16px',height:'16px',borderRadius:'4px',border:t.status==='DONE'?'none':'1px solid rgba(255,255,255,0.2)',background:t.status==='DONE'?'#5b50d6':'transparent',flexShrink:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:'#fff'}}>{t.status==='DONE'?'✓':''}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{color:t.status==='DONE'?'rgba(255,255,255,0.3)':'#fff',fontSize:'13px',fontWeight:500,textDecoration:t.status==='DONE'?'line-through':'none'}}>{t.title}</p>
                        <div style={{display:'flex',gap:'8px',marginTop:'2px'}}>
                          {t.mission_id&&<span style={{color:'rgba(91,80,214,0.6)',fontSize:'10px'}}>{missions.find(m=>m.id===t.mission_id)?.title}</span>}
                          {t.notes&&<span style={{color:'rgba(255,255,255,0.2)',fontSize:'10px'}}>{t.notes}</span>}
                        </div>
                      </div>
                      <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'6px',background:`${PRIO_COLOR[t.priority||'MEDIUM']}22`,color:PRIO_COLOR[t.priority||'MEDIUM']}}>{PRIO_LABEL[t.priority||'MEDIUM']}</span>
                      <button onClick={() => {setEditingTask(t);setTForm({title:t.title,notes:t.notes||'',priority:t.priority||'MEDIUM',mission_id:t.mission_id||'',step_order:String(t.step_order||0),depends_on:t.depends_on||''});setShowTaskForm(true)}} style={{padding:'5px 8px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'7px',color:'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer'}}>✎</button>
                      <button onClick={() => deleteTask(t.id)} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'12px',cursor:'pointer'}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMissionForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div style={{width:'100%',maxWidth:'420px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <h2 style={{color:'#fff',fontSize:'15px',fontWeight:600}}>{editingMission?'Editar Missão':'Nova Missão'}</h2>
              <button onClick={() => setShowMissionForm(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input autoFocus placeholder="Nome da missão *" value={mForm.title} onChange={e=>setMForm(f=>({...f,title:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <textarea placeholder="Descrição / objetivo" value={mForm.description} onChange={e=>setMForm(f=>({...f,description:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none',resize:'none',height:'80px'}} />
              <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Categoria</label>
                <select value={mForm.category} onChange={e=>setMForm(f=>({...f,category:e.target.value}))} style={{width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'9px 12px',color:'#fff',fontSize:'13px',outline:'none'}}>
                  {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                <button onClick={saveMission} disabled={!mForm.title.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!mForm.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
                <button onClick={() => setShowMissionForm(false)} style={{padding:'10px 14px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTaskForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div style={{width:'100%',maxWidth:'420px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <h2 style={{color:'#fff',fontSize:'15px',fontWeight:600}}>{editingTask?'Editar Etapa':'Nova Etapa'}</h2>
              <button onClick={() => setShowTaskForm(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input autoFocus placeholder="Título *" value={tForm.title} onChange={e=>setTForm(f=>({...f,title:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <textarea placeholder="Observações" value={tForm.notes} onChange={e=>setTForm(f=>({...f,notes:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none',resize:'none',height:'72px'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Prioridade</label>
                  <select value={tForm.priority} onChange={e=>setTForm(f=>({...f,priority:e.target.value}))} style={{width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none'}}>
                    {Object.keys(PRIO_LABEL).map(p=><option key={p} value={p}>{PRIO_LABEL[p]}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Missão</label>
                  <select value={tForm.mission_id} onChange={e=>setTForm(f=>({...f,mission_id:e.target.value}))} style={{width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none'}}>
                    <option value="">Nenhuma</option>
                    {missions.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
              </div>
              {tForm.mission_id && (
                <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Depende de (opcional)</label>
                  <select value={tForm.depends_on} onChange={e=>setTForm(f=>({...f,depends_on:e.target.value}))} style={{width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none'}}>
                    <option value="">Nenhuma dependência</option>
                    {tasks.filter(t=>t.mission_id===tForm.mission_id&&t.id!==editingTask?.id).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
              )}
              <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                <button onClick={saveTask} disabled={!tForm.title.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!tForm.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
                <button onClick={() => setShowTaskForm(false)} style={{padding:'10px 14px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
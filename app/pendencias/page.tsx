'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

const USER_ID = 'paloma'
const PRIO_COLOR: any = {CRITICAL:'#e05252',HIGH:'#e05252',MEDIUM:'#d4b84a',LOW:'#4caf7d'}
const PRIO_LABEL: any = {CRITICAL:'Urgente',HIGH:'Alta',MEDIUM:'Média',LOW:'Depois'}
const CATS = ['Empresa','Casa','Faculdade','Documentos','Cursos','Campanhas','Financeiro','Pessoal','geral']
const MISSION_CATS = ['trabalho','marketing','vendas','pessoal','saúde','financeiro','educação','geral']

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
      <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',margin:'10px 0'}}/>
      <Link href="/saude" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/saude'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/saude'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/saude'?500:400}}>Saúde</Link>
      <Link href="/educacao" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/educacao'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/educacao'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/educacao'?500:400}}>Educação</Link>
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
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
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
  const [tab, setTab] = useState('proxima')
  const [missions, setMissions] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMissionForm, setShowMissionForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingMission, setEditingMission] = useState<any>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [selectedMission, setSelectedMission] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('Todas')
  const [mForm, setMForm] = useState({title:'',description:'',category:'geral'})
  const [tForm, setTForm] = useState({
    title:'',notes:'',priority:'MEDIUM',category:'Pessoal',
    mission_id:'',step_order:'0',depends_on:'',
    estimated_time:'',scheduled_date:'',scheduled_time:''
  })

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
    const data:any = {
      title:tForm.title.trim(),notes:tForm.notes||null,priority:tForm.priority,
      category:tForm.category,type:'pendencia',status:'PENDING',
      mission_id:tForm.mission_id||null,step_order:parseInt(tForm.step_order)||0,
      depends_on:tForm.depends_on||null,estimated_time:tForm.estimated_time||null,
      scheduled_date:tForm.scheduled_date||null,scheduled_time:tForm.scheduled_time||null,
      user_id:USER_ID
    }
    editingTask
      ? await supabase.from('tasks').update(data).eq('id',editingTask.id)
      : await supabase.from('tasks').insert({...data,id:crypto.randomUUID()})
    setShowTaskForm(false); setSaving(false); load()
  }

  async function completeTask(id:string) { await supabase.from('tasks').update({status:'DONE'}).eq('id',id); load() }
  async function reopenTask(id:string) { await supabase.from('tasks').update({status:'PENDING'}).eq('id',id); load() }
  async function deleteTask(id:string) { await supabase.from('tasks').delete().eq('id',id); load() }
  async function postponeTask(id:string) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1)
    await supabase.from('tasks').update({postponed_to:tomorrow.toISOString().split('T')[0]}).eq('id',id); load()
  }
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

  const mainNext = (() => {
    for (const m of missions) { const n=getNextAction(m.id); if(n&&isUnlocked(n)) return {task:n,mission:m} }
    const f=getFreeTasks().find(t=>t.status!=='DONE'&&(t.priority==='CRITICAL'||t.priority==='HIGH'))
    if(f) return {task:f,mission:null}
    const any=getFreeTasks().find(t=>t.status!=='DONE')
    return any?{task:any,mission:null}:null
  })()

  const catGroups = CATS.reduce((acc:any,cat) => {
    const items = getFreeTasks().filter(t=>t.status!=='DONE'&&(t.category===cat||(!t.category&&cat==='Pessoal')))
    if(items.length>0) acc[cat]=items
    return acc
  },{})

  const tabs = [{id:'proxima',label:'Próxima Ação'},{id:'missoes',label:'Missões'},{id:'lista',label:'Lista Geral'}]

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <div style={{background:'#0d0d1a',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 28px',display:'flex',gap:'4px',flexShrink:0}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab===t.id?'#7c6ff7':'transparent'}`,color:tab===t.id?'#a89ff7':'rgba(255,255,255,0.35)',fontSize:'13px',cursor:'pointer',fontWeight:tab===t.id?600:400}}>{t.label}</button>
          ))}
        </div>

        <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
          <div style={{maxWidth:'780px',margin:'0 auto'}}>

            {tab==='proxima' && (
              <div>
                <div style={{marginBottom:'28px'}}>
                  <h1 style={{color:'#fff',fontSize:'20px',fontWeight:700}}>Próxima Ação</h1>
                  <p style={{color:'rgba(255,255,255,0.3)',fontSize:'13px',marginTop:'4px'}}>Um passo de cada vez. Foque no que importa agora.</p>
                </div>

                {!mainNext ? (
                  <div style={{textAlign:'center',padding:'80px 0'}}>
                    <div style={{fontSize:'48px',marginBottom:'16px'}}>🎉</div>
                    <p style={{color:'#fff',fontSize:'18px',fontWeight:600,marginBottom:'8px'}}>Tudo em dia!</p>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'14px'}}>Nenhuma pendência ativa no momento.</p>
                  </div>
                ) : (
                  <div>
                    {mainNext.mission && (
                      <div style={{marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{color:'rgba(255,255,255,0.3)',fontSize:'12px'}}>Missão:</span>
                        <span style={{color:'#a89ff7',fontSize:'13px',fontWeight:500}}>{mainNext.mission.title}</span>
                        <div style={{flex:1,height:'3px',background:'rgba(255,255,255,0.06)',borderRadius:'2px',overflow:'hidden',maxWidth:'120px'}}>
                          <div style={{height:'100%',width:`${getMissionProgress(mainNext.mission.id)}%`,background:'#7c6ff7',borderRadius:'2px'}}/>
                        </div>
                        <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>{getMissionProgress(mainNext.mission.id)}%</span>
                      </div>
                    )}
                    <div style={{background:'rgba(91,80,214,0.06)',border:`1px solid ${PRIO_COLOR[mainNext.task.priority||'MEDIUM']}44`,borderRadius:'16px',padding:'28px'}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'16px'}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                            <span style={{fontSize:'12px',padding:'3px 12px',borderRadius:'20px',background:`${PRIO_COLOR[mainNext.task.priority||'MEDIUM']}22`,color:PRIO_COLOR[mainNext.task.priority||'MEDIUM'],fontWeight:600}}>{PRIO_LABEL[mainNext.task.priority||'MEDIUM']}</span>
                            {mainNext.task.category&&<span style={{fontSize:'11px',padding:'3px 10px',borderRadius:'20px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.4)'}}>{mainNext.task.category}</span>}
                            {mainNext.task.estimated_time&&<span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>⏱ {mainNext.task.estimated_time}</span>}
                          </div>
                          <h2 style={{color:'#fff',fontSize:'22px',fontWeight:700,marginBottom:'8px'}}>{mainNext.task.title}</h2>
                          {mainNext.task.notes&&<p style={{color:'rgba(255,255,255,0.4)',fontSize:'14px',lineHeight:1.5}}>{mainNext.task.notes}</p>}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                        <button onClick={()=>completeTask(mainNext.task.id)} style={{padding:'11px 24px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>✓ Concluir</button>
                        <button onClick={()=>{setEditingTask(mainNext.task);setTForm({title:mainNext.task.title,notes:mainNext.task.notes||'',priority:mainNext.task.priority||'MEDIUM',category:mainNext.task.category||'Pessoal',mission_id:mainNext.task.mission_id||'',step_order:String(mainNext.task.step_order||0),depends_on:mainNext.task.depends_on||'',estimated_time:mainNext.task.estimated_time||'',scheduled_date:mainNext.task.scheduled_date||'',scheduled_time:mainNext.task.scheduled_time||''});setShowTaskForm(true)}} style={{padding:'11px 20px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.6)',fontSize:'13px',cursor:'pointer'}}>✎ Editar</button>
                        <button onClick={()=>postponeTask(mainNext.task.id)} style={{padding:'11px 20px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>⏭ Adiar</button>
                      </div>
                    </div>

                    <div style={{marginTop:'28px'}}>
                      <p style={{color:'rgba(255,255,255,0.25)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'12px'}}>Outras pendências</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                        {[...missions.map(m=>({task:getNextAction(m.id),mission:m})).filter(x=>x.task&&x.task.id!==mainNext.task.id).slice(0,3).map(({task,mission})=>task&&(
                          <div key={task.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px'}}>
                            <div style={{width:'8px',height:'8px',borderRadius:'50%',background:PRIO_COLOR[task.priority||'MEDIUM'],flexShrink:0}}/>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{color:'#fff',fontSize:'13px',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{task.title}</p>
                              <p style={{color:'rgba(255,255,255,0.25)',fontSize:'11px',marginTop:'1px'}}>{mission.title}</p>
                            </div>
                            <button onClick={()=>completeTask(task.id)} style={{padding:'4px 10px',background:'rgba(76,175,125,0.1)',border:'none',borderRadius:'6px',color:'#4caf7d',fontSize:'11px',cursor:'pointer'}}>✓</button>
                          </div>
                        ))]}
                      </div>
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
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'13px',marginTop:'2px'}}>{missions.length} missões · execução em etapas</p>
                  </div>
                  <button onClick={()=>{setEditingMission(null);setMForm({title:'',description:'',category:'geral'});setShowMissionForm(true)}} style={{padding:'8px 16px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Nova Missão</button>
                </div>

                {missions.length===0&&<p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'60px 0'}}>Nenhuma missão criada ainda</p>}

                <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                  {missions.map(m=>{
                    const mt=getMissionTasks(m.id)
                    const prog=getMissionProgress(m.id)
                    const next=getNextAction(m.id)
                    const isExp=selectedMission===m.id
                    return (
                      <div key={m.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'14px',overflow:'hidden'}}>
                        <div style={{padding:'20px',cursor:'pointer'}} onClick={()=>setSelectedMission(isExp?null:m.id)}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px'}}>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                                <h2 style={{color:'#fff',fontSize:'15px',fontWeight:600}}>{m.title}</h2>
                                <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'5px',background:'rgba(91,80,214,0.15)',color:'#a89ff7'}}>{m.category}</span>
                                {prog===100&&<span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'5px',background:'rgba(76,175,125,0.15)',color:'#4caf7d'}}>✓ Concluída</span>}
                              </div>
                              {m.description&&<p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px'}}>{m.description}</p>}
                            </div>
                            <div style={{display:'flex',gap:'6px',marginLeft:'12px'}}>
                              <button onClick={e=>{e.stopPropagation();setEditingMission(m);setMForm({title:m.title,description:m.description||'',category:m.category||'geral'});setShowMissionForm(true)}} style={{padding:'4px 8px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'6px',color:'rgba(255,255,255,0.4)',fontSize:'11px',cursor:'pointer'}}>✎</button>
                              <button onClick={e=>{e.stopPropagation();deleteMission(m.id)}} style={{padding:'4px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'6px',color:'#e05252',fontSize:'11px',cursor:'pointer'}}>✕</button>
                              <span style={{color:'rgba(255,255,255,0.25)',fontSize:'12px',padding:'4px'}}>{isExp?'▲':'▼'}</span>
                            </div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom: next&&!isExp?'10px':'0'}}>
                            <div style={{flex:1,height:'5px',background:'rgba(255,255,255,0.06)',borderRadius:'3px',overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${prog}%`,background:prog===100?'#4caf7d':'#7c6ff7',borderRadius:'3px'}}/>
                            </div>
                            <span style={{color:'rgba(255,255,255,0.4)',fontSize:'12px',fontWeight:600,minWidth:'35px'}}>{prog}%</span>
                            <span style={{color:'rgba(255,255,255,0.25)',fontSize:'11px'}}>{mt.filter(t=>t.status==='DONE').length}/{mt.length}</span>
                          </div>
                          {next&&!isExp&&(
                            <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'8px',padding:'8px 12px',background:'rgba(91,80,214,0.06)',borderRadius:'8px'}}>
                              <div style={{width:'6px',height:'6px',borderRadius:'50%',background:PRIO_COLOR[next.priority||'MEDIUM'],flexShrink:0}}/>
                              <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>Próximo:</span>
                              <span style={{color:'#a89ff7',fontSize:'12px',fontWeight:500}}>{next.title}</span>
                              {next.estimated_time&&<span style={{color:'rgba(255,255,255,0.2)',fontSize:'11px',marginLeft:'auto'}}>⏱ {next.estimated_time}</span>}
                            </div>
                          )}
                        </div>

                        {isExp&&(
                          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',padding:'16px 20px'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
                              <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Etapas</span>
                              <button onClick={()=>{setEditingTask(null);setTForm({title:'',notes:'',priority:'MEDIUM',category:'geral',mission_id:m.id,step_order:String(mt.length),depends_on:'',estimated_time:'',scheduled_date:'',scheduled_time:''});setShowTaskForm(true)}} style={{padding:'5px 12px',background:'rgba(91,80,214,0.2)',border:'none',borderRadius:'7px',color:'#a89ff7',fontSize:'11px',cursor:'pointer',fontWeight:600}}>+ Etapa</button>
                            </div>
                            {mt.length===0&&<p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px',padding:'8px 0'}}>Nenhuma etapa ainda</p>}
                            <div style={{display:'flex',flexDirection:'column'}}>
                              {mt.map((t,idx)=>{
                                const unlocked=isUnlocked(t)
                                const isDone=t.status==='DONE'
                                return (
                                  <div key={t.id} style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'8px'}}>
                                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'3px'}}>
                                      <div onClick={()=>unlocked&&(isDone?reopenTask(t.id):completeTask(t.id))} style={{width:'22px',height:'22px',borderRadius:'50%',background:isDone?'#5b50d6':unlocked?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.03)',border:isDone?'none':unlocked?'1px solid rgba(255,255,255,0.2)':'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:'#fff',flexShrink:0,cursor:unlocked?'pointer':'default'}}>{isDone?'✓':idx+1}</div>
                                      {idx<mt.length-1&&<div style={{width:'1px',height:'24px',background:'rgba(255,255,255,0.07)',margin:'3px 0'}}/>}
                                    </div>
                                    <div style={{flex:1,padding:'10px 14px',borderRadius:'10px',background:isDone?'rgba(255,255,255,0.02)':unlocked?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.01)',border:`1px solid ${isDone?'rgba(255,255,255,0.04)':unlocked?PRIO_COLOR[t.priority||'MEDIUM']+'22':'rgba(255,255,255,0.04)'}`,opacity:unlocked?1:0.5}}>
                                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px'}}>
                                        <p style={{color:isDone?'rgba(255,255,255,0.3)':'#fff',fontSize:'13px',fontWeight:500,textDecoration:isDone?'line-through':'none',flex:1}}>{t.title}</p>
                                        <div style={{display:'flex',gap:'4px',alignItems:'center',flexShrink:0}}>
                                          {!isDone&&unlocked&&<span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'5px',background:`${PRIO_COLOR[t.priority||'MEDIUM']}22`,color:PRIO_COLOR[t.priority||'MEDIUM']}}>{PRIO_LABEL[t.priority||'MEDIUM']}</span>}
                                          {!unlocked&&<span style={{fontSize:'10px',color:'rgba(255,255,255,0.2)'}}>🔒</span>}
                                          {t.estimated_time&&<span style={{fontSize:'10px',color:'rgba(255,255,255,0.2)'}}>⏱{t.estimated_time}</span>}
                                          <button onClick={()=>{setEditingTask(t);setTForm({title:t.title,notes:t.notes||'',priority:t.priority||'MEDIUM',category:t.category||'geral',mission_id:t.mission_id||'',step_order:String(t.step_order||0),depends_on:t.depends_on||'',estimated_time:t.estimated_time||'',scheduled_date:t.scheduled_date||'',scheduled_time:t.scheduled_time||''});setShowTaskForm(true)}} style={{padding:'2px 6px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'5px',color:'rgba(255,255,255,0.3)',fontSize:'10px',cursor:'pointer'}}>✎</button>
                                          <button onClick={()=>deleteTask(t.id)} style={{padding:'2px 6px',background:'rgba(224,82,82,0.06)',border:'none',borderRadius:'5px',color:'#e05252',fontSize:'10px',cursor:'pointer'}}>✕</button>
                                        </div>
                                      </div>
                                      {t.notes&&<p style={{color:'rgba(255,255,255,0.25)',fontSize:'11px',marginTop:'4px'}}>{t.notes}</p>}
                                      {t.depends_on&&!isDone&&<p style={{color:'rgba(255,255,255,0.2)',fontSize:'10px',marginTop:'3px'}}>🔗 Aguarda: {tasks.find(x=>x.id===t.depends_on)?.title||'etapa anterior'}</p>}
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
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                  <div>
                    <h1 style={{color:'#fff',fontSize:'20px',fontWeight:700}}>Lista Geral</h1>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'13px',marginTop:'2px'}}>{tasks.filter(t=>!t.mission_id&&t.status!=='DONE').length} pendências soltas</p>
                  </div>
                  <button onClick={()=>{setEditingTask(null);setTForm({title:'',notes:'',priority:'MEDIUM',category:'Pessoal',mission_id:'',step_order:'0',depends_on:'',estimated_time:'',scheduled_date:'',scheduled_time:''});setShowTaskForm(true)}} style={{padding:'8px 16px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Nova</button>
                </div>

                <div style={{display:'flex',gap:'6px',marginBottom:'20px',flexWrap:'wrap'}}>
                  {['Todas',...CATS].map(c=>(
                    <button key={c} onClick={()=>setFilterCat(c)} style={{padding:'5px 12px',borderRadius:'20px',border:`1px solid ${filterCat===c?'rgba(91,80,214,0.4)':'rgba(255,255,255,0.08)'}`,background:filterCat===c?'rgba(91,80,214,0.15)':'transparent',color:filterCat===c?'#a89ff7':'rgba(255,255,255,0.35)',fontSize:'11px',cursor:'pointer',fontWeight:filterCat===c?500:400}}>{c}</button>
                  ))}
                </div>

                {Object.keys(catGroups).filter(c=>filterCat==='Todas'||c===filterCat).length===0&&(
                  <p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhuma pendência nesta categoria</p>
                )}

                {Object.entries(catGroups).filter(([c])=>filterCat==='Todas'||c===filterCat).map(([cat,items]:any)=>(
                  <div key={cat} style={{marginBottom:'20px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                      <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{cat}</span>
                      <span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'5px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.3)'}}>{items.length}</span>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                      {items.map((t:any)=>(
                        <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:`1px solid ${PRIO_COLOR[t.priority||'MEDIUM']}22`}}>
                          <div onClick={()=>completeTask(t.id)} style={{width:'16px',height:'16px',borderRadius:'4px',border:'1px solid rgba(255,255,255,0.2)',background:'transparent',flexShrink:0,cursor:'pointer'}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{color:'#fff',fontSize:'13px',fontWeight:500}}>{t.title}</p>
                            <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                              {t.notes&&<span style={{color:'rgba(255,255,255,0.25)',fontSize:'11px'}}>{t.notes}</span>}
                              {t.estimated_time&&<span style={{color:'rgba(255,255,255,0.2)',fontSize:'11px'}}>⏱ {t.estimated_time}</span>}
                              {t.scheduled_date&&<span style={{color:'rgba(91,80,214,0.6)',fontSize:'11px'}}>{new Date(t.scheduled_date+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                            </div>
                          </div>
                          <span style={{fontSize:'11px',padding:'2px 9px',borderRadius:'6px',background:`${PRIO_COLOR[t.priority||'MEDIUM']}22`,color:PRIO_COLOR[t.priority||'MEDIUM'],flexShrink:0}}>{PRIO_LABEL[t.priority||'MEDIUM']}</span>
                          <button onClick={()=>{setEditingTask(t);setTForm({title:t.title,notes:t.notes||'',priority:t.priority||'MEDIUM',category:t.category||'Pessoal',mission_id:t.mission_id||'',step_order:String(t.step_order||0),depends_on:t.depends_on||'',estimated_time:t.estimated_time||'',scheduled_date:t.scheduled_date||'',scheduled_time:t.scheduled_time||''});setShowTaskForm(true)}} style={{padding:'5px 8px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'7px',color:'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer'}}>✎</button>
                          <button onClick={()=>deleteTask(t.id)} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'12px',cursor:'pointer'}}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {tasks.filter(t=>!t.mission_id&&t.status==='DONE').length>0&&(
                  <div style={{marginTop:'24px'}}>
                    <p style={{color:'rgba(255,255,255,0.15)',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px'}}>Concluídas</p>
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                      {tasks.filter(t=>!t.mission_id&&t.status==='DONE').map(t=>(
                        <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',borderRadius:'10px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)',opacity:0.5}}>
                          <div onClick={()=>reopenTask(t.id)} style={{width:'16px',height:'16px',borderRadius:'4px',background:'#5b50d6',flexShrink:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:'#fff'}}>✓</div>
                          <p style={{color:'rgba(255,255,255,0.3)',fontSize:'13px',textDecoration:'line-through',flex:1}}>{t.title}</p>
                          <button onClick={()=>deleteTask(t.id)} style={{padding:'3px 7px',background:'rgba(224,82,82,0.06)',border:'none',borderRadius:'5px',color:'#e05252',fontSize:'10px',cursor:'pointer'}}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showMissionForm&&(
        <Modal title={editingMission?'Editar Missão':'Nova Missão'} onClose={()=>setShowMissionForm(false)}>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <input autoFocus placeholder="Nome da missão *" value={mForm.title} onChange={e=>setMForm(f=>({...f,title:e.target.value}))} style={inp} />
            <textarea placeholder="Objetivo / descrição" value={mForm.description} onChange={e=>setMForm(f=>({...f,description:e.target.value}))} style={{...inp,resize:'none',height:'80px'}} />
            <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Categoria</label>
              <select value={mForm.category} onChange={e=>setMForm(f=>({...f,category:e.target.value}))} style={sel}>{MISSION_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button onClick={saveMission} disabled={!mForm.title.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!mForm.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowMissionForm(false)} style={{padding:'10px 14px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {showTaskForm&&(
        <Modal title={editingTask?'Editar':'Nova Pendência'} onClose={()=>setShowTaskForm(false)}>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <input autoFocus placeholder="Título *" value={tForm.title} onChange={e=>setTForm(f=>({...f,title:e.target.value}))} style={inp} />
            <textarea placeholder="Descrição / observações" value={tForm.notes} onChange={e=>setTForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'80px'}} />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Prioridade</label>
                <select value={tForm.priority} onChange={e=>setTForm(f=>({...f,priority:e.target.value}))} style={sel}>
                  {Object.keys(PRIO_LABEL).map(p=><option key={p} value={p}>{PRIO_LABEL[p]}</option>)}
                </select>
              </div>
              <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Categoria</label>
                <select value={tForm.category} onChange={e=>setTForm(f=>({...f,category:e.target.value}))} style={sel}>
                  {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Tempo estimado</label>
                <input placeholder="Ex: 30 min" value={tForm.estimated_time} onChange={e=>setTForm(f=>({...f,estimated_time:e.target.value}))} style={inp} />
              </div>
              <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Data</label>
                <input type="date" value={tForm.scheduled_date} onChange={e=>setTForm(f=>({...f,scheduled_date:e.target.value}))} style={{...inp,colorScheme:'dark'}} />
              </div>
            </div>
            <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Missão (opcional)</label>
              <select value={tForm.mission_id} onChange={e=>setTForm(f=>({...f,mission_id:e.target.value}))} style={sel}>
                <option value="">Sem missão</option>
                {missions.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            {tForm.mission_id&&(
              <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Depende de (opcional)</label>
                <select value={tForm.depends_on} onChange={e=>setTForm(f=>({...f,depends_on:e.target.value}))} style={sel}>
                  <option value="">Nenhuma dependência</option>
                  {tasks.filter(t=>t.mission_id===tForm.mission_id&&t.id!==editingTask?.id).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            )}
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button onClick={saveTask} disabled={!tForm.title.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!tForm.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              {editingTask&&<button onClick={()=>{deleteTask(editingTask.id);setShowTaskForm(false)}} style={{padding:'10px 14px',background:'rgba(224,82,82,0.1)',border:'1px solid rgba(224,82,82,0.2)',borderRadius:'10px',color:'#e05252',fontSize:'13px',cursor:'pointer'}}>Apagar</button>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
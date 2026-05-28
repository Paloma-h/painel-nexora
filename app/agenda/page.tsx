'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const USER_ID = 'paloma'
const FINANCIAL_CATEGORIES = ['alimentação', 'transporte', 'saúde', 'educação', 'lazer', 'moradia', 'trabalho', 'outros']
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
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
      <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',margin:'10px 0'}}/>
      <Link href="/saude" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/saude'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/saude'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/saude'?500:400}}>Saúde</Link>
      <Link href="/educacao" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/educacao'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/educacao'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/educacao'?500:400}}>Educação</Link>
      <div style={{marginTop:'auto'}}>
        <button onClick={logout} style={{display:'block',width:'100%',padding:'9px 12px',borderRadius:'10px',fontSize:'12px',color:'rgba(255,255,255,0.2)',background:'transparent',border:'none',textAlign:'left',cursor:'pointer'}}>Sair</button>
      </div>
    </div>
  )
}

export default function AgendaPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number|null>(null)
  const [viewingDay, setViewingDay] = useState<number|null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [taskForm, setTaskForm] = useState({title:'',time:'',notes:'',priority:'MEDIUM',is_recurring:false,recurrence:'monthly',amount:'',financial_type:'despesa',financial_category:'outros',has_financial:false})
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false})
    const all = data || []
    setTasks(all.filter((t:any) => t.type !== 'pendencia'))
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  function getTasksForDay(day: number) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return tasks.filter((t:any) => t.date === dateStr)
  }

  function openDayForm(day: number) {
    setSelectedDay(day); setEditingTask(null)
    setTaskForm({title:'',time:'',notes:'',priority:'MEDIUM',is_recurring:false,recurrence:'monthly',amount:'',financial_type:'despesa',financial_category:'outros',has_financial:false})
    setShowTaskForm(true)
  }

  function openEditTask(task: any) {
    setEditingTask(task)
    setSelectedDay(parseInt(task.date?.split('-')[2]))
    setTaskForm({title:task.title||'',time:task.time||'',notes:task.notes||'',priority:task.priority||'MEDIUM',is_recurring:task.is_recurring||false,recurrence:task.recurrence||'monthly',amount:task.amount?.toString()||'',financial_type:task.financial_type||'despesa',financial_category:task.financial_category||'outros',has_financial:!!task.amount})
    setShowTaskForm(true)
  }

  async function saveTask() {
    if (!taskForm.title.trim() || !selectedDay) return
    setSaving(true)
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    const data: any = {title:taskForm.title.trim(),date:dateStr,time:taskForm.time||null,notes:taskForm.notes||null,priority:taskForm.priority,type:'task',is_recurring:taskForm.is_recurring,recurrence:taskForm.is_recurring?taskForm.recurrence:null,status:'PENDING',user_id:USER_ID}
    if (taskForm.has_financial && taskForm.amount) {
      data.amount = parseFloat(taskForm.amount)
      data.financial_type = taskForm.financial_type
      data.financial_category = taskForm.financial_category
    }
    if (editingTask) {
      await supabase.from('tasks').update(data).eq('id', editingTask.id)
    } else {
      data.id = crypto.randomUUID()
      await supabase.from('tasks').insert(data)
      if (taskForm.is_recurring && taskForm.recurrence) {
        const occurrences = []
        for (let i = 1; i <= 12; i++) {
          const d = new Date(dateStr + 'T12:00:00')
          if (taskForm.recurrence === 'monthly') d.setMonth(d.getMonth() + i)
          else if (taskForm.recurrence === 'weekly') d.setDate(d.getDate() + (7 * i))
          else if (taskForm.recurrence === 'daily') d.setDate(d.getDate() + i)
          const occ: any = {id:crypto.randomUUID(),title:taskForm.title.trim(),date:d.toISOString().split('T')[0],time:taskForm.time||null,notes:taskForm.notes||null,priority:taskForm.priority,type:'task',is_recurring:true,recurrence:taskForm.recurrence,status:'PENDING',user_id:'paloma'}
          if (taskForm.has_financial && taskForm.amount) { occ.amount=parseFloat(taskForm.amount);occ.financial_type=taskForm.financial_type;occ.financial_category=taskForm.financial_category }
          occurrences.push(occ)
        }
        await supabase.from('tasks').insert(occurrences)
      }
      if (taskForm.has_financial && taskForm.amount) {
        await supabase.from('transactions').insert({id:crypto.randomUUID(),title:taskForm.title.trim(),amount:parseFloat(taskForm.amount),type:taskForm.financial_type,category:taskForm.financial_category,date:dateStr,notes:taskForm.notes||null,is_recurring:taskForm.is_recurring,recurrence:taskForm.is_recurring?taskForm.recurrence:null,task_id:data.id,user_id:USER_ID})
      }
    }
    setShowTaskForm(false); setSaving(false); load()
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setShowTaskForm(false); load()
  }

  async function completeTask(id: string) {
    const {data: task} = await supabase.from('tasks').select('*').eq('id',id).single()
    await supabase.from('tasks').update({status:'DONE'}).eq('id', id)
    if (task) {
      if (task.is_recurring && task.recurrence && task.date) {
        const d = new Date(task.date + 'T12:00:00')
        if (task.recurrence === 'monthly') d.setMonth(d.getMonth() + 1)
        else if (task.recurrence === 'weekly') d.setDate(d.getDate() + 7)
        else if (task.recurrence === 'daily') d.setDate(d.getDate() + 1)
        const nextDate = d.toISOString().split('T')[0]
        await supabase.from('tasks').insert({
          id: crypto.randomUUID(), title: task.title, date: nextDate,
          time: task.time || null, priority: task.priority, category: task.category,
          type: 'task', status: 'PENDING', is_recurring: true, recurrence: task.recurrence,
          amount: task.amount || null, financial_type: task.financial_type || null,
          financial_category: task.financial_category || null, notes: task.notes || null,
          user_id: USER_ID
        })
      }
      if (task.amount && task.financial_type) {
        const existing = await supabase.from('transactions').select('id').eq('task_id', id).single()
        if (!existing.data) {
          await supabase.from('transactions').insert({
            id: crypto.randomUUID(), title: task.title,
            amount: parseFloat(task.amount), type: task.financial_type,
            category: task.financial_category || 'outros',
            date: task.date || new Date().toISOString().split('T')[0],
            notes: task.notes || null, task_id: id, user_id: USER_ID
          })
        }
      }
    }
    load()
  }

  const priorityColor: any = {CRITICAL:'#e05252',HIGH:'#e05252',MEDIUM:'#d4b84a',LOW:'#4caf7d'}

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />

      <div style={{flex:1,padding:'24px',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <div style={{color:'#fff',fontSize:'18px',fontWeight:600}}>{MONTHS[month]} {year}</div>
          <div style={{display:'flex',gap:'6px'}}>
            <button onClick={() => setCurrentDate(new Date(year,month-1,1))} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',border:'none',color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:'14px'}}>‹</button>
            <button onClick={() => setCurrentDate(new Date())} style={{padding:'0 12px',height:'28px',borderRadius:'8px',background:'rgba(91,80,214,0.15)',border:'none',color:'#a89ff7',cursor:'pointer',fontSize:'11px'}}>Hoje</button>
            <button onClick={() => setCurrentDate(new Date(year,month+1,1))} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',border:'none',color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:'14px'}}>›</button>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',marginBottom:'4px'}}>
          {DAYS.map(d => <div key={d} style={{textAlign:'center',fontSize:'10px',color:'rgba(255,255,255,0.2)',padding:'4px 0',textTransform:'uppercase'}}>{d}</div>)}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px'}}>
          {Array(firstDay).fill(null).map((_,i) => <div key={'e'+i}/>)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const day = i+1
            const isToday = day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()
            const dayTasks = getTasksForDay(day)
            return (
              <div key={day} onClick={() => { if(dayTasks.length > 0){ setViewingDay(day) } else { openDayForm(day) } }} style={{minHeight:'90px',borderRadius:'8px',padding:'6px',background:isToday?'rgba(91,80,214,0.12)':'rgba(255,255,255,0.02)',border:isToday?'1px solid rgba(91,80,214,0.35)':'1px solid rgba(255,255,255,0.05)',cursor:'pointer'}}>
                <div style={{fontSize:'11px',color:isToday?'#a89ff7':'rgba(255,255,255,0.4)',fontWeight:isToday?700:400}}>{day}</div>
                <div style={{marginTop:'3px'}}>
                  {dayTasks.map((t:any) => (
                    <div key={t.id} onClick={e => {e.stopPropagation();openEditTask(t)}} style={{width:'100%',fontSize:'9px',color:t.status==='DONE'?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.75)',background:`${priorityColor[t.priority]}18`,borderLeft:`2px solid ${t.status==='DONE'?'rgba(255,255,255,0.1)':priorityColor[t.priority]}`,borderRadius:'0 3px 3px 0',padding:'2px 4px',marginBottom:'2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',textDecoration:t.status==='DONE'?'line-through':'none'}}>
                      {t.time&&<span style={{color:'rgba(255,255,255,0.3)',marginRight:'3px'}}>{t.time}</span>}{t.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {viewingDay && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)',maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600}}>Dia {viewingDay} de {MONTHS[month]}</h2>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={() => { setViewingDay(null); openDayForm(viewingDay) }} style={{padding:'6px 12px',background:'#5b50d6',border:'none',borderRadius:'8px',color:'#fff',fontSize:'12px',cursor:'pointer',fontWeight:600}}>+ Nova tarefa</button>
                <button onClick={() => setViewingDay(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
              </div>
            </div>
            <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:'6px'}}>
              {getTasksForDay(viewingDay).map((t:any) => (
                <div key={t.id} onClick={() => { setViewingDay(null); openEditTask(t) }} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.04)',border:`1px solid ${priorityColor[t.priority]}22`,cursor:'pointer'}}>
                  <div style={{width:'8px',height:'8px',borderRadius:'50%',background:priorityColor[t.priority],flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{color:t.status==='DONE'?'rgba(255,255,255,0.3)':'#fff',fontSize:'13px',fontWeight:500,textDecoration:t.status==='DONE'?'line-through':'none'}}>{t.title}</p>
                    {t.time&&<p style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',marginTop:'2px'}}>{t.time}</p>}
                    {t.notes&&<p style={{color:'rgba(255,255,255,0.25)',fontSize:'11px',marginTop:'2px'}}>{t.notes}</p>}
                  </div>
                  <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'5px',background:t.status==='DONE'?'rgba(76,175,125,0.1)':'rgba(255,255,255,0.06)',color:t.status==='DONE'?'#4caf7d':'rgba(255,255,255,0.3)'}}>{t.status==='DONE'?'Concluída':t.priority}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTaskForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div style={{width:'100%',maxWidth:'440px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600}}>{editingTask?'Editar tarefa':`Tarefa — dia ${selectedDay}`}</h2>
              <button onClick={() => setShowTaskForm(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Título *" value={taskForm.title} onChange={e => setTaskForm(f=>({...f,title:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'4px'}}>Horário</div>
                  <input type="time" value={taskForm.time} onChange={e => setTaskForm(f=>({...f,time:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none',colorScheme:'dark'}} />
                </div>
                <div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'4px'}}>Prioridade</div>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f=>({...f,priority:e.target.value}))} style={{width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none'}}>
                    <option value="CRITICAL">Urgente</option>
                    <option value="HIGH">Alta</option>
                    <option value="MEDIUM">Média</option>
                    <option value="LOW">Depois</option>
                  </select>
                </div>
              </div>
              <textarea placeholder="Observações" value={taskForm.notes} onChange={e => setTaskForm(f=>({...f,notes:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none',resize:'none',height:'100px'}} />
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <input type="checkbox" id="rec" checked={taskForm.is_recurring} onChange={e => setTaskForm(f=>({...f,is_recurring:e.target.checked}))} style={{cursor:'pointer'}} />
                <label htmlFor="rec" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',cursor:'pointer'}}>Recorrente</label>
                {taskForm.is_recurring && (
                  <select value={taskForm.recurrence} onChange={e => setTaskForm(f=>({...f,recurrence:e.target.value}))} style={{marginLeft:'8px',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'4px 8px',color:'#fff',fontSize:'12px',outline:'none'}}>
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                )}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <input type="checkbox" id="fin" checked={taskForm.has_financial} onChange={e => setTaskForm(f=>({...f,has_financial:e.target.checked}))} style={{cursor:'pointer'}} />
                <label htmlFor="fin" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',cursor:'pointer'}}>Lançar no financeiro</label>
              </div>
              {taskForm.has_financial && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',background:'rgba(91,80,214,0.05)',borderRadius:'10px',padding:'12px',border:'1px solid rgba(91,80,214,0.15)'}}>
                  <input placeholder="Valor R$" type="number" value={taskForm.amount} onChange={e => setTaskForm(f=>({...f,amount:e.target.value}))} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'7px 10px',color:'#fff',fontSize:'12px',outline:'none'}} />
                  <select value={taskForm.financial_type} onChange={e => setTaskForm(f=>({...f,financial_type:e.target.value}))} style={{background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'7px 10px',color:'#fff',fontSize:'12px',outline:'none'}}>
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                  </select>
                  <select value={taskForm.financial_category} onChange={e => setTaskForm(f=>({...f,financial_category:e.target.value}))} style={{background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'7px 10px',color:'#fff',fontSize:'12px',outline:'none'}}>
                    {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                <button onClick={saveTask} disabled={!taskForm.title.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!taskForm.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
                {editingTask && <button onClick={() => completeTask(editingTask.id)} style={{padding:'10px 14px',background:'rgba(76,175,125,0.15)',border:'1px solid rgba(76,175,125,0.3)',borderRadius:'10px',color:'#4caf7d',fontSize:'13px',cursor:'pointer'}}>✓</button>}
                {editingTask && <button onClick={() => deleteTask(editingTask.id)} style={{padding:'10px 14px',background:'rgba(224,82,82,0.1)',border:'1px solid rgba(224,82,82,0.2)',borderRadius:'10px',color:'#e05252',fontSize:'13px',cursor:'pointer'}}>Apagar</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
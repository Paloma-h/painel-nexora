'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'
const FINANCIAL_CATEGORIES = ['alimentação', 'transporte', 'saúde', 'educação', 'lazer', 'moradia', 'trabalho', 'outros']
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const PRIO_COLOR: any = {CRITICAL:'#dc2626',HIGH:'#dc2626',MEDIUM:'#ca8a04',LOW:'#16a34a'}
const PRIO_LABEL: any = {CRITICAL:'Urgente',HIGH:'Alta',MEDIUM:'Média',LOW:'Depois'}



export default function AgendaPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number|null>(null)
  const [viewingDay, setViewingDay] = useState<number|null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [taskForm, setTaskForm] = useState({title:'',time:'',notes:'',location:'',priority:'MEDIUM',is_recurring:false,recurrence:'monthly',amount:'',financial_type:'despesa',financial_category:'outros',has_financial:false})
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false})
    const all = data || []
    setTasks(all.filter((t:any) => t.type !== 'pendencia'))
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayRaw = new Date(year, month, 1).getDay()
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  function getTasksForDay(day: number) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return tasks.filter((t:any) => t.date === dateStr)
  }

  function openDayForm(day: number) {
    setSelectedDay(day); setEditingTask(null)
    setTaskForm({title:'',time:'',notes:'',location:'',priority:'MEDIUM',is_recurring:false,recurrence:'monthly',amount:'',financial_type:'despesa',financial_category:'outros',has_financial:false})
    setShowTaskForm(true)
  }

  function openEditTask(task: any) {
    setEditingTask(task)
    setSelectedDay(parseInt(task.date?.split('-')[2]))
    setTaskForm({title:task.title||'',time:task.time||'',notes:task.notes||'',location:task.location||'',priority:task.priority||'MEDIUM',is_recurring:task.is_recurring||false,recurrence:task.recurrence||'monthly',amount:task.amount?.toString()||'',financial_type:task.financial_type||'despesa',financial_category:task.financial_category||'outros',has_financial:!!task.amount})
    setShowTaskForm(true)
  }

  async function saveTask() {
    if (!taskForm.title.trim() || !selectedDay) return
    setSaving(true)
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    const data: any = {title:taskForm.title.trim(),date:dateStr,time:taskForm.time||null,notes:taskForm.notes||null,priority:taskForm.priority,type:'task',is_recurring:taskForm.is_recurring,recurrence:taskForm.is_recurring?taskForm.recurrence:null,status:'PENDING',user_id:USER_ID}
    if (taskForm.location) data.location = taskForm.location
    if (taskForm.has_financial && taskForm.amount) {
      data.amount = parseFloat(taskForm.amount)
      data.financial_type = taskForm.financial_type
      data.financial_category = taskForm.financial_category
    }
    if (editingTask) {
      const { error: upErr } = await supabase.from('tasks').update(data).eq('id', editingTask.id)
      if (upErr && data.location !== undefined) { delete data.location; await supabase.from('tasks').update(data).eq('id', editingTask.id) }
    } else {
      data.id = crypto.randomUUID()
      const { error: insErr } = await supabase.from('tasks').insert(data)
      if (insErr && data.location !== undefined) { delete data.location; await supabase.from('tasks').insert(data) }
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

  const priorityColor: any = {CRITICAL:'#dc2626',HIGH:'#dc2626',MEDIUM:'#ca8a04',LOW:'#16a34a'}

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />

      <div style={{flex:1,padding:'24px',overflowY:'auto',minWidth:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <div style={{color:'#111',fontSize:'22px',fontWeight:700,letterSpacing:'-0.3px'}}>{MONTHS[month]} {year}</div>
          <div style={{display:'flex',gap:'6px'}}>
            <button onClick={() => setCurrentDate(new Date(year,month-1,1))} style={{width:'32px',height:'32px',borderRadius:'8px',background:'#fff',border:'2px solid #bbb',color:'#333',cursor:'pointer',fontSize:'18px',fontWeight:700}}>‹</button>
            <button onClick={() => setCurrentDate(new Date())} style={{padding:'0 16px',height:'32px',borderRadius:'8px',background:'#7c3aed',border:'none',color:'#fff',cursor:'pointer',fontSize:'15px',fontWeight:600}}>Hoje</button>
            <button onClick={() => setCurrentDate(new Date(year,month+1,1))} style={{width:'32px',height:'32px',borderRadius:'8px',background:'#fff',border:'2px solid #bbb',color:'#333',cursor:'pointer',fontSize:'18px',fontWeight:700}}>›</button>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:'2px',marginBottom:'6px'}}>
          {DAYS.map(d => <div key={d} style={{textAlign:'center',fontSize:'15px',color:'#7c3aed',padding:'6px 0',textTransform:'uppercase',fontWeight:700,letterSpacing:'1px'}}>{d}</div>)}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:'3px'}}>
          {Array(firstDay).fill(null).map((_,i) => <div key={'e'+i} style={{background:'#f0f0f2',borderRadius:'8px',minHeight:'90px'}}/>)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const day = i+1
            const isToday = day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()
            const dayTasks = getTasksForDay(day)
            const hasTasks = dayTasks.length > 0
            const isPast = new Date(year,month,day) < new Date(today.getFullYear(),today.getMonth(),today.getDate())
            return (
              <div key={day} onClick={() => { if(hasTasks){ setViewingDay(day) } else { openDayForm(day) } }} style={{minHeight:'90px',borderRadius:'8px',padding:'6px',background:isToday?'#f0e8ff':'#fff',border:isToday?'2px solid #7c3aed':'1px solid #e5e5ea',cursor:'pointer',overflow:'hidden',transition:'border-color 0.15s',boxShadow:hasTasks?'0 1px 3px rgba(0,0,0,0.06)':'none'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:'15px',color:isToday?'#7c3aed':isPast?'#aaa':'#333',fontWeight:isToday?800:600}}>{day}</span>
                  {hasTasks && <span style={{fontSize:'8px',color:'#444',fontWeight:600}}>{dayTasks.length}</span>}
                </div>
                <div style={{marginTop:'3px'}}>
                  {dayTasks.map((t:any) => (
                    <div key={t.id} onClick={e => {e.stopPropagation();openEditTask(t)}} style={{display:'flex',alignItems:'center',gap:'2px',width:'100%',fontSize:'11px',color:t.status==='DONE'?'#bbb':'#333',background:t.status==='DONE'?'#f5f5f5':`${priorityColor[t.priority]}15`,borderLeft:`3px solid ${t.status==='DONE'?'#ccc':priorityColor[t.priority]}`,borderRadius:'0 4px 4px 0',padding:'3px 5px',marginBottom:'2px',textDecoration:t.status==='DONE'?'line-through':'none',fontWeight:t.status==='DONE'?400:500}}>
                      {t.notes&&<span style={{color:'#c2410c',fontWeight:900,fontSize:'15px',lineHeight:1,flexShrink:0}} title="Tem observação">*</span>}
                      <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0}}>{t.time&&<span style={{color:'#444',marginRight:'3px'}}>{t.time}</span>}{t.title}</span>
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
          <div style={{width:'100%',maxWidth:'520px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'1px solid #dbc8ff',maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <h2 style={{color:'#fff',fontSize:'18px',fontWeight:700}}>Dia {viewingDay} de {MONTHS[month]}</h2>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={() => { setViewingDay(null); openDayForm(viewingDay) }} style={{padding:'8px 14px',background:'#7c3aed',border:'none',borderRadius:'8px',color:'#fff',fontSize:'15px',cursor:'pointer',fontWeight:600}}>+ Nova tarefa</button>
                <button onClick={() => setViewingDay(null)} style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:'22px',fontWeight:700}}>✕</button>
              </div>
            </div>
            <div style={{overflowY:'auto',display:'flex',flexDirection:'column',gap:'6px'}}>
              {getTasksForDay(viewingDay).map((t:any) => (
                <div key={t.id} style={{borderRadius:'10px',background:'#fff',border:`1px solid ${priorityColor[t.priority]}33`,overflow:'hidden'}}>
                  <div onClick={() => { setViewingDay(null); openEditTask(t) }} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 14px',cursor:'pointer'}}>
                    <div style={{width:'10px',height:'10px',borderRadius:'50%',background:priorityColor[t.priority],flexShrink:0,boxShadow:`0 0 6px ${priorityColor[t.priority]}66`}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{color:t.status==='DONE'?'#999':'#fff',fontSize:'15px',fontWeight:600,textDecoration:t.status==='DONE'?'line-through':'none'}}>{t.title}{t.notes&&<span style={{color:'#fbbf24',marginLeft:'5px',fontSize:'18px'}}>*</span>}</p>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',marginTop:'4px',flexWrap:'wrap'}}>
                        {t.time&&<span style={{color:'#555',fontSize:'15px'}}>🕐 {t.time}</span>}
                        {t.location&&<a href={`https://www.google.com/maps/search/${encodeURIComponent(t.location)}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:'#34d399',fontSize:'15px',textDecoration:'none',fontWeight:500}}>📍 {t.location}</a>}
                        {t.amount>0&&<span style={{color:'#fbbf24',fontSize:'15px',fontWeight:500}}>R$ {Number(t.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
                      <span style={{fontSize:'15px',padding:'3px 10px',borderRadius:'6px',background:t.status==='DONE'?'#ddf5e8':`${priorityColor[t.priority]}20`,color:t.status==='DONE'?'#4caf7d':priorityColor[t.priority],fontWeight:600}}>{t.status==='DONE'?'✓ Concluída':PRIO_LABEL[t.priority]||t.priority}</span>
                      <button onClick={(e) => {e.stopPropagation(); setViewingDay(null); openEditTask(t)}} style={{padding:'4px 10px',background:'#fff',border:'1px solid #c9adff',borderRadius:'6px',color:'#c4b5fd',fontSize:'15px',cursor:'pointer',fontWeight:600}}>✏️</button>
                    </div>
                  </div>
                  {t.notes && (
                    <div style={{padding:'10px 14px 12px 34px',borderTop:'1px solid #e8e8ee',background:'#fff'}}>
                      <p style={{color:'#555',fontSize:'15px',lineHeight:'1.6',whiteSpace:'pre-wrap'}} dangerouslySetInnerHTML={{__html: t.notes.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#c4b5fd;text-decoration:underline">$1</a>')}} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTaskForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#ffffff',borderRadius:'16px',padding:'28px',border:'1px solid #dbc8ff',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#fff',fontSize:'18px',fontWeight:600}}>{editingTask?'Editar tarefa':`Tarefa — dia ${selectedDay}`}</h2>
              <button onClick={() => setShowTaskForm(false)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Título *" value={taskForm.title} onChange={e => setTaskForm(f=>({...f,title:e.target.value}))} style={{width:'100%',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'15px',outline:'none'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div>
                  <div style={{fontSize:'15px',color:'#444',marginBottom:'4px'}}>Horário</div>
                  <input type="time" value={taskForm.time} onChange={e => setTaskForm(f=>({...f,time:e.target.value}))} style={{width:'100%',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'15px',outline:'none',colorScheme:'light'}} />
                </div>
                <div>
                  <div style={{fontSize:'15px',color:'#444',marginBottom:'4px'}}>Prioridade</div>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f=>({...f,priority:e.target.value}))} style={{width:'100%',background:'#ffffff',border:'2px solid #bbb',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'15px',outline:'none'}}>
                    <option value="CRITICAL">Urgente</option>
                    <option value="HIGH">Alta</option>
                    <option value="MEDIUM">Média</option>
                    <option value="LOW">Depois</option>
                  </select>
                </div>
              </div>
              <textarea placeholder="Observações" value={taskForm.notes} onChange={e => setTaskForm(f=>({...f,notes:e.target.value}))} style={{width:'100%',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'15px',outline:'none',resize:'none',height:'100px'}} />
              <div>
                <div style={{fontSize:'15px',color:'#444',marginBottom:'4px'}}>📍 Endereço / Local</div>
                <div style={{display:'flex',gap:'6px'}}>
                  <input placeholder="Ex: Rua das Flores, 123 - Fortaleza" value={taskForm.location} onChange={e => setTaskForm(f=>({...f,location:e.target.value}))} style={{flex:1,background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'15px',outline:'none'}} />
                  {taskForm.location && <a href={`https://www.google.com/maps/search/${encodeURIComponent(taskForm.location)}`} target="_blank" rel="noopener noreferrer" style={{padding:'10px 12px',background:'#fff',border:'2px solid #16a34a',borderRadius:'10px',color:'#15803d',fontSize:'15px',textDecoration:'none',fontWeight:600,flexShrink:0,display:'flex',alignItems:'center'}}>🗺️ Maps</a>}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <input type="checkbox" id="rec" checked={taskForm.is_recurring} onChange={e => setTaskForm(f=>({...f,is_recurring:e.target.checked}))} style={{cursor:'pointer'}} />
                <label htmlFor="rec" style={{fontSize:'15px',color:'#555',cursor:'pointer'}}>Recorrente</label>
                {taskForm.is_recurring && (
                  <select value={taskForm.recurrence} onChange={e => setTaskForm(f=>({...f,recurrence:e.target.value}))} style={{marginLeft:'8px',background:'#ffffff',border:'2px solid #bbb',borderRadius:'8px',padding:'4px 8px',color:'#fff',fontSize:'15px',outline:'none'}}>
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                )}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <input type="checkbox" id="fin" checked={taskForm.has_financial} onChange={e => setTaskForm(f=>({...f,has_financial:e.target.checked}))} style={{cursor:'pointer'}} />
                <label htmlFor="fin" style={{fontSize:'15px',color:'#555',cursor:'pointer'}}>Lançar no financeiro</label>
              </div>
              {taskForm.has_financial && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',background:'#fff',borderRadius:'10px',padding:'12px',border:'2px solid #a78bfa'}}>
                  <input placeholder="Valor R$" type="number" value={taskForm.amount} onChange={e => setTaskForm(f=>({...f,amount:e.target.value}))} style={{background:'#fff',border:'2px solid #bbb',borderRadius:'8px',padding:'7px 10px',color:'#fff',fontSize:'15px',outline:'none'}} />
                  <select value={taskForm.financial_type} onChange={e => setTaskForm(f=>({...f,financial_type:e.target.value}))} style={{background:'#ffffff',border:'2px solid #bbb',borderRadius:'8px',padding:'7px 10px',color:'#fff',fontSize:'15px',outline:'none'}}>
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                  </select>
                  <select value={taskForm.financial_category} onChange={e => setTaskForm(f=>({...f,financial_category:e.target.value}))} style={{background:'#ffffff',border:'2px solid #bbb',borderRadius:'8px',padding:'7px 10px',color:'#fff',fontSize:'15px',outline:'none'}}>
                    {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                <button onClick={saveTask} disabled={!taskForm.title.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!taskForm.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
                {editingTask && <button onClick={() => completeTask(editingTask.id)} style={{padding:'10px 14px',background:'#fff',border:'2px solid #16a34a',borderRadius:'10px',color:'#15803d',fontSize:'15px',cursor:'pointer'}}>✓</button>}
                {editingTask && <button onClick={() => deleteTask(editingTask.id)} style={{padding:'10px 14px',background:'#fff',border:'2px solid #ef4444',borderRadius:'10px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>Apagar</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
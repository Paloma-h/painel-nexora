'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'

export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [pendencias, setPendencias] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [estoque, setEstoque] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rescheduleId, setRescheduleId] = useState<string|null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    const [t, p, l, c, b, e] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', USER_ID).neq('type','pendencia').order('date',{ascending:true}),
      supabase.from('tasks').select('*').eq('user_id', USER_ID).eq('type','pendencia').neq('status','DONE').order('created_at',{ascending:false}),
      supabase.from('leads').select('*').eq('user_id', USER_ID).not('next_followup','is',null).order('next_followup',{ascending:true}),
      supabase.from('clients').select('*').eq('user_id', USER_ID),
      supabase.from('bills').select('*').eq('user_id', USER_ID).eq('status','pendente'),
      supabase.from('estoque').select('*').eq('user_id', USER_ID),
    ])
    setTasks(t.data || [])
    setPendencias(p.data || [])
    setLeads(l.data || [])
    setClients(c.data || [])
    setBills(b.data || [])
    setEstoque(e.data || [])
    setLoading(false)
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Tasks
  const todayTasks = tasks.filter(t => t.date === todayStr && t.status !== 'DONE')
  const overdueTasks = tasks.filter(t => t.date && t.date < todayStr && t.status !== 'DONE').sort((a,b) => a.date.localeCompare(b.date))
  const doneTasks = tasks.filter(t => t.date === todayStr && t.status === 'DONE')

  // Todos os compromissos não cumpridos (atrasados + hoje + futuros) em ordem cronológica
  const allPending = tasks.filter(t => t.status !== 'DONE' && t.date).sort((a,b) => a.date.localeCompare(b.date))

  // Próximas tarefas (próximos 14 dias)
  const next7 = new Date(today); next7.setDate(today.getDate() + 7)
  const next7Str = next7.toISOString().split('T')[0]
  const next14 = new Date(today); next14.setDate(today.getDate() + 14)
  const next14Str = next14.toISOString().split('T')[0]
  const upcomingTasks = tasks.filter(t => t.date > todayStr && t.date <= next14Str && t.status !== 'DONE').sort((a,b) => a.date.localeCompare(b.date))

  // Pendências urgentes (🔴 e 🟠)
  const urgentPendencias = pendencias.filter(p => p.priority === 'CRITICAL' || p.priority === 'HIGH')

  // Follow-ups CRM
  const todayFollowups = leads.filter(l => l.next_followup === todayStr)
  const upcomingFollowups = leads.filter(l => l.next_followup > todayStr).slice(0,3)

  // Clientes com potes acabando
  function daysLeft(c: any) {
    if (!c.purchase_date || !c.pots_bought) return null
    const end = new Date(c.purchase_date)
    end.setDate(end.getDate() + c.pots_bought * 30)
    return Math.ceil((end.getTime() - today.getTime()) / (1000*60*60*24))
  }
  const alertClients = clients.filter(c => { const d = daysLeft(c); return d !== null && d <= 10 }).sort((a,b) => (daysLeft(a)||0)-(daysLeft(b)||0))

  function findEstoque(productName: string) {
    if (!productName) return null
    const nome = productName.toLowerCase().trim()
    return estoque.find(e => e.name && e.name.toLowerCase().trim().includes(nome) || nome.includes(e.name?.toLowerCase().trim())) || null
  }

  // Contas a vencer nos próximos 7 dias
  const upcomingBills = bills.filter(b => {
    if (!b.due_date) return false
    return b.due_date >= todayStr && b.due_date <= next7Str
  }).sort((a: any, b: any) => a.due_date.localeCompare(b.due_date)).slice(0,5)

  // Contas atrasadas
  const overdueBills = bills.filter(b => b.due_date && b.due_date < todayStr).sort((a: any, b: any) => a.due_date.localeCompare(b.due_date)).slice(0,5)

  const priorityColor: any = {CRITICAL:'#dc2626',HIGH:'#ea580c',MEDIUM:'#ca8a04',LOW:'#16a34a'}
  const prioLabel: any = {CRITICAL:'🔴 Urgente',HIGH:'🟠 Alta',MEDIUM:'🟡 Média',LOW:'🟢 Depois'}
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

  async function completeTask(id: string) {
    await supabase.from('tasks').update({status:'DONE'}).eq('id', id)
    load()
  }

  async function rescheduleTask(id: string, newDate: string) {
    if (!newDate) return
    await supabase.from('tasks').update({date: newDate}).eq('id', id)
    setRescheduleId(null)
    setRescheduleDate('')
    load()
  }

  function formatDate(dateStr: string) {
    if (dateStr === todayStr) return 'Hoje'
    const d = new Date(dateStr + 'T12:00:00')
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1)
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Amanhã'
    return d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'})
  }

  function isOverdue(dateStr: string) { return dateStr < todayStr }

  const SectionTitle = ({label, color='#888', count}: {label:string, color?:string, count?:number}) => (
    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
      <h2 style={{color,fontSize:'15px',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>{label}</h2>
      {count !== undefined && count > 0 && <span style={{background:`${color}22`,color,fontSize:'12px',padding:'1px 7px',borderRadius:'8px',fontWeight:600}}>{count}</span>}
    </div>
  )

  if (loading) return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <p style={{color:'#444'}}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />
      <div style={{flex:1,padding:'36px 40px',overflowY:'auto',minWidth:0}}>
        <div style={{maxWidth:'960px',margin:'0 auto'}}>

          {/* Cabeçalho */}
          <div style={{marginBottom:'28px'}}>
            <h1 style={{color:'#111',fontSize:'24px',fontWeight:700,letterSpacing:'-0.3px'}}>Dashboard</h1>
            <p style={{color:'#444',fontSize:'15px',marginTop:'5px'}}>{dias[today.getDay()]}, {today.getDate()} de {meses[today.getMonth()]} de {today.getFullYear()}</p>
          </div>

          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'28px'}}>
            <div style={{background:'#7c3aed',borderRadius:'14px',padding:'18px',boxShadow:'0 4px 12px rgba(124,58,237,0.3)'}}>
              <p style={{color:'#fff',fontSize:'13px',fontWeight:700,letterSpacing:'0.8px',textTransform:'uppercase',marginBottom:'8px',opacity:0.9}}>📋 HOJE</p>
              <p style={{color:'#fff',fontSize:'32px',fontWeight:800,lineHeight:1}}>{todayTasks.length}</p>
              {doneTasks.length > 0 && <p style={{color:'#c4f0d5',fontSize:'13px',marginTop:'6px',fontWeight:600}}>✓ {doneTasks.length} feita{doneTasks.length>1?'s':''}</p>}
            </div>
            <div style={{background:overdueTasks.length>0?'#dc2626':'#e0e0e0',borderRadius:'14px',padding:'18px',boxShadow:overdueTasks.length>0?'0 4px 12px rgba(220,38,38,0.3)':'none'}}>
              <p style={{color:overdueTasks.length>0?'#fff':'#666',fontSize:'13px',fontWeight:700,letterSpacing:'0.8px',textTransform:'uppercase',marginBottom:'8px',opacity:0.9}}>⚠️ ATRASADAS</p>
              <p style={{color:overdueTasks.length>0?'#fff':'#999',fontSize:'32px',fontWeight:800,lineHeight:1}}>{overdueTasks.length}</p>
            </div>
            <div style={{background:urgentPendencias.length>0?'#ea580c':'#e0e0e0',borderRadius:'14px',padding:'18px',boxShadow:urgentPendencias.length>0?'0 4px 12px rgba(234,88,12,0.3)':'none'}}>
              <p style={{color:urgentPendencias.length>0?'#fff':'#666',fontSize:'13px',fontWeight:700,letterSpacing:'0.8px',textTransform:'uppercase',marginBottom:'8px',opacity:0.9}}>🔥 PENDÊNCIAS</p>
              <p style={{color:urgentPendencias.length>0?'#fff':'#999',fontSize:'32px',fontWeight:800,lineHeight:1}}>{urgentPendencias.length}</p>
            </div>
            <div style={{background:todayFollowups.length>0?'#16a34a':'#e0e0e0',borderRadius:'14px',padding:'18px',boxShadow:todayFollowups.length>0?'0 4px 12px rgba(22,163,74,0.3)':'none'}}>
              <p style={{color:todayFollowups.length>0?'#fff':'#666',fontSize:'13px',fontWeight:700,letterSpacing:'0.8px',textTransform:'uppercase',marginBottom:'8px',opacity:0.9}}>👥 FOLLOW-UPS</p>
              <p style={{color:todayFollowups.length>0?'#fff':'#999',fontSize:'32px',fontWeight:800,lineHeight:1}}>{todayFollowups.length}</p>
            </div>
          </div>

          {/* Próximos Eventos */}
          {upcomingTasks.length > 0 && (
            <div style={{marginBottom:'24px'}}>
              <SectionTitle label="📌 Próximos Eventos" color="#7c3aed" count={upcomingTasks.length} />
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'12px'}}>
                {upcomingTasks.slice(0,8).map(t => {
                  const d = new Date(t.date + 'T12:00:00')
                  const diasRestantes = Math.ceil((d.getTime() - today.getTime()) / (1000*60*60*24))
                  const diaSemana = dias[d.getDay()]
                  const diaNum = d.getDate()
                  const mesNome = meses[d.getMonth()]
                  const corBorda = priorityColor[t.priority] || '#7c3aed'
                  const isUrgent = t.priority === 'CRITICAL' || t.priority === 'HIGH'
                  return (
                    <div key={t.id} style={{background:'#fff',border:`2px solid ${corBorda}`,borderRadius:'14px',padding:'16px',display:'flex',gap:'14px',alignItems:'flex-start',boxShadow:isUrgent?`0 4px 16px ${corBorda}25`:'0 2px 8px rgba(0,0,0,0.04)'}}>
                      <div style={{width:'56px',height:'56px',borderRadius:'12px',background:corBorda,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{color:'#fff',fontSize:'22px',fontWeight:800,lineHeight:1}}>{diaNum}</span>
                        <span style={{color:'#fff',fontSize:'10px',fontWeight:600,opacity:0.9,textTransform:'uppercase'}}>{mesNome.slice(0,3)}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{color:'#111',fontSize:'15px',fontWeight:700,marginBottom:'4px'}}>{t.title}</p>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                          <span style={{color:'#555',fontSize:'13px',fontWeight:600}}>{diaSemana}</span>
                          {t.time && <span style={{color:'#7c3aed',fontSize:'13px',fontWeight:600}}>{t.time}</span>}
                          <span style={{background:`${corBorda}15`,color:corBorda,fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'6px'}}>
                            {diasRestantes === 1 ? 'Amanhã' : `em ${diasRestantes} dias`}
                          </span>
                        </div>
                        {t.notes && <p style={{color:'#666',fontSize:'12px',marginTop:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.notes}</p>}
                        {t.location && <p style={{color:'#16a34a',fontSize:'12px',marginTop:'2px'}}>📍 {t.location}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
              {upcomingTasks.length > 8 && <p style={{color:'#7c3aed',fontSize:'13px',textAlign:'center',marginTop:'8px'}}>+{upcomingTasks.length-8} eventos · <Link href="/agenda" style={{color:'#5b21b6',textDecoration:'none',fontWeight:600}}>Ver agenda →</Link></p>}
            </div>
          )}

          {/* Alertas discretos */}
          {(alertClients.length > 0 || todayFollowups.length > 0) && (
            <div style={{marginBottom:'20px',background:'#f9f9fb',border:'1px solid #e5e5ea',borderRadius:'10px',padding:'12px 14px'}}>
              <p style={{color:'#888',fontSize:'12px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>Lembretes</p>
              <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                {todayFollowups.map(l => (
                  <div key={l.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 8px',borderRadius:'8px',background:'#fff',border:'1px solid #e5e5ea'}}>
                    <span style={{color:'#7c3aed',fontSize:'13px',fontWeight:600}}>👥</span>
                    <p style={{flex:1,color:'#333',fontSize:'13px'}}>Follow-up: {l.name}</p>
                    {l.whatsapp && <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{color:'#16a34a',fontSize:'12px',textDecoration:'none',fontWeight:600}}>WhatsApp</a>}
                  </div>
                ))}
                {alertClients.map(c => {
                  const d = daysLeft(c)
                  const isOver = d !== null && d <= 0
                  return (
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 8px',borderRadius:'8px',background:'#fff',border:'1px solid #e5e5ea'}}>
                      <span style={{color:isOver?'#dc2626':'#ea580c',fontSize:'13px'}}>📦</span>
                      <p style={{flex:1,color:'#333',fontSize:'13px'}}>{c.name} — {isOver?'potes acabaram':d===0?'acaba hoje':`${d} dias restantes`} ({c.product})</p>
                      {c.whatsapp && <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{color:'#16a34a',fontSize:'12px',textDecoration:'none',fontWeight:600}}>WhatsApp</a>}
                      <Link href="/crm" style={{color:'#5b21b6',fontSize:'12px',textDecoration:'none',fontWeight:600}}>CRM</Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── DUAS COLUNAS: AGENDA | PENDÊNCIAS ── */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'24px'}}>

            {/* ══ COLUNA ESQUERDA — AGENDA ══ */}
            <div style={{display:'flex',flexDirection:'column',gap:'20px',maxHeight:'75vh',overflowY:'auto'}}>

              {/* Follow-ups CRM — no topo */}
              {(todayFollowups.length > 0 || upcomingFollowups.length > 0) && (
              <div>
                <SectionTitle label="👥 Follow-ups CRM" color="#a89ff7" />
                <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                  {[...todayFollowups,...upcomingFollowups].slice(0,5).map(l => (
                    <div key={l.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',borderRadius:'10px',background:'#fff',border:'2px solid #a78bfa'}}>
                      <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#c4b5fd',display:'flex',alignItems:'center',justifyContent:'center',color:'#5b21b6',fontWeight:700,fontSize:'12px',flexShrink:0}}>{l.name.charAt(0).toUpperCase()}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{color:'#111',fontSize:'15px',fontWeight:500}}>{l.name}</p>
                        <p style={{color:'#4c1d95',fontSize:'11px',marginTop:'1px'}}>{l.next_followup===todayStr?'Hoje':formatDate(l.next_followup)}</p>
                      </div>
                      {l.whatsapp && <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{padding:'3px 7px',background:'#fff',border:'2px solid #22c55e',borderRadius:'5px',color:'#16a34a',fontSize:'12px',textDecoration:'none'}}>WA</a>}
                    </div>
                  ))}
                </div>
              </div>
              )}

              <div>
                <SectionTitle label="📅 Agenda — Compromissos" color="#a89ff7" count={allPending.length} />
                {allPending.length === 0
                  ? <p style={{color:'#555',fontSize:'15px'}}>Nenhum compromisso pendente 🎉</p>
                  : <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    {allPending.slice(0,15).map(t => {
                      const overdue = isOverdue(t.date)
                      const isToday = t.date === todayStr
                      return (
                        <div key={t.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'10px',background:overdue?'#fff0f0':isToday?'#f0edff':'#f8f8fa',border:`1px solid ${overdue?'#ffe0e0':isToday?'#d4cdff':'#e8e8ee'}`}}>
                          <div style={{width:'38px',textAlign:'center',flexShrink:0}}>
                            <p style={{color:overdue?'#e05252':isToday?'#a89ff7':'#777',fontSize:'12px',fontWeight:600}}>{formatDate(t.date)}</p>
                            {t.time && <p style={{color:'#444',fontSize:'8px'}}>{t.time}</p>}
                          </div>
                          <div style={{width:'1px',height:'24px',background:overdue?'#ffc8c8':'#e8e8ee',flexShrink:0}}/>
                          <div style={{width:'5px',height:'5px',borderRadius:'50%',background:priorityColor[t.priority]||'#888',flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{color:'#111',fontSize:'15px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                            {t.has_financial && t.amount > 0 && <p style={{color:'#854d0e',fontSize:'11px',marginTop:'1px'}}>R$ {Number(t.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>}
                          </div>
                          {overdue && <span style={{color:'#dc2626',fontSize:'8px',fontWeight:600,flexShrink:0}}>ATRASADO</span>}
                          {rescheduleId === t.id ? (
                            <div style={{display:'flex',alignItems:'center',gap:'3px',flexShrink:0}}>
                              <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} style={{background:'#fff',border:'2px solid #7c3aed',borderRadius:'5px',color:'#111',fontSize:'12px',padding:'2px 4px',outline:'none',colorScheme:'light',width:'110px'}} />
                              <button onClick={() => rescheduleTask(t.id, rescheduleDate)} style={{padding:'3px 6px',background:'#fff',border:'none',borderRadius:'5px',color:'#5b21b6',fontSize:'11px',cursor:'pointer',fontWeight:600}}>OK</button>
                              <button onClick={() => {setRescheduleId(null);setRescheduleDate('')}} style={{padding:'3px 5px',background:'none',border:'none',color:'#444',fontSize:'11px',cursor:'pointer'}}>✕</button>
                            </div>
                          ) : (
                            <button onClick={() => {setRescheduleId(t.id);setRescheduleDate(t.date)}} title="Reagendar" style={{padding:'3px 6px',background:'#fff',border:'none',borderRadius:'5px',color:'#5b21b6',fontSize:'12px',cursor:'pointer',flexShrink:0}}>📅</button>
                          )}
                          <button onClick={(e) => {e.stopPropagation();completeTask(t.id)}} title="Marcar como concluída" style={{padding:'5px 10px',background:'#fff',border:'2px solid #16a34a',borderRadius:'6px',color:'#15803d',fontSize:'15px',cursor:'pointer',flexShrink:0,fontWeight:700}}>✓</button>
                        </div>
                      )
                    })}
                    {allPending.length > 15 && <p style={{color:'#6d28d9',fontSize:'15px',textAlign:'center',marginTop:'4px'}}>+{allPending.length-15} compromissos · <Link href="/agenda" style={{color:'#5b21b6',textDecoration:'none'}}>Ver agenda →</Link></p>}
                  </div>
                }
              </div>

            </div>

            {/* ══ COLUNA DIREITA — PENDÊNCIAS ══ */}
            <div style={{display:'flex',flexDirection:'column',gap:'20px',maxHeight:'75vh',overflowY:'auto'}}>

              {/* Pendências urgentes */}
              <div>
                <SectionTitle label="🔥 Pendências" color="#e08c42" count={pendencias.length} />
                {pendencias.length === 0
                  ? <p style={{color:'#555',fontSize:'15px'}}>Nenhuma pendência ativa 🎉</p>
                  : <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    {pendencias.slice(0,15).map(p => (
                      <div key={p.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'10px',background:p.priority==='CRITICAL'?'#fff0f0':p.priority==='HIGH'?'#fff5eb':'#f8f8fa',border:`1px solid ${p.priority==='CRITICAL'?'#ffe0e0':p.priority==='HIGH'?'#ffe8d0':'#e8e8ee'}`}}>
                        <div style={{width:'5px',height:'5px',borderRadius:'50%',background:priorityColor[p.priority]||'#888',flexShrink:0}}/>
                        <p style={{flex:1,color:'#111',fontSize:'15px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.title}</p>
                        <span style={{color:priorityColor[p.priority]||'#999',fontSize:'8px',fontWeight:600,flexShrink:0}}>{prioLabel[p.priority]||''}</span>
                      </div>
                    ))}
                    {pendencias.length > 15 && <p style={{color:'#9a3412',fontSize:'15px',textAlign:'center',marginTop:'4px'}}>+{pendencias.length-15} · <Link href="/pendencias" style={{color:'#c2410c',textDecoration:'none'}}>Ver todas →</Link></p>}
                  </div>
                }
              </div>

              {/* Contas atrasadas */}
              {overdueBills.length > 0 && (
                <div>
                  <SectionTitle label="💸 Contas atrasadas" color="#e05252" count={overdueBills.length} />
                  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    {overdueBills.map(b => (
                      <div key={b.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'10px',background:'#fff',border:'2px solid #f87171'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#111',fontSize:'15px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</p>
                          <p style={{color:'#b91c1c',fontSize:'11px',marginTop:'1px'}}>Venceu: {new Date(b.due_date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        {b.amount > 0 && <span style={{color:'#dc2626',fontSize:'15px',fontWeight:600}}>R$ {Number(b.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contas a vencer */}
              {upcomingBills.length > 0 && (
                <div>
                  <SectionTitle label="💰 Contas vencendo em breve" color="#d4b84a" count={upcomingBills.length} />
                  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    {upcomingBills.map(b => (
                      <div key={b.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'10px',background:'#fff',border:'2px solid #eab308'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#111',fontSize:'15px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</p>
                          <p style={{color:'#444',fontSize:'11px',marginTop:'1px'}}>{formatDate(b.due_date)}</p>
                        </div>
                        {b.amount > 0 && <span style={{color:'#854d0e',fontSize:'15px',fontWeight:600}}>R$ {Number(b.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

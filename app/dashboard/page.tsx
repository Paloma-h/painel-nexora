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
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    const [t, p, l, c, b] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', USER_ID).neq('type','pendencia').order('date',{ascending:true}),
      supabase.from('tasks').select('*').eq('user_id', USER_ID).eq('type','pendencia').neq('status','DONE').order('created_at',{ascending:false}),
      supabase.from('leads').select('*').eq('user_id', USER_ID).not('next_followup','is',null).order('next_followup',{ascending:true}),
      supabase.from('clients').select('*').eq('user_id', USER_ID),
      supabase.from('bills').select('*').eq('user_id', USER_ID).eq('status','pendente'),
    ])
    setTasks(t.data || [])
    setPendencias(p.data || [])
    setLeads(l.data || [])
    setClients(c.data || [])
    setBills(b.data || [])
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

  // Próximas tarefas (próximos 7 dias)
  const next7 = new Date(today); next7.setDate(today.getDate() + 7)
  const next7Str = next7.toISOString().split('T')[0]
  const upcomingTasks = tasks.filter(t => t.date > todayStr && t.date <= next7Str && t.status !== 'DONE')

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

  // Contas a vencer nos próximos 7 dias
  const upcomingBills = bills.filter(b => {
    if (!b.due_date) return false
    return b.due_date >= todayStr && b.due_date <= next7Str
  }).sort((a: any, b: any) => a.due_date.localeCompare(b.due_date)).slice(0,5)

  // Contas atrasadas
  const overdueBills = bills.filter(b => b.due_date && b.due_date < todayStr).sort((a: any, b: any) => a.due_date.localeCompare(b.due_date)).slice(0,5)

  const priorityColor: any = {CRITICAL:'#e05252',HIGH:'#e08c42',MEDIUM:'#d4b84a',LOW:'#4caf7d'}
  const prioLabel: any = {CRITICAL:'🔴 Urgente',HIGH:'🟠 Alta',MEDIUM:'🟡 Média',LOW:'🟢 Depois'}
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

  async function completeTask(id: string) {
    await supabase.from('tasks').update({status:'DONE'}).eq('id', id)
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

  const SectionTitle = ({label, color='rgba(255,255,255,0.4)', count}: {label:string, color?:string, count?:number}) => (
    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
      <h2 style={{color,fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>{label}</h2>
      {count !== undefined && count > 0 && <span style={{background:`${color}22`,color,fontSize:'10px',padding:'1px 7px',borderRadius:'8px',fontWeight:600}}>{count}</span>}
    </div>
  )

  if (loading) return (
    <div style={{display:'flex',minHeight:'100vh',background:'#08080f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <p style={{color:'rgba(255,255,255,0.3)'}}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#08080f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,padding:'36px 40px',overflowY:'auto',minWidth:0}}>
        <div style={{maxWidth:'960px',margin:'0 auto'}}>

          {/* Cabeçalho */}
          <div style={{marginBottom:'28px'}}>
            <h1 style={{color:'#ffffff',fontSize:'24px',fontWeight:700,letterSpacing:'-0.3px'}}>Dashboard</h1>
            <p style={{color:'rgba(255,255,255,0.35)',fontSize:'13px',marginTop:'5px'}}>{dias[today.getDay()]}, {today.getDate()} de {meses[today.getMonth()]} de {today.getFullYear()}</p>
          </div>

          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'28px'}}>
            <div style={{background:'linear-gradient(135deg,rgba(91,80,214,0.15) 0%,rgba(91,80,214,0.05) 100%)',border:'1px solid rgba(91,80,214,0.25)',borderRadius:'14px',padding:'16px'}}>
              <p style={{color:'rgba(168,159,247,0.7)',fontSize:'10px',fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',marginBottom:'8px'}}>📋 Hoje</p>
              <p style={{color:'#fff',fontSize:'28px',fontWeight:800,lineHeight:1}}>{todayTasks.length}</p>
              {doneTasks.length > 0 && <p style={{color:'rgba(76,175,125,0.8)',fontSize:'10px',marginTop:'4px'}}>✓ {doneTasks.length} feita{doneTasks.length>1?'s':''}</p>}
            </div>
            <div style={{background:overdueTasks.length>0?'linear-gradient(135deg,rgba(224,82,82,0.15) 0%,rgba(224,82,82,0.04) 100%)':'rgba(255,255,255,0.03)',border:`1px solid ${overdueTasks.length>0?'rgba(224,82,82,0.3)':'rgba(255,255,255,0.08)'}`,borderRadius:'14px',padding:'16px'}}>
              <p style={{color:overdueTasks.length>0?'rgba(224,82,82,0.8)':'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',marginBottom:'8px'}}>⚠️ Atrasadas</p>
              <p style={{color:overdueTasks.length>0?'#ff7070':'rgba(255,255,255,0.35)',fontSize:'28px',fontWeight:800,lineHeight:1}}>{overdueTasks.length}</p>
            </div>
            <div style={{background:urgentPendencias.length>0?'linear-gradient(135deg,rgba(224,140,66,0.12) 0%,rgba(224,140,66,0.03) 100%)':'rgba(255,255,255,0.03)',border:`1px solid ${urgentPendencias.length>0?'rgba(224,140,66,0.25)':'rgba(255,255,255,0.08)'}`,borderRadius:'14px',padding:'16px'}}>
              <p style={{color:urgentPendencias.length>0?'rgba(224,140,66,0.8)':'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',marginBottom:'8px'}}>🔥 Pendências</p>
              <p style={{color:urgentPendencias.length>0?'#e08c42':'rgba(255,255,255,0.35)',fontSize:'28px',fontWeight:800,lineHeight:1}}>{urgentPendencias.length}</p>
            </div>
            <div style={{background:todayFollowups.length>0?'linear-gradient(135deg,rgba(76,175,125,0.15) 0%,rgba(76,175,125,0.04) 100%)':'rgba(255,255,255,0.03)',border:`1px solid ${todayFollowups.length>0?'rgba(76,175,125,0.3)':'rgba(255,255,255,0.08)'}`,borderRadius:'14px',padding:'16px'}}>
              <p style={{color:todayFollowups.length>0?'rgba(76,175,125,0.8)':'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',marginBottom:'8px'}}>👥 Follow-ups</p>
              <p style={{color:todayFollowups.length>0?'#5dcc8a':'rgba(255,255,255,0.35)',fontSize:'28px',fontWeight:800,lineHeight:1}}>{todayFollowups.length}</p>
            </div>
          </div>

          {/* Alertas críticos */}
          {(alertClients.length > 0 || todayFollowups.length > 0) && (
            <div style={{marginBottom:'24px',background:'rgba(224,82,82,0.04)',border:'1px solid rgba(224,82,82,0.12)',borderRadius:'14px',padding:'16px'}}>
              <SectionTitle label="⚡ Ação necessária hoje" color="#e05252" />
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {todayFollowups.map(l => (
                  <div key={l.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(91,80,214,0.08)',border:'1px solid rgba(91,80,214,0.15)'}}>
                    <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'rgba(91,80,214,0.25)',display:'flex',alignItems:'center',justifyContent:'center',color:'#a89ff7',fontWeight:700,fontSize:'12px',flexShrink:0}}>{l.name.charAt(0).toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <p style={{color:'#fff',fontSize:'12px',fontWeight:500}}>{l.name}</p>
                      <p style={{color:'rgba(168,159,247,0.6)',fontSize:'10px'}}>Follow-up CRM{l.followup_notes?` · ${l.followup_notes}`:''}</p>
                    </div>
                    {l.whatsapp && <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{padding:'4px 9px',background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.2)',borderRadius:'6px',color:'#25d366',fontSize:'11px',textDecoration:'none',fontWeight:600}}>WhatsApp</a>}
                  </div>
                ))}
                {alertClients.map(c => {
                  const d = daysLeft(c)
                  const isOver = d !== null && d <= 0
                  return (
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:isOver?'rgba(224,82,82,0.08)':'rgba(224,140,66,0.06)',border:`1px solid ${isOver?'rgba(224,82,82,0.2)':'rgba(224,140,66,0.15)'}`}}>
                      <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'rgba(76,175,125,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#4caf7d',fontWeight:700,fontSize:'12px',flexShrink:0}}>{c.name.charAt(0).toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <p style={{color:'#fff',fontSize:'12px',fontWeight:500}}>{c.name}</p>
                        <p style={{color:'rgba(255,255,255,0.3)',fontSize:'10px'}}>{c.product} · {c.pots_bought} potes</p>
                      </div>
                      <span style={{color:isOver?'#e05252':'#e08c42',fontSize:'11px',fontWeight:600}}>{isOver?'Potes acabaram!':d===0?'Acaba hoje':`${d} dias`}</span>
                      {c.whatsapp && <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{padding:'4px 9px',background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.2)',borderRadius:'6px',color:'#25d366',fontSize:'11px',textDecoration:'none',fontWeight:600}}>WhatsApp</a>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── COMPROMISSOS EM ORDEM CRONOLÓGICA ── */}
          <div style={{marginBottom:'24px'}}>
            <SectionTitle label="📅 Compromissos pendentes" color="#a89ff7" count={allPending.length} />
            {allPending.length === 0
              ? <p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px'}}>Nenhum compromisso pendente 🎉</p>
              : <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                {allPending.slice(0,12).map(t => {
                  const overdue = isOverdue(t.date)
                  const isToday = t.date === todayStr
                  return (
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',borderRadius:'10px',background:overdue?'rgba(224,82,82,0.05)':isToday?'rgba(91,80,214,0.08)':'rgba(255,255,255,0.03)',border:`1px solid ${overdue?'rgba(224,82,82,0.12)':isToday?'rgba(91,80,214,0.2)':'rgba(255,255,255,0.06)'}`}}>
                      <div style={{width:'42px',textAlign:'center',flexShrink:0}}>
                        <p style={{color:overdue?'#e05252':isToday?'#a89ff7':'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:600}}>{formatDate(t.date)}</p>
                        {t.time && <p style={{color:'rgba(255,255,255,0.25)',fontSize:'9px'}}>{t.time}</p>}
                      </div>
                      <div style={{width:'1px',height:'28px',background:overdue?'rgba(224,82,82,0.2)':'rgba(255,255,255,0.08)',flexShrink:0}}/>
                      <div style={{width:'6px',height:'6px',borderRadius:'50%',background:priorityColor[t.priority]||'#888',flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{color:overdue?'rgba(255,255,255,0.6)':'#fff',fontSize:'12px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                        {t.has_financial && t.amount > 0 && <p style={{color:'#d4b84a',fontSize:'10px',marginTop:'1px'}}>R$ {Number(t.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>}
                      </div>
                      {overdue && <span style={{color:'#e05252',fontSize:'9px',fontWeight:600,flexShrink:0}}>ATRASADO</span>}
                      <button onClick={() => completeTask(t.id)} style={{padding:'4px 8px',background:'rgba(76,175,125,0.12)',border:'none',borderRadius:'6px',color:'#4caf7d',fontSize:'11px',cursor:'pointer',flexShrink:0}}>✓</button>
                    </div>
                  )
                })}
                {allPending.length > 12 && <p style={{color:'rgba(168,159,247,0.5)',fontSize:'11px',textAlign:'center',marginTop:'4px'}}>+{allPending.length-12} compromissos · <Link href="/agenda" style={{color:'#a89ff7',textDecoration:'none'}}>Ver agenda →</Link></p>}
              </div>
            }
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
            {/* Coluna esquerda */}
            <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

              {/* Pendências urgentes */}
              {urgentPendencias.length > 0 && (
                <div>
                  <SectionTitle label="🔥 Pendências urgentes" color="#e08c42" count={urgentPendencias.length} />
                  <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                    {urgentPendencias.slice(0,6).map(p => (
                      <div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',borderRadius:'10px',background:'rgba(224,140,66,0.05)',border:'1px solid rgba(224,140,66,0.1)'}}>
                        <div style={{width:'6px',height:'6px',borderRadius:'50%',background:priorityColor[p.priority],flexShrink:0}}/>
                        <p style={{flex:1,color:'#fff',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.title}</p>
                        <span style={{color:priorityColor[p.priority],fontSize:'9px',fontWeight:600,flexShrink:0}}>{p.priority==='CRITICAL'?'URGENTE':'ALTA'}</span>
                      </div>
                    ))}
                    {urgentPendencias.length > 6 && <p style={{color:'rgba(224,140,66,0.5)',fontSize:'11px',textAlign:'center'}}>+{urgentPendencias.length-6} · <Link href="/pendencias" style={{color:'#e08c42',textDecoration:'none'}}>Ver todas →</Link></p>}
                  </div>
                </div>
              )}

              {/* Contas atrasadas */}
              {overdueBills.length > 0 && (
                <div>
                  <SectionTitle label="💸 Contas atrasadas" color="#e05252" count={overdueBills.length} />
                  <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                    {overdueBills.map(b => (
                      <div key={b.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',borderRadius:'10px',background:'rgba(224,82,82,0.05)',border:'1px solid rgba(224,82,82,0.1)'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#fff',fontSize:'12px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</p>
                          <p style={{color:'rgba(224,82,82,0.6)',fontSize:'10px',marginTop:'1px'}}>Venceu: {new Date(b.due_date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        {b.amount > 0 && <span style={{color:'#e05252',fontSize:'12px',fontWeight:600}}>R$ {Number(b.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contas a vencer */}
              {upcomingBills.length > 0 && (
                <div>
                  <SectionTitle label="💰 Contas vencendo em breve" color="#d4b84a" count={upcomingBills.length} />
                  <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                    {upcomingBills.map(b => (
                      <div key={b.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',borderRadius:'10px',background:'rgba(212,184,74,0.05)',border:'1px solid rgba(212,184,74,0.12)'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#fff',fontSize:'12px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</p>
                          <p style={{color:'rgba(255,255,255,0.25)',fontSize:'10px',marginTop:'1px'}}>{formatDate(b.due_date)}</p>
                        </div>
                        {b.amount > 0 && <span style={{color:'#d4b84a',fontSize:'12px',fontWeight:600}}>R$ {Number(b.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna direita */}
            <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

              {/* Follow-ups CRM */}
              <div>
                <SectionTitle label="👥 Follow-ups CRM" color="#a89ff7" />
                {upcomingFollowups.length === 0 && todayFollowups.length === 0
                  ? <p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px'}}>Nenhum follow-up agendado</p>
                  : <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                    {[...todayFollowups,...upcomingFollowups].slice(0,5).map(l => (
                      <div key={l.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',borderRadius:'10px',background:'rgba(91,80,214,0.05)',border:'1px solid rgba(91,80,214,0.1)'}}>
                        <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'rgba(91,80,214,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#a89ff7',fontWeight:700,fontSize:'11px',flexShrink:0}}>{l.name.charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#fff',fontSize:'12px',fontWeight:500}}>{l.name}</p>
                          <p style={{color:'rgba(91,80,214,0.7)',fontSize:'10px',marginTop:'1px'}}>{l.next_followup===todayStr?'Hoje':formatDate(l.next_followup)}</p>
                        </div>
                        {l.whatsapp && <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{padding:'4px 8px',background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.2)',borderRadius:'6px',color:'#25d366',fontSize:'11px',textDecoration:'none'}}>WA</a>}
                      </div>
                    ))}
                  </div>
                }
              </div>

              {/* Próximos 7 dias */}
              {upcomingTasks.length > 0 && (
                <div>
                  <SectionTitle label="📆 Próximos 7 dias" count={upcomingTasks.length} />
                  <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                    {upcomingTasks.slice(0,5).map(t => (
                      <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)'}}>
                        <span style={{color:'rgba(255,255,255,0.4)',fontSize:'10px',fontWeight:600,width:'38px',flexShrink:0}}>{formatDate(t.date)}</span>
                        <div style={{width:'5px',height:'5px',borderRadius:'50%',background:priorityColor[t.priority]||'#888',flexShrink:0}}/>
                        <p style={{flex:1,color:'rgba(255,255,255,0.7)',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
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

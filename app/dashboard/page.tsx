'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'



export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [t, l, c, b] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', USER_ID).neq('type','pendencia').order('date',{ascending:true}),
      supabase.from('leads').select('*').eq('user_id', USER_ID).not('next_followup','is',null).order('next_followup',{ascending:true}),
      supabase.from('clients').select('*').eq('user_id', USER_ID),
      supabase.from('bills').select('*').eq('user_id', USER_ID).eq('status','pendente'),
    ])
    setTasks(t.data || [])
    setLeads(l.data || [])
    setClients(c.data || [])
    setBills(b.data || [])
    setLoading(false)
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Tasks
  const todayTasks = tasks.filter(t => t.date === todayStr && t.status !== 'DONE')
  const overdueTasks = tasks.filter(t => t.date && t.date < todayStr && t.status !== 'DONE')
  const doneTasks = tasks.filter(t => t.date === todayStr && t.status === 'DONE')

  // Próximas tarefas (próximos 7 dias, excluindo hoje)
  const next7 = new Date(today); next7.setDate(today.getDate() + 7)
  const next7Str = next7.toISOString().split('T')[0]
  const upcomingTasks = tasks.filter(t => t.date > todayStr && t.date <= next7Str && t.status !== 'DONE')

  // Follow-ups CRM de hoje e próximos
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
    const due = b.due_date
    return due >= todayStr && due <= next7Str
  }).slice(0,5)

  const priorityColor: any = {CRITICAL:'#e05252',HIGH:'#e05252',MEDIUM:'#d4b84a',LOW:'#4caf7d'}
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

  async function completeTask(id: string) {
    await supabase.from('tasks').update({status:'DONE'}).eq('id', id)
    load()
  }

  const Card = ({children, color='transparent'}: any) => (
    <div style={{background:color,border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'16px'}}>{children}</div>
  )

  const SectionTitle = ({label, color='rgba(255,255,255,0.4)'}: any) => (
    <h2 style={{color,fontSize:'11px',fontWeight:600,marginBottom:'10px',textTransform:'uppercase',letterSpacing:'1px'}}>{label}</h2>
  )

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#08080f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,padding:'36px 40px',overflowY:'auto'}}>
        <div style={{maxWidth:'960px',margin:'0 auto'}}>

          {/* Cabeçalho */}
          <div style={{marginBottom:'32px'}}>
            <h1 style={{color:'#ffffff',fontSize:'24px',fontWeight:700,letterSpacing:'-0.3px'}}>Dashboard</h1>
            <p style={{color:'rgba(255,255,255,0.25)',fontSize:'13px',marginTop:'5px'}}>{dias[today.getDay()]}, {today.getDate()} de {meses[today.getMonth()]} de {today.getFullYear()}</p>
          </div>

          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px',marginBottom:'32px'}}>
            {/* Tarefas hoje */}
            <div style={{background:'linear-gradient(135deg,rgba(91,80,214,0.15) 0%,rgba(91,80,214,0.05) 100%)',border:'1px solid rgba(91,80,214,0.25)',borderRadius:'16px',padding:'20px',position:'relative',overflow:'hidden'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                <p style={{color:'rgba(168,159,247,0.7)',fontSize:'11px',fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase'}}>Tarefas hoje</p>
                <div style={{width:'34px',height:'34px',borderRadius:'10px',background:'rgba(91,80,214,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>📋</div>
              </div>
              <p style={{color:'#fff',fontSize:'36px',fontWeight:800,lineHeight:1,marginBottom:'6px'}}>{todayTasks.length}</p>
              {doneTasks.length > 0 && <p style={{color:'rgba(76,175,125,0.8)',fontSize:'12px'}}>✓ {doneTasks.length} concluída{doneTasks.length>1?'s':''}</p>}
            </div>
            {/* Atrasadas */}
            <div style={{background:overdueTasks.length>0?'linear-gradient(135deg,rgba(224,82,82,0.15) 0%,rgba(224,82,82,0.04) 100%)':'linear-gradient(135deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%)',border:`1px solid ${overdueTasks.length>0?'rgba(224,82,82,0.3)':'rgba(255,255,255,0.08)'}`,borderRadius:'16px',padding:'20px',position:'relative',overflow:'hidden'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                <p style={{color:overdueTasks.length>0?'rgba(224,82,82,0.8)':'rgba(255,255,255,0.3)',fontSize:'11px',fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase'}}>Atrasadas</p>
                <div style={{width:'34px',height:'34px',borderRadius:'10px',background:overdueTasks.length>0?'rgba(224,82,82,0.25)':'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>⚠️</div>
              </div>
              <p style={{color:overdueTasks.length>0?'#ff7070':'rgba(255,255,255,0.35)',fontSize:'36px',fontWeight:800,lineHeight:1}}>{overdueTasks.length}</p>
            </div>
            {/* Follow-ups */}
            <div style={{background:todayFollowups.length>0?'linear-gradient(135deg,rgba(76,175,125,0.15) 0%,rgba(76,175,125,0.04) 100%)':'linear-gradient(135deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%)',border:`1px solid ${todayFollowups.length>0?'rgba(76,175,125,0.3)':'rgba(255,255,255,0.08)'}`,borderRadius:'16px',padding:'20px',position:'relative',overflow:'hidden'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                <p style={{color:todayFollowups.length>0?'rgba(76,175,125,0.8)':'rgba(255,255,255,0.3)',fontSize:'11px',fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase'}}>Follow-ups hoje</p>
                <div style={{width:'34px',height:'34px',borderRadius:'10px',background:todayFollowups.length>0?'rgba(76,175,125,0.25)':'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>👥</div>
              </div>
              <p style={{color:todayFollowups.length>0?'#5dcc8a':'rgba(255,255,255,0.35)',fontSize:'36px',fontWeight:800,lineHeight:1}}>{todayFollowups.length}</p>
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

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
            {/* Coluna esquerda */}
            <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

              {/* Tarefas atrasadas */}
              {overdueTasks.length > 0 && (
                <div>
                  <SectionTitle label="Atrasadas" color="#e05252" />
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {overdueTasks.slice(0,4).map(t => (
                      <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(224,82,82,0.05)',border:'1px solid rgba(224,82,82,0.1)'}}>
                        <div style={{width:'7px',height:'7px',borderRadius:'50%',background:priorityColor[t.priority]||'#888',flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#fff',fontSize:'12px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                          <p style={{color:'rgba(255,255,255,0.25)',fontSize:'10px',marginTop:'1px'}}>{new Date(t.date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button onClick={() => completeTask(t.id)} style={{padding:'4px 8px',background:'rgba(76,175,125,0.12)',border:'none',borderRadius:'6px',color:'#4caf7d',fontSize:'11px',cursor:'pointer'}}>✓</button>
                      </div>
                    ))}
                    {overdueTasks.length > 4 && <p style={{color:'rgba(224,82,82,0.5)',fontSize:'11px',textAlign:'center'}}>+{overdueTasks.length-4} tarefas atrasadas</p>}
                  </div>
                </div>
              )}

              {/* Tarefas de hoje */}
              <div>
                <SectionTitle label="Hoje" />
                {todayTasks.length === 0
                  ? <p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px'}}>Nenhuma tarefa para hoje 🎉</p>
                  : <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {todayTasks.map(t => (
                      <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                        <div style={{width:'7px',height:'7px',borderRadius:'50%',background:priorityColor[t.priority]||'#888',flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#fff',fontSize:'12px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                          {t.time && <p style={{color:'rgba(255,255,255,0.25)',fontSize:'10px',marginTop:'1px'}}>{t.time}</p>}
                        </div>
                        <button onClick={() => completeTask(t.id)} style={{padding:'4px 8px',background:'rgba(76,175,125,0.12)',border:'none',borderRadius:'6px',color:'#4caf7d',fontSize:'11px',cursor:'pointer'}}>✓</button>
                      </div>
                    ))}
                  </div>
                }
              </div>

              {/* Próximos 7 dias */}
              {upcomingTasks.length > 0 && (
                <div>
                  <SectionTitle label="Próximos 7 dias" />
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {upcomingTasks.slice(0,4).map(t => (
                      <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)'}}>
                        <div style={{width:'7px',height:'7px',borderRadius:'50%',background:priorityColor[t.priority]||'#888',flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'rgba(255,255,255,0.7)',fontSize:'12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                          <p style={{color:'rgba(255,255,255,0.2)',fontSize:'10px',marginTop:'1px'}}>{new Date(t.date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna direita */}
            <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

              {/* Follow-ups próximos */}
              <div>
                <SectionTitle label="Follow-ups CRM" />
                {upcomingFollowups.length === 0
                  ? <p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px'}}>Nenhum follow-up agendado</p>
                  : <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {upcomingFollowups.map(l => (
                      <div key={l.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(91,80,214,0.05)',border:'1px solid rgba(91,80,214,0.1)'}}>
                        <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'rgba(91,80,214,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#a89ff7',fontWeight:700,fontSize:'12px',flexShrink:0}}>{l.name.charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#fff',fontSize:'12px',fontWeight:500}}>{l.name}</p>
                          <p style={{color:'rgba(91,80,214,0.7)',fontSize:'10px',marginTop:'1px'}}>{new Date(l.next_followup+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        {l.whatsapp && <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{padding:'4px 8px',background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.2)',borderRadius:'6px',color:'#25d366',fontSize:'11px',textDecoration:'none'}}>WA</a>}
                      </div>
                    ))}
                  </div>
                }
              </div>

              {/* Contas a vencer */}
              {upcomingBills.length > 0 && (
                <div>
                  <SectionTitle label="Contas vencendo em breve" color="#d4b84a" />
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {upcomingBills.map(b => (
                      <div key={b.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(212,184,74,0.05)',border:'1px solid rgba(212,184,74,0.12)'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#fff',fontSize:'12px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</p>
                          <p style={{color:'rgba(255,255,255,0.25)',fontSize:'10px',marginTop:'1px'}}>Vence: {new Date(b.due_date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        {b.amount > 0 && <span style={{color:'#d4b84a',fontSize:'12px',fontWeight:600}}>R$ {Number(b.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
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


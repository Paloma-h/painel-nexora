'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'

export default function DashboardPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [pendencias, setPendencias] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [estoque, setEstoque] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quickText, setQuickText] = useState('')
  const [showAgenda, setShowAgenda] = useState(false)
  const [showPendencias, setShowPendencias] = useState(false)
  const [showContas, setShowContas] = useState(false)

  useEffect(() => { load() }, [])

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
  const fmtD = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const todayStr = fmtD(today)
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  const priorityColor: any = {CRITICAL:'#dc2626',HIGH:'#ea580c',MEDIUM:'#ca8a04',LOW:'#16a34a'}

  // === DADOS ===
  const todayTasks = tasks.filter(t => t.date === todayStr && t.status !== 'DONE')
  const overdueTasks = tasks.filter(t => t.date && t.date < todayStr && t.status !== 'DONE').sort((a,b) => a.date.localeCompare(b.date))
  const doneTasks = tasks.filter(t => t.date === todayStr && t.status === 'DONE')

  // Foco do dia: todas de hoje + atrasadas urgentes
  const focusTasks = [...todayTasks, ...overdueTasks.filter(t=>t.priority==='CRITICAL'||t.priority==='HIGH')]

  // Próximos 14 dias
  const next14 = new Date(today); next14.setDate(today.getDate() + 14)
  const upcomingTasks = tasks.filter(t => t.date > todayStr && t.date <= fmtD(next14) && t.status !== 'DONE').sort((a,b) => a.date.localeCompare(b.date))

  // Todos pendentes
  const allPending = tasks.filter(t => t.status !== 'DONE' && t.date).sort((a,b) => a.date.localeCompare(b.date))

  // Pendências urgentes
  const urgentPendencias = pendencias.filter(p => p.priority === 'CRITICAL' || p.priority === 'HIGH')

  // Follow-ups
  const todayFollowups = leads.filter(l => l.next_followup === todayStr)

  // Contas
  const next7 = new Date(today); next7.setDate(today.getDate() + 7)
  const overdueBills = bills.filter(b => b.due_date && b.due_date < todayStr).slice(0,5)
  const upcomingBills = bills.filter(b => b.due_date && b.due_date >= todayStr && b.due_date <= fmtD(next7)).slice(0,5)

  // Clientes com potes acabando
  function daysLeft(c: any) {
    if (!c.purchase_date || !c.pots_bought) return null
    const end = new Date(c.purchase_date)
    end.setDate(end.getDate() + c.pots_bought * 30)
    return Math.ceil((end.getTime() - today.getTime()) / (1000*60*60*24))
  }
  const alertClients = clients.filter(c => { const d = daysLeft(c); return d !== null && d <= 10 }).sort((a,b) => (daysLeft(a)||0)-(daysLeft(b)||0))

  // === AÇÕES ===
  async function completeTask(id: string) {
    await supabase.from('tasks').update({status:'DONE'}).eq('id', id)
    load()
  }

  async function quickCapture() {
    if (!quickText.trim()) return
    const data = {id:crypto.randomUUID(),title:quickText.trim(),date:todayStr,priority:'MEDIUM',type:'task',status:'PENDING',user_id:USER_ID}
    await supabase.from('tasks').insert(data)
    setQuickText('')
    load()
  }

  function formatDate(dateStr: string) {
    if (dateStr === todayStr) return 'Hoje'
    const d = new Date(dateStr + 'T12:00:00')
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1)
    if (dateStr === fmtD(tomorrow)) return 'Amanhã'
    const dSemana = dias[d.getDay()]
    return `${dSemana.slice(0,3)} ${d.getDate()}/${d.getMonth()+1}`
  }

  // === ESTILOS ===
  const card = {background:'#fff',borderRadius:'12px',padding:'20px',border:'1px solid #e8e8ee'}
  const toggleBtn = (active:boolean) => ({padding:'8px 16px',borderRadius:'8px',border:'1px solid #e5e5ea',background:active?'#7c3aed':'#fff',color:active?'#fff':'#555',fontSize:'13px',fontWeight:600 as const,cursor:'pointer'})

  if (loading) return (
    <div style={{display:'flex',minHeight:'100vh',background:'#fafafa'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <p style={{color:'#888',fontSize:'16px'}}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#fafafa'}}>
      <Sidebar />
      <div style={{flex:1,padding:'16px 36px',overflowY:'auto',minWidth:0}}>
        <div style={{maxWidth:'900px',margin:'0 auto'}}>

          {/* ━━━ CABEÇALHO ━━━ */}
          <div style={{marginBottom:'12px',display:'flex',alignItems:'baseline',gap:'12px'}}>
            <span style={{color:'#555',fontSize:'13px',fontWeight:600}}>
              Bom {today.getHours()<12?'dia':today.getHours()<18?'tarde':'noite'}, Paloma
            </span>
            <span style={{color:'#aaa',fontSize:'11px'}}>{dias[today.getDay()]}, {today.getDate()} de {meses[today.getMonth()]}</span>
          </div>

          {/* ━━━ QUICK CAPTURE ━━━ */}
          <div style={{marginBottom:'16px',background:'#fff',borderRadius:'10px',padding:'2px',border:'2px solid #e5e5ea',display:'flex',alignItems:'center',gap:'6px'}}>
            <span style={{padding:'6px 10px',color:'#bbb',fontSize:'14px',flexShrink:0}}>+</span>
            <input
              value={quickText}
              onChange={e=>setQuickText(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')quickCapture()}}
              placeholder="Adicionar tarefa rápida... (Enter para salvar)"
              style={{flex:1,border:'none',outline:'none',fontSize:'13px',color:'#111',background:'transparent',padding:'8px 0'}}
            />
            {quickText.trim() && (
              <button onClick={quickCapture} style={{marginRight:'6px',padding:'4px 12px',background:'#7c3aed',border:'none',borderRadius:'6px',color:'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
                Salvar
              </button>
            )}
          </div>

          {/* ━━━ PRÓXIMOS EVENTOS ━━━ */}
          {upcomingTasks.length > 0 && (
            <div style={{marginBottom:'12px',background:'#f0f4ff',borderRadius:'10px',padding:'12px',border:'1px solid #c7d2fe'}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}>
                <h2 style={{color:'#3b3b8f',fontSize:'14px',fontWeight:800}}>📅 Próximos Eventos</h2>
                <span style={{color:'#6366f1',fontSize:'12px',fontWeight:600}}>{upcomingTasks.length} nos próximos 14 dias</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'6px'}}>
                {upcomingTasks.slice(0,6).map(t => {
                  const d = new Date(t.date + 'T12:00:00')
                  const diasRest = Math.ceil((d.getTime() - today.getTime()) / (1000*60*60*24))
                  const cor = priorityColor[t.priority] || '#7c3aed'
                  return (
                    <div key={t.id} style={{...card,display:'flex',gap:'8px',alignItems:'center',padding:'8px 10px'}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'8px',background:cor,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{color:'#fff',fontSize:'15px',fontWeight:800,lineHeight:1}}>{d.getDate()}</span>
                        <span style={{color:'#fff',fontSize:'7px',fontWeight:600,textTransform:'uppercase'}}>{meses[d.getMonth()].slice(0,3)}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{color:'#111',fontSize:'12px',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                        <p style={{color:'#888',fontSize:'10px',marginTop:'1px'}}>
                          {dias[d.getDay()]} {t.time ? `· ${t.time}` : ''} · <span style={{color:cor,fontWeight:700}}>{diasRest === 1 ? 'Amanhã' : `${diasRest}d`}</span>
                        </p>
                      </div>
                      <button onClick={()=>completeTask(t.id)} title="Concluir" style={{width:'22px',height:'22px',borderRadius:'50%',border:`2px solid ${cor}`,background:'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:cor,fontSize:'10px',fontWeight:700}}>✓</button>
                    </div>
                  )
                })}
              </div>
              {upcomingTasks.length > 6 && (
                <Link href="/agenda" style={{display:'block',textAlign:'center',color:'#7c3aed',fontSize:'13px',fontWeight:600,marginTop:'10px',textDecoration:'none'}}>
                  Ver todos os {upcomingTasks.length} eventos →
                </Link>
              )}
            </div>
          )}

          {/* ━━━ FOCO DO DIA ━━━ */}
          {focusTasks.length > 0 && (() => {
            const periodoConfig = [
              {label:'☀️ Manhã',bg:'#fef2f2',border:'#fca5a5',titleColor:'#991b1b',cardBorder:'#ef4444',range:[0,12]},
              {label:'🌤️ Tarde',bg:'#fefce8',border:'#fde68a',titleColor:'#854d0e',cardBorder:'#eab308',range:[12,18]},
              {label:'🌙 Noite',bg:'#eef2ff',border:'#a5b4fc',titleColor:'#3730a3',cardBorder:'#6366f1',range:[18,24]},
            ]
            function getHour(time:string|null) { if (!time) return -1; const h=parseInt(time.split(':')[0]); return isNaN(h)?-1:h }
            function getPeriodo(time:string|null) { const h=getHour(time); if(h<0) return -1; if(h<12) return 0; if(h<18) return 1; return 2 }
            const prioOrder:any = {CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3}
            const sortByPrio = (a:any,b:any) => (prioOrder[a.priority]??9)-(prioOrder[b.priority]??9) || (a.time||'99:99').localeCompare(b.time||'99:99')

            const manha = focusTasks.filter(t=>getPeriodo(t.time)===0).sort(sortByPrio)
            const tarde = focusTasks.filter(t=>getPeriodo(t.time)===1).sort(sortByPrio)
            const noite = focusTasks.filter(t=>getPeriodo(t.time)===2).sort(sortByPrio)
            const semHora = focusTasks.filter(t=>getPeriodo(t.time)===-1).sort(sortByPrio)
            const groups = [[manha,0],[tarde,1],[noite,2]] as [any[],number][]

            return (
            <div style={{marginBottom:'12px',background:'#fef9ee',borderRadius:'10px',padding:'12px',border:'1px solid #fde68a'}}>
              <h2 style={{color:'#92400e',fontSize:'14px',fontWeight:800,marginBottom:'8px'}}>🎯 Foco do Dia <span style={{color:'#b45309',fontSize:'12px',fontWeight:600}}>{focusTasks.length} tarefa{focusTasks.length>1?'s':''}</span></h2>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {groups.filter(([arr])=>arr.length>0).map(([arr,idx]) => {
                  const cfg = periodoConfig[idx]
                  return (
                    <div key={idx} style={{background:cfg.bg,borderRadius:'8px',padding:'8px 10px',border:`1px solid ${cfg.border}`}}>
                      <p style={{color:cfg.titleColor,fontSize:'11px',fontWeight:800,marginBottom:'4px',letterSpacing:'0.5px'}}>{cfg.label}</p>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'4px'}}>
                        {arr.map((t:any) => {
                          const isOverdue = t.date < todayStr
                          return (
                            <div key={t.id} style={{background:'#fff',borderRadius:'6px',padding:'6px 8px',borderLeft:`4px solid ${cfg.cardBorder}`,display:'flex',alignItems:'center',gap:'6px'}}>
                              <button onClick={()=>completeTask(t.id)} style={{width:'18px',height:'18px',borderRadius:'50%',border:`2px solid ${cfg.cardBorder}`,background:'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:cfg.cardBorder,fontSize:'9px',fontWeight:700}}>✓</button>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{color:'#111',fontSize:'12px',fontWeight:700,lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                                {t.time && <span style={{color:cfg.titleColor,fontSize:'10px',fontWeight:600}}>{t.time}</span>}
                              </div>
                              {isOverdue && <span style={{background:'#dc2626',color:'#fff',fontSize:'8px',fontWeight:700,padding:'1px 4px',borderRadius:'3px'}}>!</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {semHora.length > 0 && (
                  <div style={{background:'#f5f5f5',borderRadius:'8px',padding:'8px 10px',border:'1px solid #d4d4d4'}}>
                    <p style={{color:'#555',fontSize:'11px',fontWeight:800,marginBottom:'4px',letterSpacing:'0.5px'}}>📋 Sem horário</p>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'4px'}}>
                      {semHora.map((t:any) => {
                        const cor = priorityColor[t.priority] || '#7c3aed'
                        const isOverdue = t.date < todayStr
                        return (
                          <div key={t.id} style={{background:'#fff',borderRadius:'6px',padding:'6px 8px',borderLeft:`4px solid ${cor}`,display:'flex',alignItems:'center',gap:'6px'}}>
                            <button onClick={()=>completeTask(t.id)} style={{width:'18px',height:'18px',borderRadius:'50%',border:`2px solid ${cor}`,background:'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:cor,fontSize:'9px',fontWeight:700}}>✓</button>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{color:'#111',fontSize:'12px',fontWeight:700,lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                            </div>
                            {isOverdue && <span style={{background:'#dc2626',color:'#fff',fontSize:'8px',fontWeight:700,padding:'1px 4px',borderRadius:'3px'}}>!</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            )
          })()}

          {/* ━━━ LEMBRETES ━━━ */}
          {(alertClients.length > 0 || todayFollowups.length > 0) && (
            <div style={{marginBottom:'16px',background:'#fdf2f8',borderRadius:'12px',padding:'16px',border:'1px solid #f9a8d4'}}>
              <h2 style={{color:'#9d174d',fontSize:'15px',fontWeight:800,marginBottom:'8px'}}>📌 Lembretes</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                {todayFollowups.map(l => (
                  <div key={l.id} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{fontSize:'13px'}}>👥</span>
                    <p style={{flex:1,color:'#333',fontSize:'13px',fontWeight:500}}>Follow-up: {l.name}</p>
                    {l.whatsapp && <a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{color:'#16a34a',fontSize:'12px',textDecoration:'none',fontWeight:600}}>WA</a>}
                  </div>
                ))}
                {alertClients.map(c => {
                  const d = daysLeft(c)
                  const isOver = d !== null && d <= 0
                  return (
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'13px'}}>📦</span>
                      <p style={{flex:1,color:'#333',fontSize:'13px'}}>{c.name} — {isOver?'potes acabaram':`${d}d restantes`}</p>
                      {c.whatsapp && <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{color:'#16a34a',fontSize:'12px',textDecoration:'none',fontWeight:600}}>WA</a>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ━━━ RESUMO RÁPIDO (KPIs compactos) ━━━ */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'18px'}}>
            {[
              {emoji:'📋',label:'Hoje',value:todayTasks.length,done:doneTasks.length,color:'#7c3aed'},
              {emoji:'⚠️',label:'Atrasadas',value:overdueTasks.length,color:'#dc2626'},
              {emoji:'🔥',label:'Pendências',value:urgentPendencias.length,color:'#ea580c'},
              {emoji:'💰',label:'Contas',value:overdueBills.length+upcomingBills.length,color:'#ca8a04'},
            ].map((k,i) => (
              <div key={i} style={{...card,textAlign:'center',padding:'16px',borderTop:`3px solid ${k.value>0?k.color:'#e5e5ea'}`}}>
                <p style={{fontSize:'18px',marginBottom:'4px'}}>{k.emoji}</p>
                <p style={{color:k.value>0?k.color:'#ccc',fontSize:'28px',fontWeight:800,lineHeight:1}}>{k.value}</p>
                <p style={{color:'#888',fontSize:'12px',marginTop:'4px',fontWeight:600}}>{k.label}</p>
                {k.done !== undefined && k.done > 0 && <p style={{color:'#16a34a',fontSize:'11px',marginTop:'2px'}}>✓ {k.done} feita{k.done>1?'s':''}</p>}
              </div>
            ))}
          </div>

          {/* ━━━ BLOCOS COLAPSÁVEIS ━━━ */}
          <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'28px'}}>

            {/* Toggle: Agenda completa */}
            <div style={card}>
              <button onClick={()=>setShowAgenda(!showAgenda)} style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',background:'none',border:'none',cursor:'pointer',padding:0}}>
                <span style={{fontSize:'16px'}}>📅</span>
                <span style={{flex:1,textAlign:'left',color:'#111',fontSize:'15px',fontWeight:700}}>Agenda Completa</span>
                <span style={{color:'#888',fontSize:'13px',marginRight:'8px'}}>{allPending.length} compromissos</span>
                <span style={{color:'#888',fontSize:'12px',transition:'transform 0.2s',transform:showAgenda?'rotate(180deg)':'rotate(0)'}}>▼</span>
              </button>
              {showAgenda && (
                <div style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'4px',maxHeight:'400px',overflowY:'auto'}}>
                  {allPending.slice(0,20).map(t => {
                    const overdue = t.date < todayStr
                    return (
                      <div key={t.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'8px',background:overdue?'#fef2f2':'#fff',border:`1px solid ${overdue?'#fecaca':'#f0f0f0'}`}}>
                        <span style={{color:overdue?'#dc2626':'#888',fontSize:'12px',fontWeight:600,width:'50px',flexShrink:0}}>{formatDate(t.date)}</span>
                        <div style={{width:'6px',height:'6px',borderRadius:'50%',background:priorityColor[t.priority]||'#ccc',flexShrink:0}}/>
                        <p style={{flex:1,color:'#111',fontSize:'14px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                        <button onClick={()=>completeTask(t.id)} style={{padding:'4px 10px',background:'#fff',border:'1px solid #16a34a',borderRadius:'6px',color:'#16a34a',fontSize:'12px',cursor:'pointer',fontWeight:700,flexShrink:0}}>✓</button>
                      </div>
                    )
                  })}
                  {allPending.length > 20 && <Link href="/agenda" style={{textAlign:'center',color:'#7c3aed',fontSize:'13px',marginTop:'6px',textDecoration:'none',fontWeight:600}}>Ver todos →</Link>}
                </div>
              )}
            </div>

            {/* Toggle: Pendências */}
            <div style={card}>
              <button onClick={()=>setShowPendencias(!showPendencias)} style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',background:'none',border:'none',cursor:'pointer',padding:0}}>
                <span style={{fontSize:'16px'}}>🔥</span>
                <span style={{flex:1,textAlign:'left',color:'#111',fontSize:'15px',fontWeight:700}}>Pendências</span>
                <span style={{color:urgentPendencias.length>0?'#ea580c':'#888',fontSize:'13px',marginRight:'8px'}}>{pendencias.length} ativas</span>
                <span style={{color:'#888',fontSize:'12px',transition:'transform 0.2s',transform:showPendencias?'rotate(180deg)':'rotate(0)'}}>▼</span>
              </button>
              {showPendencias && (
                <div style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'4px',maxHeight:'400px',overflowY:'auto'}}>
                  {pendencias.slice(0,20).map(p => (
                    <div key={p.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'8px',background:'#fff',border:'1px solid #f0f0f0'}}>
                      <div style={{width:'6px',height:'6px',borderRadius:'50%',background:priorityColor[p.priority]||'#ccc',flexShrink:0}}/>
                      <p style={{flex:1,color:'#111',fontSize:'14px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.title}</p>
                      <span style={{color:priorityColor[p.priority],fontSize:'11px',fontWeight:600}}>{p.priority==='CRITICAL'?'🔴':p.priority==='HIGH'?'🟠':p.priority==='MEDIUM'?'🟡':'🟢'}</span>
                    </div>
                  ))}
                  {pendencias.length > 20 && <Link href="/pendencias" style={{textAlign:'center',color:'#ea580c',fontSize:'13px',marginTop:'6px',textDecoration:'none',fontWeight:600}}>Ver todas →</Link>}
                </div>
              )}
            </div>

            {/* Toggle: Contas */}
            {(overdueBills.length > 0 || upcomingBills.length > 0) && (
              <div style={card}>
                <button onClick={()=>setShowContas(!showContas)} style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',background:'none',border:'none',cursor:'pointer',padding:0}}>
                  <span style={{fontSize:'16px'}}>💰</span>
                  <span style={{flex:1,textAlign:'left',color:'#111',fontSize:'15px',fontWeight:700}}>Contas</span>
                  <span style={{color:overdueBills.length>0?'#dc2626':'#888',fontSize:'13px',marginRight:'8px'}}>{overdueBills.length} atrasada{overdueBills.length!==1?'s':''}</span>
                  <span style={{color:'#888',fontSize:'12px',transition:'transform 0.2s',transform:showContas?'rotate(180deg)':'rotate(0)'}}>▼</span>
                </button>
                {showContas && (
                  <div style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'4px'}}>
                    {overdueBills.map(b => (
                      <div key={b.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'8px',background:'#fef2f2',border:'1px solid #fecaca'}}>
                        <span style={{fontSize:'12px'}}>🔴</span>
                        <p style={{flex:1,color:'#111',fontSize:'14px'}}>{b.title || b.name || 'Sem nome'}</p>
                        {b.amount > 0 && <span style={{color:'#dc2626',fontSize:'14px',fontWeight:700}}>R$ {Number(b.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
                      </div>
                    ))}
                    {upcomingBills.map(b => (
                      <div key={b.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'8px',background:'#fff',border:'1px solid #f0f0f0'}}>
                        <span style={{fontSize:'12px'}}>🟡</span>
                        <p style={{flex:1,color:'#111',fontSize:'14px'}}>{b.title || b.name || 'Sem nome'} · {formatDate(b.due_date)}</p>
                        {b.amount > 0 && <span style={{color:'#854d0e',fontSize:'14px',fontWeight:700}}>R$ {Number(b.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}

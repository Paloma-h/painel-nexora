'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

const USER_ID = 'paloma'

function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  async function logout() { await supabase.auth.signOut(); router.push('/login') }
  return (
    <div style={{width:'160px',background:'#0d0d1a',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',padding:'20px 12px',flexShrink:0,minHeight:'100vh'}}>
      <div style={{color:'#7c6ff7',fontWeight:700,fontSize:'16px',marginBottom:'28px',padding:'0 4px'}}>NEXORA</div>
      <Link href="/dashboard" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/dashboard'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/dashboard'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/dashboard'?500:400}}>Dashboard</Link>
      <Link href="/agenda" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/agenda'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/agenda'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/agenda'?500:400}}>Agenda</Link>
      <Link href="/crm" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/crm'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/crm'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/crm'?500:400}}>CRM</Link>
      <Link href="/financeiro" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/financeiro'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/financeiro'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/financeiro'?500:400}}>Financeiro</Link>
      <div style={{marginTop:'auto'}}>
        <button onClick={logout} style={{display:'block',width:'100%',padding:'9px 12px',borderRadius:'10px',fontSize:'12px',color:'rgba(255,255,255,0.2)',background:'transparent',border:'none',textAlign:'left',cursor:'pointer'}}>Sair</button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [t, l, tr] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', USER_ID).neq('type','pendencia').order('date',{ascending:true}),
      supabase.from('leads').select('*').eq('user_id', USER_ID).not('next_followup','is',null).order('next_followup',{ascending:true}),
      supabase.from('transactions').select('*').eq('user_id', USER_ID)
    ])
    setTasks(t.data || [])
    setLeads(l.data || [])
    setTransactions(tr.data || [])
    setLoading(false)
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  const todayTasks = tasks.filter(t => t.date === todayStr && t.status !== 'DONE')
  const overdueTasks = tasks.filter(t => t.date && t.date < todayStr && t.status !== 'DONE')
  const urgentTasks = tasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'DONE')
  const doneTasks = tasks.filter(t => t.date === todayStr && t.status === 'DONE')
  const upcomingLeads = leads.filter(l => l.next_followup >= todayStr).slice(0,3)
  
  const receitas = transactions.filter(t => t.type==='receita').reduce((s,t) => s+Number(t.amount), 0)
  const despesas = transactions.filter(t => t.type==='despesa').reduce((s,t) => s+Number(t.amount), 0)
  const saldo = receitas - despesas

  const priorityColor: any = {CRITICAL:'#e05252',HIGH:'#e08c42',MEDIUM:'#d4b84a',LOW:'#4caf7d'}
  const priorityLabel: any = {CRITICAL:'Crítica',HIGH:'Alta',MEDIUM:'Média',LOW:'Baixa'}

  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

  async function completeTask(id: string) {
    await supabase.from('tasks').update({status:'DONE'}).eq('id', id)
    load()
  }

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,padding:'32px',overflowY:'auto'}}>
        <div style={{maxWidth:'900px',margin:'0 auto'}}>
          
          <div style={{marginBottom:'28px'}}>
            <h1 style={{color:'#fff',fontSize:'22px',fontWeight:700}}>Dashboard</h1>
            <p style={{color:'rgba(255,255,255,0.3)',fontSize:'13px',marginTop:'4px'}}>{dias[today.getDay()]}, {today.getDate()} de {meses[today.getMonth()]} de {today.getFullYear()}</p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'28px'}}>
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'16px'}}>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',marginBottom:'6px'}}>Tarefas hoje</p>
              <p style={{color:'#fff',fontSize:'24px',fontWeight:700}}>{todayTasks.length}</p>
            </div>
            <div style={{background:'rgba(224,82,82,0.06)',border:'1px solid rgba(224,82,82,0.12)',borderRadius:'12px',padding:'16px'}}>
              <p style={{color:'rgba(224,82,82,0.6)',fontSize:'11px',marginBottom:'6px'}}>Atrasadas</p>
              <p style={{color:'#e05252',fontSize:'24px',fontWeight:700}}>{overdueTasks.length}</p>
            </div>
            <div style={{background:'rgba(76,175,125,0.06)',border:'1px solid rgba(76,175,125,0.12)',borderRadius:'12px',padding:'16px'}}>
              <p style={{color:'rgba(76,175,125,0.6)',fontSize:'11px',marginBottom:'6px'}}>Concluídas hoje</p>
              <p style={{color:'#4caf7d',fontSize:'24px',fontWeight:700}}>{doneTasks.length}</p>
            </div>
            <div style={{background:saldo>=0?'rgba(91,80,214,0.06)':'rgba(224,82,82,0.06)',border:`1px solid ${saldo>=0?'rgba(91,80,214,0.12)':'rgba(224,82,82,0.12)'}`,borderRadius:'12px',padding:'16px'}}>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:'11px',marginBottom:'6px'}}>Saldo</p>
              <p style={{color:saldo>=0?'#a89ff7':'#e05252',fontSize:'18px',fontWeight:700}}>R$ {saldo.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
            <div>
              {overdueTasks.length > 0 && (
                <div style={{marginBottom:'20px'}}>
                  <h2 style={{color:'#e05252',fontSize:'13px',fontWeight:600,marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Atrasadas</h2>
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {overdueTasks.slice(0,3).map(t => (
                      <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(224,82,82,0.05)',border:'1px solid rgba(224,82,82,0.12)'}}>
                        <div style={{width:'8px',height:'8px',borderRadius:'50%',background:priorityColor[t.priority],flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#fff',fontSize:'12px',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.title}</p>
                          <p style={{color:'rgba(255,255,255,0.25)',fontSize:'10px',marginTop:'1px'}}>{new Date(t.date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button onClick={() => completeTask(t.id)} style={{padding:'4px 8px',background:'rgba(76,175,125,0.12)',border:'none',borderRadius:'6px',color:'#4caf7d',fontSize:'11px',cursor:'pointer'}}>✓</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{marginBottom:'20px'}}>
                <h2 style={{color:'rgba(255,255,255,0.4)',fontSize:'13px',fontWeight:600,marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Hoje</h2>
                {todayTasks.length === 0 ? (
                  <p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px',padding:'12px 0'}}>Nenhuma tarefa para hoje</p>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {todayTasks.map(t => (
                      <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                        <div style={{width:'8px',height:'8px',borderRadius:'50%',background:priorityColor[t.priority],flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#fff',fontSize:'12px',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.title}</p>
                          {t.time && <p style={{color:'rgba(255,255,255,0.25)',fontSize:'10px',marginTop:'1px'}}>{t.time}</p>}
                        </div>
                        <button onClick={() => completeTask(t.id)} style={{padding:'4px 8px',background:'rgba(76,175,125,0.12)',border:'none',borderRadius:'6px',color:'#4caf7d',fontSize:'11px',cursor:'pointer'}}>✓</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={{marginBottom:'20px'}}>
                <h2 style={{color:'rgba(255,255,255,0.4)',fontSize:'13px',fontWeight:600,marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Follow-ups CRM</h2>
                {upcomingLeads.length === 0 ? (
                  <p style={{color:'rgba(255,255,255,0.2)',fontSize:'12px',padding:'12px 0'}}>Nenhum follow-up próximo</p>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {upcomingLeads.map(l => (
                      <div key={l.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(91,80,214,0.05)',border:'1px solid rgba(91,80,214,0.12)'}}>
                        <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'rgba(91,80,214,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#a89ff7',fontWeight:700,fontSize:'12px',flexShrink:0}}>{l.name.charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:'#fff',fontSize:'12px',fontWeight:500}}>{l.name}</p>
                          <p style={{color:'rgba(91,80,214,0.7)',fontSize:'10px',marginTop:'1px'}}>{new Date(l.next_followup+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'6px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.35)'}}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 style={{color:'rgba(255,255,255,0.4)',fontSize:'13px',fontWeight:600,marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Financeiro</h2>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',borderRadius:'10px',background:'rgba(76,175,125,0.05)',border:'1px solid rgba(76,175,125,0.1)'}}>
                    <span style={{color:'rgba(76,175,125,0.7)',fontSize:'12px'}}>Receitas</span>
                    <span style={{color:'#4caf7d',fontSize:'13px',fontWeight:600}}>R$ {receitas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',borderRadius:'10px',background:'rgba(224,82,82,0.05)',border:'1px solid rgba(224,82,82,0.1)'}}>
                    <span style={{color:'rgba(224,82,82,0.7)',fontSize:'12px'}}>Despesas</span>
                    <span style={{color:'#e05252',fontSize:'13px',fontWeight:600}}>R$ {despesas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',borderRadius:'10px',background:saldo>=0?'rgba(91,80,214,0.05)':'rgba(224,82,82,0.05)',border:`1px solid ${saldo>=0?'rgba(91,80,214,0.1)':'rgba(224,82,82,0.1)'}`}}>
                    <span style={{color:'rgba(255,255,255,0.4)',fontSize:'12px'}}>Saldo</span>
                    <span style={{color:saldo>=0?'#a89ff7':'#e05252',fontSize:'13px',fontWeight:600}}>R$ {saldo.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'

export default function ProdutividadePage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [pendencias, setPendencias] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'7d'|'30d'|'90d'>('30d')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [t, p, l, tr] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', USER_ID).neq('type','pendencia'),
      supabase.from('tasks').select('*').eq('user_id', USER_ID).eq('type','pendencia'),
      supabase.from('leads').select('*').eq('user_id', USER_ID),
      supabase.from('transactions').select('*').eq('user_id', USER_ID),
    ])
    setTasks(t.data || [])
    setPendencias(p.data || [])
    setLeads(l.data || [])
    setTransactions(tr.data || [])
    setLoading(false)
  }

  const today = new Date()
  const fmtD = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const todayStr = fmtD(today)

  const diasPeriodo = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
  const inicio = new Date(today)
  inicio.setDate(inicio.getDate() - diasPeriodo)
  const inicioStr = fmtD(inicio)

  // Tarefas no período
  const tarefasPeriodo = tasks.filter(t => t.date && t.date >= inicioStr && t.date <= todayStr)
  const concluidasPeriodo = tarefasPeriodo.filter(t => t.status === 'DONE')
  const pendentesPeriodo = tarefasPeriodo.filter(t => t.status !== 'DONE')
  const taxaConclusao = tarefasPeriodo.length > 0 ? Math.round((concluidasPeriodo.length / tarefasPeriodo.length) * 100) : 0

  // Pendências no período
  const pendConcluidas = pendencias.filter(p => p.status === 'DONE' && p.completed_at && p.completed_at.slice(0,10) >= inicioStr)
  const pendAtivas = pendencias.filter(p => p.status !== 'DONE')

  // === POR CATEGORIA ===
  const categorias: Record<string, {total:number, done:number, icon:string, color:string}> = {}
  const catConfig: Record<string,{icon:string,color:string,label:string}> = {
    'geral': {icon:'📋', color:'#7c3aed', label:'Geral'},
    'saude': {icon:'❤️', color:'#dc2626', label:'Saúde'},
    'financeiro': {icon:'💰', color:'#ca8a04', label:'Financeiro'},
    'trabalho': {icon:'💼', color:'#2563eb', label:'Trabalho'},
    'educacao': {icon:'📚', color:'#059669', label:'Educação'},
    'pessoal': {icon:'🏠', color:'#ea580c', label:'Pessoal'},
    'familia': {icon:'👨‍👩‍👦', color:'#ec4899', label:'Família'},
    'politica': {icon:'🏛️', color:'#991b1b', label:'Política'},
  }
  tarefasPeriodo.forEach(t => {
    const cat = t.category || 'geral'
    if (!categorias[cat]) categorias[cat] = {total:0, done:0, icon: catConfig[cat]?.icon||'📋', color: catConfig[cat]?.color||'#7c3aed'}
    categorias[cat].total++
    if (t.status === 'DONE') categorias[cat].done++
  })

  // === POR PRIORIDADE ===
  const prioLabels: Record<string,{label:string,color:string}> = {
    CRITICAL:{label:'Crítica',color:'#dc2626'},
    HIGH:{label:'Alta',color:'#ea580c'},
    MEDIUM:{label:'Média',color:'#ca8a04'},
    LOW:{label:'Baixa',color:'#16a34a'},
  }
  const porPrioridade: Record<string,{total:number,done:number}> = {}
  tarefasPeriodo.forEach(t => {
    const p = t.priority || 'MEDIUM'
    if (!porPrioridade[p]) porPrioridade[p] = {total:0,done:0}
    porPrioridade[p].total++
    if (t.status === 'DONE') porPrioridade[p].done++
  })

  // === POR DIA (gráfico de barras simples) ===
  const porDia: Record<string,{total:number,done:number}> = {}
  for (let i = Math.min(diasPeriodo, 14); i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    porDia[fmtD(d)] = {total:0, done:0}
  }
  tarefasPeriodo.forEach(t => {
    if (porDia[t.date] !== undefined) {
      porDia[t.date].total++
      if (t.status === 'DONE') porDia[t.date].done++
    }
  })
  const maxDia = Math.max(...Object.values(porDia).map(v => v.total), 1)

  // === PERÍODO DO DIA ===
  function getPeriodo(time:string|null) { if (!time) return 'sem_hora'; const h=parseInt(time.split(':')[0]); if(isNaN(h)) return 'sem_hora'; if(h<12) return 'manha'; if(h<18) return 'tarde'; return 'noite' }
  const porPeriodoDia: Record<string,{total:number,done:number,label:string,icon:string,color:string}> = {
    manha:{total:0,done:0,label:'Manhã',icon:'☀️',color:'#dc2626'},
    tarde:{total:0,done:0,label:'Tarde',icon:'🌤️',color:'#ca8a04'},
    noite:{total:0,done:0,label:'Noite',icon:'🌙',color:'#4338ca'},
    sem_hora:{total:0,done:0,label:'Sem horário',icon:'📋',color:'#888'},
  }
  tarefasPeriodo.forEach(t => {
    const p = getPeriodo(t.time)
    porPeriodoDia[p].total++
    if (t.status === 'DONE') porPeriodoDia[p].done++
  })

  // === STREAK ===
  let streak = 0
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const ds = fmtD(d)
    const dayDone = tasks.filter(t => t.date === ds && t.status === 'DONE').length
    if (dayDone > 0) streak++; else break
  }

  const card = {background:'#fff',borderRadius:'12px',padding:'16px',border:'1px solid #e8e8ee'}

  if (loading) return (
    <div style={{display:'flex',minHeight:'100vh',background:'#fafafa'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <p style={{color:'#888'}}>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#fafafa'}}>
      <Sidebar />
      <div style={{flex:1,padding:'24px 36px',overflowY:'auto',minWidth:0}}>
        <div style={{maxWidth:'900px',margin:'0 auto'}}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
            <div>
              <h1 style={{color:'#111',fontSize:'22px',fontWeight:800}}>📊 Produtividade</h1>
              <p style={{color:'#888',fontSize:'13px',marginTop:'2px'}}>Acompanhe seu desempenho por área</p>
            </div>
            <div style={{display:'flex',gap:'4px'}}>
              {(['7d','30d','90d'] as const).map(p => (
                <button key={p} onClick={()=>setPeriodo(p)} style={{padding:'6px 14px',borderRadius:'8px',border:'1px solid #e5e5ea',background:periodo===p?'#7c3aed':'#fff',color:periodo===p?'#fff':'#555',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>
                  {p==='7d'?'7 dias':p==='30d'?'30 dias':'90 dias'}
                </button>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'16px'}}>
            <div style={{...card,textAlign:'center',borderTop:'3px solid #7c3aed'}}>
              <p style={{color:'#7c3aed',fontSize:'32px',fontWeight:800,lineHeight:1}}>{concluidasPeriodo.length}</p>
              <p style={{color:'#888',fontSize:'12px',fontWeight:600,marginTop:'4px'}}>Concluídas</p>
            </div>
            <div style={{...card,textAlign:'center',borderTop:`3px solid ${taxaConclusao>=70?'#16a34a':taxaConclusao>=40?'#ca8a04':'#dc2626'}`}}>
              <p style={{color:taxaConclusao>=70?'#16a34a':taxaConclusao>=40?'#ca8a04':'#dc2626',fontSize:'32px',fontWeight:800,lineHeight:1}}>{taxaConclusao}%</p>
              <p style={{color:'#888',fontSize:'12px',fontWeight:600,marginTop:'4px'}}>Taxa de Conclusão</p>
            </div>
            <div style={{...card,textAlign:'center',borderTop:'3px solid #ea580c'}}>
              <p style={{color:'#ea580c',fontSize:'32px',fontWeight:800,lineHeight:1}}>{pendentesPeriodo.length}</p>
              <p style={{color:'#888',fontSize:'12px',fontWeight:600,marginTop:'4px'}}>Pendentes</p>
            </div>
            <div style={{...card,textAlign:'center',borderTop:'3px solid #f59e0b'}}>
              <p style={{color:'#f59e0b',fontSize:'32px',fontWeight:800,lineHeight:1}}>{streak}🔥</p>
              <p style={{color:'#888',fontSize:'12px',fontWeight:600,marginTop:'4px'}}>Dias seguidos</p>
            </div>
          </div>

          {/* Gráfico de barras por dia */}
          <div style={{...card,marginBottom:'16px'}}>
            <h2 style={{color:'#111',fontSize:'15px',fontWeight:800,marginBottom:'12px'}}>📈 Atividade Diária</h2>
            <div style={{display:'flex',alignItems:'flex-end',gap:'3px',height:'100px'}}>
              {Object.entries(porDia).map(([date, v]) => {
                const d = new Date(date + 'T12:00:00')
                const pct = v.total > 0 ? (v.done / v.total) * 100 : 0
                return (
                  <div key={date} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
                    <span style={{fontSize:'8px',color:'#888',fontWeight:600}}>{v.done}/{v.total}</span>
                    <div style={{width:'100%',maxWidth:'40px',height:`${Math.max((v.total/maxDia)*80, 4)}px`,borderRadius:'4px 4px 0 0',background:v.total===0?'#f0f0f0':pct===100?'#16a34a':pct>=50?'#7c3aed':'#e5e5ea',position:'relative',overflow:'hidden'}}>
                      {v.total > 0 && pct < 100 && (
                        <div style={{position:'absolute',bottom:0,left:0,right:0,height:`${pct}%`,background:pct>=50?'#16a34a':'#ca8a04',borderRadius:'4px 4px 0 0'}}/>
                      )}
                    </div>
                    <span style={{fontSize:'9px',color:date===todayStr?'#7c3aed':'#bbb',fontWeight:date===todayStr?800:400}}>{d.getDate()}</span>
                  </div>
                )
              })}
            </div>
            <div style={{display:'flex',gap:'16px',marginTop:'8px',justifyContent:'center'}}>
              <span style={{fontSize:'10px',color:'#888',display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'10px',height:'10px',borderRadius:'2px',background:'#16a34a',display:'inline-block'}}/>100% concluído</span>
              <span style={{fontSize:'10px',color:'#888',display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'10px',height:'10px',borderRadius:'2px',background:'#7c3aed',display:'inline-block'}}/>Parcial</span>
              <span style={{fontSize:'10px',color:'#888',display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'10px',height:'10px',borderRadius:'2px',background:'#f0f0f0',display:'inline-block'}}/>Sem tarefas</span>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
            {/* Por Categoria */}
            <div style={{...card}}>
              <h2 style={{color:'#111',fontSize:'15px',fontWeight:800,marginBottom:'12px'}}>🏷️ Por Área</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {Object.entries(categorias).sort((a,b) => b[1].total - a[1].total).map(([cat, v]) => {
                  const cfg = catConfig[cat] || {icon:'📋',color:'#7c3aed',label:cat}
                  const pct = v.total > 0 ? Math.round((v.done/v.total)*100) : 0
                  return (
                    <div key={cat}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                        <span style={{fontSize:'13px',fontWeight:600,color:'#333'}}>{cfg.icon} {cfg.label}</span>
                        <span style={{fontSize:'12px',color:'#888',fontWeight:600}}>{v.done}/{v.total} <span style={{color:pct>=70?'#16a34a':pct>=40?'#ca8a04':'#dc2626',fontWeight:700}}>({pct}%)</span></span>
                      </div>
                      <div style={{height:'8px',background:'#f0f0f0',borderRadius:'4px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:cfg.color,borderRadius:'4px',transition:'width 0.5s'}}/>
                      </div>
                    </div>
                  )
                })}
                {Object.keys(categorias).length === 0 && <p style={{color:'#bbb',fontSize:'13px',textAlign:'center',padding:'20px 0'}}>Sem dados no período</p>}
              </div>
            </div>

            {/* Por Período do Dia */}
            <div style={{...card}}>
              <h2 style={{color:'#111',fontSize:'15px',fontWeight:800,marginBottom:'12px'}}>🕐 Por Período do Dia</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {Object.entries(porPeriodoDia).filter(([,v]) => v.total > 0).map(([key, v]) => {
                  const pct = v.total > 0 ? Math.round((v.done/v.total)*100) : 0
                  return (
                    <div key={key}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                        <span style={{fontSize:'13px',fontWeight:600,color:'#333'}}>{v.icon} {v.label}</span>
                        <span style={{fontSize:'12px',color:'#888',fontWeight:600}}>{v.done}/{v.total} <span style={{color:pct>=70?'#16a34a':pct>=40?'#ca8a04':'#dc2626',fontWeight:700}}>({pct}%)</span></span>
                      </div>
                      <div style={{height:'8px',background:'#f0f0f0',borderRadius:'4px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:v.color,borderRadius:'4px',transition:'width 0.5s'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{marginTop:'16px',borderTop:'1px solid #f0f0f0',paddingTop:'12px'}}>
                <h3 style={{color:'#111',fontSize:'13px',fontWeight:800,marginBottom:'8px'}}>⚡ Por Prioridade</h3>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {['CRITICAL','HIGH','MEDIUM','LOW'].filter(p => porPrioridade[p]).map(p => {
                    const v = porPrioridade[p]
                    const cfg = prioLabels[p]
                    const pct = v.total > 0 ? Math.round((v.done/v.total)*100) : 0
                    return (
                      <div key={p} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{width:'8px',height:'8px',borderRadius:'50%',background:cfg.color,flexShrink:0}}/>
                        <span style={{fontSize:'12px',color:'#555',fontWeight:500,width:'50px'}}>{cfg.label}</span>
                        <div style={{flex:1,height:'6px',background:'#f0f0f0',borderRadius:'3px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct}%`,background:cfg.color,borderRadius:'3px'}}/>
                        </div>
                        <span style={{fontSize:'11px',color:'#888',fontWeight:600,width:'55px',textAlign:'right'}}>{v.done}/{v.total} ({pct}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Resumo CRM + Financeiro */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
            <div style={{...card,borderTop:'3px solid #2563eb'}}>
              <h2 style={{color:'#1e40af',fontSize:'15px',fontWeight:800,marginBottom:'10px'}}>👥 CRM</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'#555',fontSize:'13px'}}>Total de leads</span>
                  <span style={{color:'#2563eb',fontSize:'14px',fontWeight:700}}>{leads.length}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'#555',fontSize:'13px'}}>Follow-ups pendentes</span>
                  <span style={{color:'#ea580c',fontSize:'14px',fontWeight:700}}>{leads.filter(l=>l.next_followup&&l.next_followup<=todayStr).length}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{color:'#555',fontSize:'13px'}}>Leads esta semana</span>
                  <span style={{color:'#16a34a',fontSize:'14px',fontWeight:700}}>{leads.filter(l=>l.created_at&&l.created_at.slice(0,10)>=fmtD((() => {const d=new Date(today);d.setDate(d.getDate()-7);return d})())).length}</span>
                </div>
              </div>
            </div>
            <div style={{...card,borderTop:'3px solid #16a34a'}}>
              <h2 style={{color:'#166534',fontSize:'15px',fontWeight:800,marginBottom:'10px'}}>💰 Financeiro</h2>
              {(() => {
                const trPeriodo = transactions.filter(t=>t.date&&t.date>=inicioStr&&t.date<=todayStr)
                const receitas = trPeriodo.filter(t=>t.type==='receita').reduce((s,t)=>s+(t.amount||0),0)
                const despesas = trPeriodo.filter(t=>t.type==='despesa').reduce((s,t)=>s+(t.amount||0),0)
                return (
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <span style={{color:'#555',fontSize:'13px'}}>Receitas</span>
                      <span style={{color:'#16a34a',fontSize:'14px',fontWeight:700}}>R$ {receitas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <span style={{color:'#555',fontSize:'13px'}}>Despesas</span>
                      <span style={{color:'#dc2626',fontSize:'14px',fontWeight:700}}>R$ {despesas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid #e5e5ea',paddingTop:'6px'}}>
                      <span style={{color:'#555',fontSize:'13px',fontWeight:700}}>Saldo</span>
                      <span style={{color:receitas-despesas>=0?'#16a34a':'#dc2626',fontSize:'14px',fontWeight:800}}>R$ {(receitas-despesas).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Insights */}
          <div style={{...card,marginBottom:'24px',background:'#faf5ff',border:'1px solid #d8b4fe'}}>
            <h2 style={{color:'#6b21a8',fontSize:'15px',fontWeight:800,marginBottom:'10px'}}>💡 Insights</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {(() => {
                const insights: string[] = []
                // Melhor área
                const melhorArea = Object.entries(categorias).sort((a,b) => {
                  const pctA = a[1].total>0?(a[1].done/a[1].total):0
                  const pctB = b[1].total>0?(b[1].done/b[1].total):0
                  return pctB - pctA
                })[0]
                if (melhorArea && melhorArea[1].done > 0) {
                  const cfg = catConfig[melhorArea[0]] || {label:melhorArea[0],icon:'📋'}
                  insights.push(`${cfg.icon} Sua melhor área é **${cfg.label}** com ${Math.round((melhorArea[1].done/melhorArea[1].total)*100)}% de conclusão`)
                }
                // Pior área
                const piorArea = Object.entries(categorias).filter(([,v])=>v.total>=2).sort((a,b) => {
                  const pctA = a[1].total>0?(a[1].done/a[1].total):0
                  const pctB = b[1].total>0?(b[1].done/b[1].total):0
                  return pctA - pctB
                })[0]
                if (piorArea && piorArea[0] !== melhorArea?.[0]) {
                  const cfg = catConfig[piorArea[0]] || {label:piorArea[0],icon:'📋'}
                  insights.push(`${cfg.icon} Área que precisa de atenção: **${cfg.label}** com ${Math.round((piorArea[1].done/piorArea[1].total)*100)}% de conclusão`)
                }
                // Melhor período
                const melhorPeriodo = Object.entries(porPeriodoDia).filter(([k,v])=>v.total>=2&&k!=='sem_hora').sort((a,b)=>{
                  return (b[1].total>0?b[1].done/b[1].total:0)-(a[1].total>0?a[1].done/a[1].total:0)
                })[0]
                if (melhorPeriodo) insights.push(`${melhorPeriodo[1].icon} Você é mais produtiva de **${melhorPeriodo[1].label.toLowerCase()}**`)
                // Streak
                if (streak >= 3) insights.push(`🔥 Sequência incrível de **${streak} dias** concluindo tarefas!`)
                // Taxa
                if (taxaConclusao >= 80) insights.push('🏆 Excelente! Taxa de conclusão acima de 80%!')
                else if (taxaConclusao < 40 && tarefasPeriodo.length > 5) insights.push('⚠️ Taxa de conclusão abaixo de 40% — tente priorizar menos tarefas por dia')
                if (insights.length === 0) insights.push('📊 Continue completando tarefas para ver seus insights!')
                return insights
              })().map((text, i) => (
                <p key={i} style={{color:'#4c1d95',fontSize:'13px',lineHeight:1.5}} dangerouslySetInnerHTML={{__html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

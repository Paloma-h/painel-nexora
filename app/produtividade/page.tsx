'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'

// Classificação inteligente por palavras-chave no título/descrição
function classificarTarefa(t: any): string {
  if (t.category && t.category !== 'geral') return t.category
  const texto = `${t.title || ''} ${t.description || ''}`.toLowerCase()
  if (/pix|banco|conta|boleto|cartão|cartao|pagamento|fatura|receita|despesa|dinheiro|salário|salario|investimento|financ|R\$/.test(texto)) return 'financeiro'
  if (/lead|cliente|prospect|follow|crm|venda|contato|proposta|orçamento|orcamento|negoci/.test(texto)) return 'crm'
  if (/gabinete|vereador|câmara|camara|polític|politica|mandato|emenda|sessão|sessao|fábio|fabio|requerimento|ofício|oficio/.test(texto)) return 'politica'
  if (/médic|medic|saúde|saude|exame|consulta|remédio|remedio|academia|exerc|treino|dentist/.test(texto)) return 'saude'
  if (/curso|aula|estudar|estudo|certificado|prova|livro|leitura|aprender|treinamento/.test(texto)) return 'educacao'
  if (/reel|story|stories|instagram|post|rede social|conteúdo|conteudo|marketing|tráfego|trafego/.test(texto)) return 'trabalho'
  if (/filho|esposo|marido|pai|mãe|mae|família|familia|casa|mercado|compra|cozinha|limpeza/.test(texto)) return 'familia'
  if (/oração|oracao|igreja|devocional|bíblia|biblia|deus|fé/.test(texto)) return 'pessoal'
  return 'geral'
}

const catConfig: Record<string,{icon:string,color:string,bg:string,label:string}> = {
  'financeiro': {icon:'💰', color:'#ca8a04', bg:'#fefce8', label:'Financeiro'},
  'crm':        {icon:'👥', color:'#2563eb', bg:'#eff6ff', label:'CRM / Vendas'},
  'politica':   {icon:'🏛️', color:'#991b1b', bg:'#fef2f2', label:'Política'},
  'trabalho':   {icon:'💼', color:'#7c3aed', bg:'#faf5ff', label:'Trabalho / Marketing'},
  'saude':      {icon:'❤️', color:'#dc2626', bg:'#fef2f2', label:'Saúde'},
  'educacao':   {icon:'📚', color:'#059669', bg:'#ecfdf5', label:'Educação'},
  'familia':    {icon:'👨‍👩‍👦', color:'#ec4899', bg:'#fdf2f8', label:'Família'},
  'pessoal':    {icon:'🙏', color:'#ea580c', bg:'#fff7ed', label:'Pessoal'},
  'geral':      {icon:'📋', color:'#64748b', bg:'#f8fafc', label:'Geral'},
}

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

  // === TAREFAS CLASSIFICADAS ===
  const tarefasPeriodo = tasks.filter(t => t.date && t.date >= inicioStr && t.date <= todayStr)
  const concluidasPeriodo = tarefasPeriodo.filter(t => t.status === 'DONE')
  const pendentesPeriodo = tarefasPeriodo.filter(t => t.status !== 'DONE')
  const taxaConclusao = tarefasPeriodo.length > 0 ? Math.round((concluidasPeriodo.length / tarefasPeriodo.length) * 100) : 0

  // Pendências
  const pendConcluidas = pendencias.filter(p => p.status === 'DONE' && p.completed_at && p.completed_at.slice(0,10) >= inicioStr)
  const pendAtivas = pendencias.filter(p => p.status !== 'DONE')
  const pendTotal = pendencias.filter(p => p.date && p.date >= inicioStr && p.date <= todayStr)
  const pendTaxa = pendTotal.length > 0 ? Math.round((pendConcluidas.length / Math.max(pendTotal.length, pendConcluidas.length)) * 100) : 0

  // Classificação por área (inteligente)
  const categorias: Record<string, {total:number, done:number}> = {}
  tarefasPeriodo.forEach(t => {
    const cat = classificarTarefa(t)
    if (!categorias[cat]) categorias[cat] = {total:0, done:0}
    categorias[cat].total++
    if (t.status === 'DONE') categorias[cat].done++
  })
  // Incluir pendências na contagem por área
  pendencias.forEach(p => {
    const cat = classificarTarefa(p)
    if (!categorias[cat]) categorias[cat] = {total:0, done:0}
    categorias[cat].total++
    if (p.status === 'DONE') categorias[cat].done++
  })

  // Financeiro
  const trPeriodo = transactions.filter(t => t.date && t.date >= inicioStr && t.date <= todayStr)
  const receitas = trPeriodo.filter(t => t.type === 'receita').reduce((s,t) => s+(t.amount||0), 0)
  const despesas = trPeriodo.filter(t => t.type === 'despesa').reduce((s,t) => s+(t.amount||0), 0)
  const contasPendentes = transactions.filter(t => t.status === 'pendente' && t.type === 'despesa')
  const contasPagas = trPeriodo.filter(t => t.status === 'pago' || t.status === 'paga')

  // CRM
  const followupsPendentes = leads.filter(l => l.next_followup && l.next_followup <= todayStr)
  const leadsNovos = leads.filter(l => l.created_at && l.created_at.slice(0,10) >= inicioStr)

  // Por dia (gráfico)
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

  // Por período do dia
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

  // Por prioridade
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

  // Streak
  let streak = 0
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const ds = fmtD(d)
    const dayDone = tasks.filter(t => t.date === ds && t.status === 'DONE').length
    if (dayDone > 0) streak++; else break
  }

  // Checklist (lê do localStorage)
  const [checklistDias, setChecklistDias] = useState(0)
  const [checklistHoje, setChecklistHoje] = useState(0)
  useEffect(() => {
    if (typeof window === 'undefined') return
    let dias = 0
    for (let i = 0; i < diasPeriodo; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const key = `nexora-checklist-${fmtD(d)}`
      try {
        const data = localStorage.getItem(key)
        if (data) {
          const checked = JSON.parse(data)
          const total = Object.keys(checked).length
          const done = Object.values(checked).filter(Boolean).length
          if (done >= total * 0.5 && total > 0) dias++
        }
      } catch {}
    }
    setChecklistDias(dias)
    // Hoje
    try {
      const hj = localStorage.getItem(`nexora-checklist-${todayStr}`)
      if (hj) {
        const c = JSON.parse(hj)
        const done = Object.values(c).filter(Boolean).length
        const total = Object.keys(c).length
        setChecklistHoje(total > 0 ? Math.round((done/total)*100) : 0)
      }
    } catch {}
  }, [periodo])

  const card: React.CSSProperties = {background:'#fff',borderRadius:'14px',padding:'18px',border:'2px solid #e8e8ee',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}

  if (loading) return (
    <div style={{display:'flex',minHeight:'100vh',background:'#fafafa'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <p style={{color:'#888',fontSize:'16px',fontWeight:600}}>⏳ Carregando produtividade...</p>
      </div>
    </div>
  )

  // Score geral de produtividade
  const scoreComponentes = [
    taxaConclusao,
    pendTaxa,
    checklistHoje,
  ].filter(v => v > 0)
  const scoreGeral = scoreComponentes.length > 0 ? Math.round(scoreComponentes.reduce((a,b)=>a+b,0) / scoreComponentes.length) : 0
  const scoreColor = scoreGeral >= 70 ? '#16a34a' : scoreGeral >= 40 ? '#ca8a04' : '#dc2626'
  const scoreEmoji = scoreGeral >= 80 ? '🔥' : scoreGeral >= 60 ? '💪' : scoreGeral >= 40 ? '⚡' : '📈'

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#fafafa'}}>
      <Sidebar />
      <div style={{flex:1,padding:'16px 16px',overflowY:'auto',minWidth:0}}>
        <div style={{maxWidth:'100%'}}>

          {/* Header com Score */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'12px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'64px',height:'64px',borderRadius:'50%',background:`conic-gradient(${scoreColor} ${scoreGeral*3.6}deg, #e5e5ea ${scoreGeral*3.6}deg)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <div style={{width:'52px',height:'52px',borderRadius:'50%',background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
                  <span style={{fontSize:'18px',fontWeight:900,color:scoreColor,lineHeight:1}}>{scoreGeral}%</span>
                  <span style={{fontSize:'9px',color:'#888',fontWeight:600}}>SCORE</span>
                </div>
              </div>
              <div>
                <h1 style={{color:'#111',fontSize:'24px',fontWeight:900}}>{scoreEmoji} Produtividade</h1>
                <p style={{color:'#888',fontSize:'13px',fontWeight:600}}>Visão integrada de todas as suas áreas</p>
              </div>
            </div>
            <div style={{display:'flex',gap:'4px'}}>
              {(['7d','30d','90d'] as const).map(p => (
                <button key={p} onClick={()=>setPeriodo(p)} style={{padding:'8px 18px',borderRadius:'10px',border:'2px solid',borderColor:periodo===p?'#7c3aed':'#e5e5ea',background:periodo===p?'#7c3aed':'#fff',color:periodo===p?'#fff':'#555',fontSize:'14px',fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}>
                  {p==='7d'?'7 dias':p==='30d'?'30 dias':'90 dias'}
                </button>
              ))}
            </div>
          </div>

          {/* KPIs principais - 6 cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'10px',marginBottom:'16px'}}>
            {[
              {val:concluidasPeriodo.length, label:'Tarefas Feitas', color:'#7c3aed', icon:'✅'},
              {val:`${taxaConclusao}%`, label:'Taxa Conclusão', color:taxaConclusao>=70?'#16a34a':taxaConclusao>=40?'#ca8a04':'#dc2626', icon:'📊'},
              {val:pendentesPeriodo.length + pendAtivas.length, label:'Pendentes', color:'#ea580c', icon:'⚠️'},
              {val:`${streak}🔥`, label:'Dias Seguidos', color:'#f59e0b', icon:''},
              {val:leads.length, label:'Leads CRM', color:'#2563eb', icon:'👥'},
              {val:`R$${(receitas-despesas).toLocaleString('pt-BR',{maximumFractionDigits:0})}`, label:'Saldo Financeiro', color:receitas-despesas>=0?'#16a34a':'#dc2626', icon:''},
            ].map((kpi, i) => (
              <div key={i} style={{...card,textAlign:'center',borderTop:`4px solid ${kpi.color}`,padding:'12px 8px'}}>
                <p style={{color:kpi.color,fontSize:'24px',fontWeight:900,lineHeight:1}}>{kpi.icon}{kpi.val}</p>
                <p style={{color:'#888',fontSize:'11px',fontWeight:700,marginTop:'4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Gráfico de barras por dia */}
          <div style={{...card,marginBottom:'16px'}}>
            <h2 style={{color:'#111',fontSize:'16px',fontWeight:900,marginBottom:'12px'}}>📈 Atividade Diária</h2>
            <div style={{display:'flex',alignItems:'flex-end',gap:'3px',height:'110px'}}>
              {Object.entries(porDia).map(([date, v]) => {
                const d = new Date(date + 'T12:00:00')
                const pct = v.total > 0 ? (v.done / v.total) * 100 : 0
                return (
                  <div key={date} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
                    <span style={{fontSize:'9px',color:'#666',fontWeight:700}}>{v.done}/{v.total}</span>
                    <div style={{width:'100%',maxWidth:'42px',height:`${Math.max((v.total/maxDia)*85, 4)}px`,borderRadius:'6px 6px 0 0',background:v.total===0?'#f0f0f0':pct===100?'#16a34a':pct>=50?'#7c3aed':'#e5e5ea',position:'relative',overflow:'hidden',transition:'height 0.5s'}}>
                      {v.total > 0 && pct < 100 && (
                        <div style={{position:'absolute',bottom:0,left:0,right:0,height:`${pct}%`,background:pct>=50?'#16a34a':'#ca8a04',borderRadius:'6px 6px 0 0'}}/>
                      )}
                    </div>
                    <span style={{fontSize:'10px',color:date===todayStr?'#7c3aed':'#bbb',fontWeight:date===todayStr?900:500}}>{d.getDate()}</span>
                  </div>
                )
              })}
            </div>
            <div style={{display:'flex',gap:'16px',marginTop:'10px',justifyContent:'center'}}>
              <span style={{fontSize:'11px',color:'#666',display:'flex',alignItems:'center',gap:'4px',fontWeight:600}}><span style={{width:'12px',height:'12px',borderRadius:'3px',background:'#16a34a',display:'inline-block'}}/>100%</span>
              <span style={{fontSize:'11px',color:'#666',display:'flex',alignItems:'center',gap:'4px',fontWeight:600}}><span style={{width:'12px',height:'12px',borderRadius:'3px',background:'#7c3aed',display:'inline-block'}}/>Parcial</span>
              <span style={{fontSize:'11px',color:'#666',display:'flex',alignItems:'center',gap:'4px',fontWeight:600}}><span style={{width:'12px',height:'12px',borderRadius:'3px',background:'#f0f0f0',display:'inline-block'}}/>Sem tarefas</span>
            </div>
          </div>

          {/* Produtividade por Área - DESTAQUE */}
          <div style={{...card,marginBottom:'16px',border:'2px solid #d8b4fe'}}>
            <h2 style={{color:'#111',fontSize:'16px',fontWeight:900,marginBottom:'14px'}}>🏷️ Produtividade por Área</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'10px'}}>
              {Object.entries(categorias).sort((a,b) => b[1].total - a[1].total).map(([cat, v]) => {
                const cfg = catConfig[cat] || {icon:'📋',color:'#64748b',bg:'#f8fafc',label:cat}
                const pct = v.total > 0 ? Math.round((v.done/v.total)*100) : 0
                return (
                  <div key={cat} style={{background:cfg.bg,borderRadius:'12px',padding:'14px',border:`2px solid ${cfg.color}22`}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                      <span style={{fontSize:'14px',fontWeight:800,color:'#333'}}>{cfg.icon} {cfg.label}</span>
                      <span style={{fontSize:'20px',fontWeight:900,color:pct>=70?'#16a34a':pct>=40?'#ca8a04':'#dc2626'}}>{pct}%</span>
                    </div>
                    <div style={{height:'10px',background:'#fff',borderRadius:'5px',overflow:'hidden',border:'1px solid #e5e5ea'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:cfg.color,borderRadius:'5px',transition:'width 0.5s'}}/>
                    </div>
                    <p style={{fontSize:'11px',color:'#888',fontWeight:600,marginTop:'4px'}}>{v.done} de {v.total} concluídas</p>
                  </div>
                )
              })}
              {Object.keys(categorias).length === 0 && <p style={{color:'#bbb',fontSize:'14px',textAlign:'center',padding:'20px 0',gridColumn:'1/-1'}}>Sem dados no período</p>}
            </div>
          </div>

          {/* Linha: Período do Dia + Prioridade + Checklist */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'16px'}}>
            {/* Por Período do Dia */}
            <div style={{...card}}>
              <h2 style={{color:'#111',fontSize:'15px',fontWeight:900,marginBottom:'12px'}}>🕐 Por Turno</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {Object.entries(porPeriodoDia).filter(([,v]) => v.total > 0).map(([key, v]) => {
                  const pct = v.total > 0 ? Math.round((v.done/v.total)*100) : 0
                  return (
                    <div key={key}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                        <span style={{fontSize:'14px',fontWeight:700,color:'#333'}}>{v.icon} {v.label}</span>
                        <span style={{fontSize:'16px',fontWeight:900,color:pct>=70?'#16a34a':pct>=40?'#ca8a04':'#dc2626'}}>{pct}%</span>
                      </div>
                      <div style={{height:'8px',background:'#f0f0f0',borderRadius:'4px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:v.color,borderRadius:'4px',transition:'width 0.5s'}}/>
                      </div>
                      <p style={{fontSize:'10px',color:'#aaa',fontWeight:600,marginTop:'2px'}}>{v.done}/{v.total}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Por Prioridade */}
            <div style={{...card}}>
              <h2 style={{color:'#111',fontSize:'15px',fontWeight:900,marginBottom:'12px'}}>⚡ Por Prioridade</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {['CRITICAL','HIGH','MEDIUM','LOW'].filter(p => porPrioridade[p]).map(p => {
                  const v = porPrioridade[p]
                  const cfg = prioLabels[p]
                  const pct = v.total > 0 ? Math.round((v.done/v.total)*100) : 0
                  return (
                    <div key={p}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <span style={{width:'10px',height:'10px',borderRadius:'50%',background:cfg.color,flexShrink:0}}/>
                          <span style={{fontSize:'13px',fontWeight:700,color:'#333'}}>{cfg.label}</span>
                        </div>
                        <span style={{fontSize:'15px',fontWeight:900,color:pct>=70?'#16a34a':pct>=40?'#ca8a04':'#dc2626'}}>{pct}%</span>
                      </div>
                      <div style={{height:'8px',background:'#f0f0f0',borderRadius:'4px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:cfg.color,borderRadius:'4px'}}/>
                      </div>
                      <p style={{fontSize:'10px',color:'#aaa',fontWeight:600,marginTop:'2px'}}>{v.done}/{v.total}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Checklist Diário */}
            <div style={{...card}}>
              <h2 style={{color:'#111',fontSize:'15px',fontWeight:900,marginBottom:'12px'}}>✅ Checklist Diário</h2>
              <div style={{textAlign:'center',padding:'8px 0'}}>
                <div style={{width:'80px',height:'80px',borderRadius:'50%',background:`conic-gradient(${checklistHoje>=70?'#16a34a':checklistHoje>=40?'#ca8a04':'#dc2626'} ${checklistHoje*3.6}deg, #e5e5ea ${checklistHoje*3.6}deg)`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto'}}>
                  <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:'22px',fontWeight:900,color:checklistHoje>=70?'#16a34a':checklistHoje>=40?'#ca8a04':'#dc2626'}}>{checklistHoje}%</span>
                  </div>
                </div>
                <p style={{color:'#555',fontSize:'12px',fontWeight:700,marginTop:'10px'}}>Hoje</p>
              </div>
              <div style={{borderTop:'1px solid #f0f0f0',paddingTop:'10px',marginTop:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:'#555',fontWeight:600}}>Dias com checklist {'>'} 50%</span>
                  <span style={{fontSize:'18px',fontWeight:900,color:'#7c3aed'}}>{checklistDias}/{diasPeriodo}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Integração: CRM + Financeiro + Pendências */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'16px'}}>
            {/* CRM */}
            <div style={{...card,borderTop:'4px solid #2563eb'}}>
              <h2 style={{color:'#1e40af',fontSize:'15px',fontWeight:900,marginBottom:'12px'}}>👥 CRM</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#555',fontSize:'13px',fontWeight:600}}>Total de leads</span>
                  <span style={{color:'#2563eb',fontSize:'18px',fontWeight:900}}>{leads.length}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#555',fontSize:'13px',fontWeight:600}}>Follow-ups pendentes</span>
                  <span style={{color:followupsPendentes.length>0?'#dc2626':'#16a34a',fontSize:'18px',fontWeight:900}}>{followupsPendentes.length}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#555',fontSize:'13px',fontWeight:600}}>Novos no período</span>
                  <span style={{color:'#16a34a',fontSize:'18px',fontWeight:900}}>{leadsNovos.length}</span>
                </div>
                {followupsPendentes.length > 0 && (
                  <div style={{background:'#fef2f2',borderRadius:'8px',padding:'8px',marginTop:'4px'}}>
                    <p style={{color:'#dc2626',fontSize:'11px',fontWeight:700}}>⚠️ {followupsPendentes.length} follow-up(s) atrasado(s)!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financeiro */}
            <div style={{...card,borderTop:'4px solid #16a34a'}}>
              <h2 style={{color:'#166534',fontSize:'15px',fontWeight:900,marginBottom:'12px'}}>💰 Financeiro</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#555',fontSize:'13px',fontWeight:600}}>Receitas</span>
                  <span style={{color:'#16a34a',fontSize:'16px',fontWeight:900}}>R$ {receitas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#555',fontSize:'13px',fontWeight:600}}>Despesas</span>
                  <span style={{color:'#dc2626',fontSize:'16px',fontWeight:900}}>R$ {despesas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'2px solid #e5e5ea',paddingTop:'6px'}}>
                  <span style={{color:'#333',fontSize:'14px',fontWeight:800}}>Saldo</span>
                  <span style={{color:receitas-despesas>=0?'#16a34a':'#dc2626',fontSize:'18px',fontWeight:900}}>R$ {(receitas-despesas).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                </div>
                {contasPendentes.length > 0 && (
                  <div style={{background:'#fefce8',borderRadius:'8px',padding:'8px',marginTop:'4px'}}>
                    <p style={{color:'#ca8a04',fontSize:'11px',fontWeight:700}}>📋 {contasPendentes.length} conta(s) pendente(s)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pendências */}
            <div style={{...card,borderTop:'4px solid #ea580c'}}>
              <h2 style={{color:'#c2410c',fontSize:'15px',fontWeight:900,marginBottom:'12px'}}>⚡ Pendências</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#555',fontSize:'13px',fontWeight:600}}>Ativas</span>
                  <span style={{color:pendAtivas.length>5?'#dc2626':'#ea580c',fontSize:'18px',fontWeight:900}}>{pendAtivas.length}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#555',fontSize:'13px',fontWeight:600}}>Resolvidas no período</span>
                  <span style={{color:'#16a34a',fontSize:'18px',fontWeight:900}}>{pendConcluidas.length}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#555',fontSize:'13px',fontWeight:600}}>Taxa de resolução</span>
                  <span style={{color:pendTaxa>=70?'#16a34a':pendTaxa>=40?'#ca8a04':'#dc2626',fontSize:'18px',fontWeight:900}}>{pendTaxa}%</span>
                </div>
                {pendAtivas.length > 10 && (
                  <div style={{background:'#fef2f2',borderRadius:'8px',padding:'8px',marginTop:'4px'}}>
                    <p style={{color:'#dc2626',fontSize:'11px',fontWeight:700}}>🚨 Muitas pendências acumuladas!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div style={{...card,marginBottom:'24px',background:'linear-gradient(135deg, #faf5ff 0%, #f0e7ff 100%)',border:'2px solid #c4b5fd'}}>
            <h2 style={{color:'#6b21a8',fontSize:'16px',fontWeight:900,marginBottom:'12px'}}>💡 Insights Inteligentes</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {(() => {
                const insights: {text:string, type:'success'|'warning'|'info'}[] = []
                // Melhor área
                const areas = Object.entries(categorias).filter(([,v])=>v.total>=2).sort((a,b)=>{
                  return (b[1].total>0?b[1].done/b[1].total:0)-(a[1].total>0?a[1].done/a[1].total:0)
                })
                if (areas[0] && areas[0][1].done > 0) {
                  const cfg = catConfig[areas[0][0]] || {label:areas[0][0],icon:'📋'}
                  insights.push({text:`${cfg.icon} Melhor área: <strong>${cfg.label}</strong> (${Math.round((areas[0][1].done/areas[0][1].total)*100)}%)`, type:'success'})
                }
                if (areas.length > 1) {
                  const pior = areas[areas.length-1]
                  const cfg = catConfig[pior[0]] || {label:pior[0],icon:'📋'}
                  insights.push({text:`${cfg.icon} Precisa de atenção: <strong>${cfg.label}</strong> (${Math.round((pior[1].done/pior[1].total)*100)}%)`, type:'warning'})
                }
                // Melhor período
                const melhorPeriodo = Object.entries(porPeriodoDia).filter(([k,v])=>v.total>=2&&k!=='sem_hora').sort((a,b)=>(b[1].total>0?b[1].done/b[1].total:0)-(a[1].total>0?a[1].done/a[1].total:0))[0]
                if (melhorPeriodo) insights.push({text:`${melhorPeriodo[1].icon} Mais produtiva de <strong>${melhorPeriodo[1].label.toLowerCase()}</strong>`, type:'info'})
                if (streak >= 3) insights.push({text:`🔥 Sequência incrível de <strong>${streak} dias</strong>!`, type:'success'})
                if (taxaConclusao >= 80) insights.push({text:'🏆 Taxa acima de <strong>80%</strong>! Excelente!', type:'success'})
                else if (taxaConclusao < 40 && tarefasPeriodo.length > 5) insights.push({text:'⚠️ Taxa abaixo de 40% — tente <strong>menos tarefas por dia</strong>', type:'warning'})
                if (followupsPendentes.length > 0) insights.push({text:`📞 <strong>${followupsPendentes.length}</strong> follow-up(s) de CRM atrasado(s)`, type:'warning'})
                if (contasPendentes.length > 0) insights.push({text:`💳 <strong>${contasPendentes.length}</strong> conta(s) financeira(s) pendente(s)`, type:'warning'})
                if (checklistHoje < 50 && checklistHoje > 0) insights.push({text:'📋 Checklist de hoje ainda <strong>incompleto</strong>', type:'warning'})
                if (checklistDias >= diasPeriodo * 0.7) insights.push({text:'✅ Checklist mantido em <strong>mais de 70%</strong> dos dias!', type:'success'})
                if (insights.length === 0) insights.push({text:'📊 Continue completando tarefas para ver seus insights!', type:'info'})
                return insights
              })().map((item, i) => (
                <div key={i} style={{
                  background: item.type==='success'?'#ecfdf5':item.type==='warning'?'#fffbeb':'#eff6ff',
                  border: `1px solid ${item.type==='success'?'#86efac':item.type==='warning'?'#fde68a':'#93c5fd'}`,
                  borderRadius:'10px',padding:'10px 12px',
                }}>
                  <p style={{color:item.type==='success'?'#166534':item.type==='warning'?'#92400e':'#1e40af',fontSize:'13px',fontWeight:600,lineHeight:1.4}} dangerouslySetInnerHTML={{__html: item.text}} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

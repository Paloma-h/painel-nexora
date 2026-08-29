'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const CATEGORIES = ['alimentação','transporte','saúde','educação','lazer','moradia','trabalho','assinatura','cartão','imposto','outros']
const ASSET_TYPES = ['Imóvel','Veículo','Terreno','Móvel','Equipamento','Outro']
const INVEST_TYPES = ['Renda Fixa','Tesouro Direto','CDB','Ações','FII','Poupança','Cripto','Outro']
const BILL_CATS = ['moradia','energia','água','internet','telefone','assinatura','imposto','saúde','educação','outros']



const inp: any = {width:'100%',background:'#fff',border:'1px solid #e5e5ea',borderRadius:'10px',padding:'9px 12px',color:'#1a1a2e',fontSize:'15px',outline:'none',boxSizing:'border-box'}
const sel: any = {width:'100%',background:'#ffffff',border:'1px solid #e5e5ea',borderRadius:'10px',padding:'9px 12px',color:'#1a1a2e',fontSize:'15px',outline:'none'}

function Modal({title,onClose,children}:{title:string,onClose:()=>void,children:any}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'500px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'1px solid #e5e5ea',height:'fit-content'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h2 style={{color:'#1a1a2e',fontSize:'18px',fontWeight:600}}>{title}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#999',cursor:'pointer',fontSize:'18px'}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function FinanceiroPage() {
  const [tab, setTab] = useState('visao')
  const [transactions, setTransactions] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const [filterMonth, setFilterMonth] = useState(today.getMonth())
  const [filterYear, setFilterYear] = useState(today.getFullYear())
  const [showForm, setShowForm] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [tForm, setTForm] = useState({title:'',amount:'',type:'receita',category:'outros',date:'',notes:''})
  const [cForm, setCForm] = useState({name:'',limit_total:'',closing_day:'',due_day:'',color:'#5b50d6',notes:''})
  const [bForm, setBForm] = useState({title:'',amount:'',category:'outros',due_day:'',due_date:'',is_recurring:false,recurrence:'monthly',notes:''})
  const [iForm, setIForm] = useState({name:'',type:'Renda Fixa',amount_invested:'',current_value:'',notes:''})
  const [aForm, setAForm] = useState({name:'',type:'Imóvel',estimated_value:'',notes:''})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [t,c,b,i,a] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id',USER_ID).order('date',{ascending:false}),
      supabase.from('cards').select('*').eq('user_id',USER_ID).order('created_at',{ascending:false}),
      supabase.from('bills').select('*').eq('user_id',USER_ID).order('created_at',{ascending:false}),
      supabase.from('investments').select('*').eq('user_id',USER_ID).order('created_at',{ascending:false}),
      supabase.from('assets').select('*').eq('user_id',USER_ID).order('created_at',{ascending:false}),
    ])
    setTransactions(t.data||[])
    setCards(c.data||[])
    setBills(b.data||[])
    setInvestments(i.data||[])
    setAssets(a.data||[])
    setLoading(false)
  }

  const filtered = transactions.filter(t => {
    if (!t.date) return true
    const d = new Date(t.date+'T12:00:00')
    return d.getMonth()===filterMonth && d.getFullYear()===filterYear
  })

  const receitas = filtered.filter(t=>t.type==='receita').reduce((s,t)=>s+Number(t.amount),0)
  const despesas = filtered.filter(t=>t.type==='despesa').reduce((s,t)=>s+Number(t.amount),0)
  const saldo = receitas - despesas
  const totalInvested = investments.reduce((s,i)=>s+Number(i.amount_invested),0)
  const totalAssets = assets.reduce((s,a)=>s+Number(a.estimated_value),0)
  const totalPatrimonio = totalInvested + totalAssets

  const billsDuesSoon = bills.filter(b => {
    if (!b.due_day) return false
    const dueDate = new Date(today.getFullYear(), today.getMonth(), b.due_day)
    const diff = Math.ceil((dueDate.getTime()-today.getTime())/(1000*60*60*24))
    return diff >= 0 && diff <= 7 && b.status !== 'pago'
  })

  const cardsDueSoon = cards.filter(c => {
    if (!c.due_day) return false
    const dueDate = new Date(today.getFullYear(), today.getMonth(), c.due_day)
    const diff = Math.ceil((dueDate.getTime()-today.getTime())/(1000*60*60*24))
    return diff >= 0 && diff <= 7
  })

  async function saveTransaction() {
    if (!tForm.title.trim()||!tForm.amount) return
    setSaving(true)
    const data = {title:tForm.title.trim(),amount:parseFloat(tForm.amount),type:tForm.type,category:tForm.category,date:tForm.date||null,notes:tForm.notes||null,user_id:USER_ID}
    editing ? await supabase.from('transactions').update(data).eq('id',editing.id) : await supabase.from('transactions').insert({...data,id:crypto.randomUUID()})
    setShowForm(''); setSaving(false); load()
  }

  async function saveCard() {
    if (!cForm.name.trim()) return
    setSaving(true)
    const data = {name:cForm.name.trim(),limit_total:parseFloat(cForm.limit_total)||0,closing_day:parseInt(cForm.closing_day)||null,due_day:parseInt(cForm.due_day)||null,color:cForm.color,notes:cForm.notes||null,user_id:USER_ID}
    if (editing) {
      await supabase.from('cards').update(data).eq('id',editing.id)
    } else {
      const id = crypto.randomUUID()
      await supabase.from('cards').insert({...data,id})
      if (data.due_day) {
        const dueDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(data.due_day).padStart(2,'0')}`
        await supabase.from('tasks').insert({id:crypto.randomUUID(),title:`Vencimento cartão: ${cForm.name}`,date:dueDate,type:'task',status:'PENDING',priority:'HIGH',category:'financeiro',is_recurring:true,recurrence:'monthly',user_id:USER_ID})
      }
    }
    setShowForm(''); setSaving(false); load()
  }

  async function saveBill() {
    if (!bForm.title.trim()) return
    setSaving(true)
    const data = {title:bForm.title.trim(),amount:parseFloat(bForm.amount)||0,category:bForm.category,due_day:parseInt(bForm.due_day)||null,due_date:bForm.due_date||null,is_recurring:bForm.is_recurring,recurrence:bForm.recurrence,notes:bForm.notes||null,status:'pendente',user_id:USER_ID}
    if (editing) {
      await supabase.from('bills').update(data).eq('id',editing.id)
    } else {
      const id = crypto.randomUUID()
      await supabase.from('bills').insert({...data,id})
      const dateStr = bForm.due_date || (bForm.due_day ? `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(parseInt(bForm.due_day)).padStart(2,'0')}` : null)
      if (dateStr) {
        await supabase.from('tasks').insert({id:crypto.randomUUID(),title:`Pagar: ${bForm.title}`,date:dateStr,type:'task',status:'PENDING',priority:'HIGH',category:'financeiro',is_recurring:bForm.is_recurring,recurrence:bForm.recurrence,user_id:USER_ID})
      }
    }
    setShowForm(''); setSaving(false); load()
  }

  async function saveInvestment() {
    if (!iForm.name.trim()) return
    setSaving(true)
    const data = {name:iForm.name.trim(),type:iForm.type,amount_invested:parseFloat(iForm.amount_invested)||0,current_value:parseFloat(iForm.current_value)||0,notes:iForm.notes||null,user_id:USER_ID}
    editing ? await supabase.from('investments').update(data).eq('id',editing.id) : await supabase.from('investments').insert({...data,id:crypto.randomUUID()})
    setShowForm(''); setSaving(false); load()
  }

  async function saveAsset() {
    if (!aForm.name.trim()) return
    setSaving(true)
    const data = {name:aForm.name.trim(),type:aForm.type,estimated_value:parseFloat(aForm.estimated_value)||0,notes:aForm.notes||null,user_id:USER_ID}
    editing ? await supabase.from('assets').update(data).eq('id',editing.id) : await supabase.from('assets').insert({...data,id:crypto.randomUUID()})
    setShowForm(''); setSaving(false); load()
  }

  async function del(table:string, id:string) {
    if (!confirm('Excluir?')) return
    await supabase.from(table).delete().eq('id',id); load()
  }

  async function payBill(id:string) {
    await supabase.from('bills').update({status:'pago'}).eq('id',id); load()
  }

  const tabs = [{id:'visao',label:'Visão Geral'},{id:'lancamentos',label:'Lançamentos'},{id:'cartoes',label:'Cartões'},{id:'contas',label:'Contas a Pagar'},{id:'investimentos',label:'Investimentos'},{id:'ativos',label:'Ativos'}]

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#f5f5f7'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column',overflowY:'auto'}}>
        <div style={{background:'#f8f8fa',borderBottom:'1px solid #e5e5ea',padding:'0 28px',display:'flex',gap:'4px',alignItems:'center',flexShrink:0}}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab===t.id?'#7c6ff7':'transparent'}`,color:tab===t.id?'#a89ff7':'#999',fontSize:'15px',cursor:'pointer',fontWeight:tab===t.id?600:400,transition:'all 0.15s'}}>{t.label}</button>
          ))}
        </div>

        <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
          <div style={{maxWidth:'900px',margin:'0 auto'}}>

            {tab==='visao' && (
              <div>
                <h1 style={{color:'#1a1a2e',fontSize:'22px',fontWeight:700,marginBottom:'20px'}}>Visão Geral — {MONTHS[filterMonth]} {filterYear}</h1>
                <div style={{display:'flex',gap:'8px',marginBottom:'20px'}}>
                  <select value={filterMonth} onChange={e=>setFilterMonth(parseInt(e.target.value))} style={{...sel,width:'auto',fontSize:'15px',padding:'6px 10px'}}>
                    {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                  </select>
                  <select value={filterYear} onChange={e=>setFilterYear(parseInt(e.target.value))} style={{...sel,width:'auto',fontSize:'15px',padding:'6px 10px'}}>
                    {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'24px'}}>
                  <div style={{background:'rgba(76,175,125,0.08)',border:'1px solid rgba(76,175,125,0.15)',borderRadius:'14px',padding:'20px'}}>
                    <p style={{color:'rgba(76,175,125,0.6)',fontSize:'15px',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Receitas</p>
                    <p style={{color:'#4caf7d',fontSize:'26px',fontWeight:700}}>R$ {receitas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                  <div style={{background:'rgba(224,82,82,0.08)',border:'1px solid rgba(224,82,82,0.15)',borderRadius:'14px',padding:'20px'}}>
                    <p style={{color:'rgba(224,82,82,0.6)',fontSize:'15px',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Despesas</p>
                    <p style={{color:'#e05252',fontSize:'26px',fontWeight:700}}>R$ {despesas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                  <div style={{background:saldo>=0?'rgba(91,80,214,0.08)':'rgba(224,82,82,0.08)',border:`1px solid ${saldo>=0?'rgba(91,80,214,0.15)':'rgba(224,82,82,0.15)'}`,borderRadius:'14px',padding:'20px'}}>
                    <p style={{color:'#888',fontSize:'15px',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Saldo</p>
                    <p style={{color:saldo>=0?'#a89ff7':'#e05252',fontSize:'26px',fontWeight:700}}>R$ {saldo.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'24px'}}>
                  <div style={{background:'#fff',border:'1px solid #e5e5ea',borderRadius:'14px',padding:'20px'}}>
                    <p style={{color:'#888',fontSize:'15px',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Patrimônio investido</p>
                    <p style={{color:'#d4b84a',fontSize:'22px',fontWeight:700}}>R$ {totalInvested.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                  <div style={{background:'#fff',border:'1px solid #e5e5ea',borderRadius:'14px',padding:'20px'}}>
                    <p style={{color:'#888',fontSize:'15px',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Patrimônio total</p>
                    <p style={{color:'#1a1a2e',fontSize:'22px',fontWeight:700}}>R$ {totalPatrimonio.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                </div>

                {(billsDuesSoon.length > 0 || cardsDueSoon.length > 0) && (
                  <div style={{background:'rgba(224,82,82,0.05)',border:'1px solid rgba(224,82,82,0.15)',borderRadius:'14px',padding:'20px',marginBottom:'20px'}}>
                    <p style={{color:'#e05252',fontSize:'15px',fontWeight:600,marginBottom:'12px',textTransform:'uppercase',letterSpacing:'0.5px'}}>⚠ Próximos 7 dias</p>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                      {cardsDueSoon.map(c => (
                        <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:'#fff',borderRadius:'10px'}}>
                          <div>
                            <p style={{color:'#1a1a2e',fontSize:'15px',fontWeight:500}}>Cartão: {c.name}</p>
                            <p style={{color:'#999',fontSize:'15px'}}>Vence dia {c.due_day}</p>
                          </div>
                          <span style={{color:'#e05252',fontSize:'15px',fontWeight:600}}>Cartão</span>
                        </div>
                      ))}
                      {billsDuesSoon.map(b => (
                        <div key={b.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:'#fff',borderRadius:'10px'}}>
                          <div>
                            <p style={{color:'#1a1a2e',fontSize:'15px',fontWeight:500}}>{b.title}</p>
                            <p style={{color:'#999',fontSize:'15px'}}>Vence dia {b.due_day} · R$ {Number(b.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                          </div>
                          <button onClick={() => payBill(b.id)} style={{padding:'5px 10px',background:'rgba(76,175,125,0.15)',border:'1px solid rgba(76,175,125,0.2)',borderRadius:'7px',color:'#4caf7d',fontSize:'15px',cursor:'pointer'}}>Pagar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab==='lancamentos' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                  <div>
                    <h1 style={{color:'#1a1a2e',fontSize:'22px',fontWeight:700}}>Lançamentos</h1>
                    <p style={{color:'#999',fontSize:'15px',marginTop:'2px'}}>{filtered.length} em {MONTHS[filterMonth]} {filterYear}</p>
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <select value={filterMonth} onChange={e=>setFilterMonth(parseInt(e.target.value))} style={{...sel,width:'auto',fontSize:'15px',padding:'6px 10px'}}>
                      {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                    </select>
                    <select value={filterYear} onChange={e=>setFilterYear(parseInt(e.target.value))} style={{...sel,width:'auto',fontSize:'15px',padding:'6px 10px'}}>
                      {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={()=>{setEditing(null);setTForm({title:'',amount:'',type:'receita',category:'outros',date:'',notes:''});setShowForm('t')}} style={{padding:'7px 14px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo</button>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'20px'}}>
                  <div style={{background:'rgba(76,175,125,0.08)',border:'1px solid rgba(76,175,125,0.12)',borderRadius:'12px',padding:'14px'}}>
                    <p style={{color:'rgba(76,175,125,0.6)',fontSize:'12px',marginBottom:'4px'}}>Receitas</p>
                    <p style={{color:'#4caf7d',fontSize:'22px',fontWeight:700}}>R$ {receitas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                  <div style={{background:'rgba(224,82,82,0.08)',border:'1px solid rgba(224,82,82,0.12)',borderRadius:'12px',padding:'14px'}}>
                    <p style={{color:'rgba(224,82,82,0.6)',fontSize:'12px',marginBottom:'4px'}}>Despesas</p>
                    <p style={{color:'#e05252',fontSize:'22px',fontWeight:700}}>R$ {despesas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                  <div style={{background:saldo>=0?'rgba(91,80,214,0.08)':'rgba(224,82,82,0.08)',border:`1px solid ${saldo>=0?'rgba(91,80,214,0.12)':'rgba(224,82,82,0.12)'}`,borderRadius:'12px',padding:'14px'}}>
                    <p style={{color:'#888',fontSize:'12px',marginBottom:'4px'}}>Saldo</p>
                    <p style={{color:saldo>=0?'#a89ff7':'#e05252',fontSize:'22px',fontWeight:700}}>R$ {saldo.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {filtered.length===0&&<p style={{color:'#bbb',textAlign:'center',padding:'40px'}}>Nenhum lançamento neste mês</p>}
                  {filtered.map(t=>(
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'12px',background:'#fff',border:'1px solid #e5e5ea'}}>
                      <div style={{width:'3px',height:'32px',borderRadius:'2px',background:t.type==='receita'?'#4caf7d':'#e05252',flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{color:'#1a1a2e',fontSize:'15px',fontWeight:500}}>{t.title}</p>
                        <div style={{display:'flex',gap:'8px',marginTop:'2px'}}>
                          <span style={{color:'#999',fontSize:'15px'}}>{t.category}</span>
                          {t.date&&<span style={{color:'#bbb',fontSize:'15px'}}>{new Date(t.date+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>
                      <p style={{color:t.type==='receita'?'#4caf7d':'#e05252',fontSize:'15px',fontWeight:700}}>{t.type==='receita'?'+':'-'} R$ {Number(t.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                      <button onClick={()=>{setEditing(t);setTForm({title:t.title,amount:t.amount.toString(),type:t.type,category:t.category,date:t.date||'',notes:t.notes||''});setShowForm('t')}} style={{padding:'5px 8px',background:'#fff',border:'none',borderRadius:'7px',color:'#888',fontSize:'15px',cursor:'pointer'}}>✎</button>
                      <button onClick={()=>del('transactions',t.id)} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==='cartoes' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                  <h1 style={{color:'#1a1a2e',fontSize:'22px',fontWeight:700}}>Cartões</h1>
                  <button onClick={()=>{setEditing(null);setCForm({name:'',limit_total:'',closing_day:'',due_day:'',color:'#5b50d6',notes:''});setShowForm('c')}} style={{padding:'7px 14px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo Cartão</button>
                </div>
                {cards.length===0&&<p style={{color:'#bbb',textAlign:'center',padding:'40px'}}>Nenhum cartão cadastrado</p>}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'14px'}}>
                  {cards.map(c=>(
                    <div key={c.id} style={{background:'#fff',border:`1px solid ${c.color}33`,borderRadius:'14px',padding:'20px',position:'relative'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px'}}>
                        <div style={{width:'36px',height:'22px',borderRadius:'5px',background:c.color}}/>
                        <div style={{display:'flex',gap:'4px'}}>
                          <button onClick={()=>{setEditing(c);setCForm({name:c.name,limit_total:c.limit_total?.toString()||'',closing_day:c.closing_day?.toString()||'',due_day:c.due_day?.toString()||'',color:c.color||'#5b50d6',notes:c.notes||''});setShowForm('c')}} style={{padding:'4px 7px',background:'#fff',border:'none',borderRadius:'6px',color:'#888',fontSize:'15px',cursor:'pointer'}}>✎</button>
                          <button onClick={()=>del('cards',c.id)} style={{padding:'4px 7px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'6px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>✕</button>
                        </div>
                      </div>
                      <p style={{color:'#1a1a2e',fontSize:'15px',fontWeight:600,marginBottom:'12px'}}>{c.name}</p>
                      {c.limit_total>0&&(
                        <div style={{marginBottom:'10px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                            <span style={{color:'#999',fontSize:'15px'}}>Limite</span>
                            <span style={{color:'#666',fontSize:'15px'}}>R$ {Number(c.limit_total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                          </div>
                          <div style={{height:'3px',background:'#fff',borderRadius:'2px'}}>
                            <div style={{height:'100%',width:`${Math.min((c.limit_used/c.limit_total)*100,100)}%`,background:c.color,borderRadius:'2px'}}/>
                          </div>
                        </div>
                      )}
                      <div style={{display:'flex',gap:'12px'}}>
                        {c.closing_day&&<div><p style={{color:'#999',fontSize:'12px'}}>Fechamento</p><p style={{color:'#1a1a2e',fontSize:'15px',fontWeight:500}}>Dia {c.closing_day}</p></div>}
                        {c.due_day&&<div><p style={{color:'#999',fontSize:'12px'}}>Vencimento</p><p style={{color:'#e05252',fontSize:'15px',fontWeight:500}}>Dia {c.due_day}</p></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==='contas' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                  <h1 style={{color:'#1a1a2e',fontSize:'22px',fontWeight:700}}>Contas a Pagar</h1>
                  <button onClick={()=>{setEditing(null);setBForm({title:'',amount:'',category:'outros',due_day:'',due_date:'',is_recurring:false,recurrence:'monthly',notes:''});setShowForm('b')}} style={{padding:'7px 14px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Nova Conta</button>
                </div>
                {bills.length===0&&<p style={{color:'#bbb',textAlign:'center',padding:'40px'}}>Nenhuma conta cadastrada</p>}
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {bills.map(b=>{
                    const isPaid = b.status==='pago'
                    return (
                      <div key={b.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'12px',background:isPaid?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.04)',border:`1px solid ${isPaid?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.08)'}`}}>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{color:isPaid?'#999':'#fff',fontSize:'15px',fontWeight:500,textDecoration:isPaid?'line-through':'none'}}>{b.title}</p>
                          <div style={{display:'flex',gap:'8px',marginTop:'2px'}}>
                            <span style={{color:'#aaa',fontSize:'15px'}}>{b.category}</span>
                            {b.due_day&&<span style={{color:'#aaa',fontSize:'15px'}}>Dia {b.due_day}</span>}
                            {b.is_recurring&&<span style={{color:'rgba(91,80,214,0.6)',fontSize:'15px'}}>Recorrente</span>}
                          </div>
                        </div>
                        <p style={{color:isPaid?'#999':'#e05252',fontSize:'15px',fontWeight:600}}>R$ {Number(b.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                        {!isPaid&&<button onClick={()=>payBill(b.id)} style={{padding:'5px 10px',background:'rgba(76,175,125,0.12)',border:'1px solid rgba(76,175,125,0.2)',borderRadius:'7px',color:'#4caf7d',fontSize:'15px',cursor:'pointer'}}>Pagar</button>}
                        {isPaid&&<span style={{fontSize:'15px',color:'#4caf7d',padding:'5px 10px'}}>✓ Pago</span>}
                        <button onClick={()=>{setEditing(b);setBForm({title:b.title,amount:b.amount?.toString()||'',category:b.category,due_day:b.due_day?.toString()||'',due_date:b.due_date||'',is_recurring:b.is_recurring||false,recurrence:b.recurrence||'monthly',notes:b.notes||''});setShowForm('b')}} style={{padding:'5px 8px',background:'#fff',border:'none',borderRadius:'7px',color:'#888',fontSize:'15px',cursor:'pointer'}}>✎</button>
                        <button onClick={()=>del('bills',b.id)} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>✕</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {tab==='investimentos' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                  <div>
                    <h1 style={{color:'#1a1a2e',fontSize:'22px',fontWeight:700}}>Investimentos</h1>
                    <p style={{color:'#999',fontSize:'15px',marginTop:'2px'}}>Total investido: R$ {totalInvested.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                  <button onClick={()=>{setEditing(null);setIForm({name:'',type:'Renda Fixa',amount_invested:'',current_value:'',notes:''});setShowForm('i')}} style={{padding:'7px 14px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo</button>
                </div>
                {investments.length===0&&<p style={{color:'#bbb',textAlign:'center',padding:'40px'}}>Nenhum investimento cadastrado</p>}
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {investments.map(i=>{
                    const rendimento = Number(i.current_value) - Number(i.amount_invested)
                    const perc = i.amount_invested > 0 ? ((rendimento/Number(i.amount_invested))*100).toFixed(1) : '0'
                    return (
                      <div key={i.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#fff',border:'1px solid #e5e5ea'}}>
                        <div style={{flex:1}}>
                          <p style={{color:'#1a1a2e',fontSize:'15px',fontWeight:500}}>{i.name}</p>
                          <p style={{color:'#999',fontSize:'15px',marginTop:'2px'}}>{i.type}</p>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <p style={{color:'#d4b84a',fontSize:'15px',fontWeight:600}}>R$ {Number(i.current_value||i.amount_invested).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                          {rendimento !== 0 && <p style={{color:rendimento>=0?'#4caf7d':'#e05252',fontSize:'15px'}}>{rendimento>=0?'+':''}R$ {rendimento.toLocaleString('pt-BR',{minimumFractionDigits:2})} ({perc}%)</p>}
                        </div>
                        <button onClick={()=>{setEditing(i);setIForm({name:i.name,type:i.type,amount_invested:i.amount_invested?.toString()||'',current_value:i.current_value?.toString()||'',notes:i.notes||''});setShowForm('i')}} style={{padding:'5px 8px',background:'#fff',border:'none',borderRadius:'7px',color:'#888',fontSize:'15px',cursor:'pointer'}}>✎</button>
                        <button onClick={()=>del('investments',i.id)} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>✕</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {tab==='ativos' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                  <div>
                    <h1 style={{color:'#1a1a2e',fontSize:'22px',fontWeight:700}}>Ativos</h1>
                    <p style={{color:'#999',fontSize:'15px',marginTop:'2px'}}>Patrimônio: R$ {totalAssets.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  </div>
                  <button onClick={()=>{setEditing(null);setAForm({name:'',type:'Imóvel',estimated_value:'',notes:''});setShowForm('a')}} style={{padding:'7px 14px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo Ativo</button>
                </div>
                {assets.length===0&&<p style={{color:'#bbb',textAlign:'center',padding:'40px'}}>Nenhum ativo cadastrado</p>}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'12px'}}>
                  {assets.map(a=>(
                    <div key={a.id} style={{background:'#fff',border:'1px solid #e5e5ea',borderRadius:'12px',padding:'16px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                        <span style={{fontSize:'12px',padding:'2px 8px',borderRadius:'5px',background:'rgba(212,184,74,0.1)',color:'#d4b84a'}}>{a.type}</span>
                        <div style={{display:'flex',gap:'4px'}}>
                          <button onClick={()=>{setEditing(a);setAForm({name:a.name,type:a.type,estimated_value:a.estimated_value?.toString()||'',notes:a.notes||''});setShowForm('a')}} style={{padding:'4px 7px',background:'#fff',border:'none',borderRadius:'6px',color:'#888',fontSize:'15px',cursor:'pointer'}}>✎</button>
                          <button onClick={()=>del('assets',a.id)} style={{padding:'4px 7px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'6px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>✕</button>
                        </div>
                      </div>
                      <p style={{color:'#1a1a2e',fontSize:'15px',fontWeight:600,marginBottom:'6px'}}>{a.name}</p>
                      <p style={{color:'#d4b84a',fontSize:'18px',fontWeight:700}}>R$ {Number(a.estimated_value).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm==='t' && (
        <Modal title={editing?'Editar Lançamento':'Novo Lançamento'} onClose={()=>setShowForm('')}>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <input placeholder="Título *" value={tForm.title} onChange={e=>setTForm(f=>({...f,title:e.target.value}))} style={inp} />
            <input placeholder="Valor *" type="number" step="0.01" value={tForm.amount} onChange={e=>setTForm(f=>({...f,amount:e.target.value}))} style={inp} />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Tipo</label>
                <select value={tForm.type} onChange={e=>setTForm(f=>({...f,type:e.target.value}))} style={sel}><option value="receita">Receita</option><option value="despesa">Despesa</option></select></div>
              <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Categoria</label>
                <select value={tForm.category} onChange={e=>setTForm(f=>({...f,category:e.target.value}))} style={sel}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Data</label>
              <input type="date" value={tForm.date} onChange={e=>setTForm(f=>({...f,date:e.target.value}))} style={{...inp,colorScheme:'light'}} /></div>
            <textarea placeholder="Notas" value={tForm.notes} onChange={e=>setTForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'64px'}} />
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button onClick={saveTransaction} disabled={!tForm.title.trim()||!tForm.amount||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!tForm.title.trim()||!tForm.amount||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'10px 14px',background:'transparent',border:'1px solid #e5e5ea',borderRadius:'10px',color:'#888',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {showForm==='c' && (
        <Modal title={editing?'Editar Cartão':'Novo Cartão'} onClose={()=>setShowForm('')}>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <input placeholder="Nome do cartão *" value={cForm.name} onChange={e=>setCForm(f=>({...f,name:e.target.value}))} style={inp} />
            <input placeholder="Limite total (R$)" type="number" value={cForm.limit_total} onChange={e=>setCForm(f=>({...f,limit_total:e.target.value}))} style={inp} />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Dia fechamento</label>
                <input type="number" min="1" max="31" placeholder="Ex: 15" value={cForm.closing_day} onChange={e=>setCForm(f=>({...f,closing_day:e.target.value}))} style={inp} /></div>
              <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Dia vencimento</label>
                <input type="number" min="1" max="31" placeholder="Ex: 22" value={cForm.due_day} onChange={e=>setCForm(f=>({...f,due_day:e.target.value}))} style={inp} /></div>
            </div>
            <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Cor</label>
              <input type="color" value={cForm.color} onChange={e=>setCForm(f=>({...f,color:e.target.value}))} style={{width:'100%',height:'40px',borderRadius:'10px',border:'1px solid #e5e5ea',background:'#fff',cursor:'pointer'}} /></div>
            <textarea placeholder="Notas" value={cForm.notes} onChange={e=>setCForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'64px'}} />
            {!editing&&cForm.due_day&&<p style={{fontSize:'15px',color:'rgba(91,80,214,0.6)',background:'rgba(91,80,214,0.08)',borderRadius:'8px',padding:'8px 12px'}}>O vencimento aparecerá automaticamente na agenda todo mês</p>}
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button onClick={saveCard} disabled={!cForm.name.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!cForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'10px 14px',background:'transparent',border:'1px solid #e5e5ea',borderRadius:'10px',color:'#888',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {showForm==='b' && (
        <Modal title={editing?'Editar Conta':'Nova Conta a Pagar'} onClose={()=>setShowForm('')}>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <input placeholder="Título *" value={bForm.title} onChange={e=>setBForm(f=>({...f,title:e.target.value}))} style={inp} />
            <input placeholder="Valor (R$)" type="number" value={bForm.amount} onChange={e=>setBForm(f=>({...f,amount:e.target.value}))} style={inp} />
            <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Categoria</label>
              <select value={bForm.category} onChange={e=>setBForm(f=>({...f,category:e.target.value}))} style={sel}>{BILL_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Dia vencimento</label>
                <input type="number" min="1" max="31" placeholder="Ex: 10" value={bForm.due_day} onChange={e=>setBForm(f=>({...f,due_day:e.target.value}))} style={inp} /></div>
              <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Data específica</label>
                <input type="date" value={bForm.due_date} onChange={e=>setBForm(f=>({...f,due_date:e.target.value}))} style={{...inp,colorScheme:'light'}} /></div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <input type="checkbox" id="brec" checked={bForm.is_recurring} onChange={e=>setBForm(f=>({...f,is_recurring:e.target.checked}))} style={{cursor:'pointer'}} />
              <label htmlFor="brec" style={{fontSize:'15px',color:'#666',cursor:'pointer'}}>Recorrente mensal</label>
            </div>
            {!editing&&<p style={{fontSize:'15px',color:'rgba(91,80,214,0.6)',background:'rgba(91,80,214,0.08)',borderRadius:'8px',padding:'8px 12px'}}>Aparecerá automaticamente na agenda</p>}
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button onClick={saveBill} disabled={!bForm.title.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!bForm.title.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'10px 14px',background:'transparent',border:'1px solid #e5e5ea',borderRadius:'10px',color:'#888',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {showForm==='i' && (
        <Modal title={editing?'Editar Investimento':'Novo Investimento'} onClose={()=>setShowForm('')}>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <input placeholder="Nome *" value={iForm.name} onChange={e=>setIForm(f=>({...f,name:e.target.value}))} style={inp} />
            <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Tipo</label>
              <select value={iForm.type} onChange={e=>setIForm(f=>({...f,type:e.target.value}))} style={sel}>{INVEST_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Valor investido</label>
                <input type="number" placeholder="R$ 0,00" value={iForm.amount_invested} onChange={e=>setIForm(f=>({...f,amount_invested:e.target.value}))} style={inp} /></div>
              <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Valor atual</label>
                <input type="number" placeholder="R$ 0,00" value={iForm.current_value} onChange={e=>setIForm(f=>({...f,current_value:e.target.value}))} style={inp} /></div>
            </div>
            <textarea placeholder="Notas" value={iForm.notes} onChange={e=>setIForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'64px'}} />
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button onClick={saveInvestment} disabled={!iForm.name.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!iForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'10px 14px',background:'transparent',border:'1px solid #e5e5ea',borderRadius:'10px',color:'#888',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {showForm==='a' && (
        <Modal title={editing?'Editar Ativo':'Novo Ativo'} onClose={()=>setShowForm('')}>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <input placeholder="Nome *" value={aForm.name} onChange={e=>setAForm(f=>({...f,name:e.target.value}))} style={inp} />
            <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Tipo</label>
              <select value={aForm.type} onChange={e=>setAForm(f=>({...f,type:e.target.value}))} style={sel}>{ASSET_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={{fontSize:'15px',color:'#999',display:'block',marginBottom:'4px'}}>Valor estimado</label>
              <input type="number" placeholder="R$ 0,00" value={aForm.estimated_value} onChange={e=>setAForm(f=>({...f,estimated_value:e.target.value}))} style={inp} /></div>
            <textarea placeholder="Notas" value={aForm.notes} onChange={e=>setAForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'64px'}} />
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button onClick={saveAsset} disabled={!aForm.name.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#1a1a2e',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!aForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'10px 14px',background:'transparent',border:'1px solid #e5e5ea',borderRadius:'10px',color:'#888',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
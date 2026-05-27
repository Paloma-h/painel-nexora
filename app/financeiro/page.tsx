'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

const USER_ID = 'paloma'
const CATEGORIES = ['alimentação', 'transporte', 'saúde', 'educação', 'lazer', 'moradia', 'trabalho', 'outros']
const EMPTY = { title: '', amount: '', type: 'receita', category: 'outros', date: '', notes: '' }

function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  async function logout() { await supabase.auth.signOut(); router.push('/login') }
  return (
    <div style={{width:'160px',background:'#0d0d1a',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',padding:'20px 12px',flexShrink:0,minHeight:'100vh'}}>
      <div style={{color:'#7c6ff7',fontWeight:700,fontSize:'16px',marginBottom:'28px',padding:'0 4px'}}>NEXORA</div>
      <Link href="/dashboard" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/dashboard'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/dashboard'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none'}}>Dashboard</Link>
      <Link href="/agenda" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/agenda'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/agenda'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none'}}>Agenda</Link>
      <Link href="/crm" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/crm'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/crm'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none'}}>CRM</Link>
      <Link href="/financeiro" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/financeiro'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/financeiro'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/financeiro'?500:400}}>Financeiro</Link>
      <div style={{marginTop:'auto'}}>
        <button onClick={logout} style={{display:'block',width:'100%',padding:'9px 12px',borderRadius:'10px',fontSize:'12px',color:'rgba(255,255,255,0.2)',background:'transparent',border:'none',textAlign:'left',cursor:'pointer'}}>Sair</button>
      </div>
    </div>
  )
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('transactions').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false})
    setTransactions(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(EMPTY); setError(''); setShowForm(true) }
  function openEdit(t: any) { setEditing(t); setForm({title:t.title,amount:t.amount.toString(),type:t.type,category:t.category,date:t.date||'',notes:t.notes||''}); setError(''); setShowForm(true) }

  async function save() {
    if (!form.title.trim() || !form.amount) return
    setSaving(true); setError('')
    const data = {title:form.title.trim(),amount:parseFloat(form.amount),type:form.type,category:form.category,date:form.date||null,notes:form.notes||null,user_id:USER_ID}
    const { error } = editing ? await supabase.from('transactions').update(data).eq('id', editing.id) : await supabase.from('transactions').insert({...data,id:crypto.randomUUID()})
    if (error) { setError(error.message); setSaving(false); return }
    setShowForm(false); setSaving(false); load()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    await supabase.from('transactions').delete().eq('id', id); load()
  }

  const receitas = transactions.filter(t => t.type==='receita').reduce((s,t) => s+t.amount, 0)
  const despesas = transactions.filter(t => t.type==='despesa').reduce((s,t) => s+t.amount, 0)
  const saldo = receitas - despesas

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,padding:'32px',overflowY:'auto'}}>
        <div style={{maxWidth:'800px',margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
            <div>
              <h1 style={{color:'#fff',fontSize:'22px',fontWeight:700}}>Financeiro</h1>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>{transactions.length} lançamentos</p>
            </div>
            <button onClick={openNew} style={{padding:'8px 16px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Novo Lançamento</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'24px'}}>
            <div style={{background:'rgba(76,175,125,0.08)',border:'1px solid rgba(76,175,125,0.15)',borderRadius:'12px',padding:'16px'}}>
              <p style={{color:'rgba(76,175,125,0.6)',fontSize:'11px',marginBottom:'4px'}}>Receitas</p>
              <p style={{color:'#4caf7d',fontSize:'20px',fontWeight:700}}>R$ {receitas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
            </div>
            <div style={{background:'rgba(224,82,82,0.08)',border:'1px solid rgba(224,82,82,0.15)',borderRadius:'12px',padding:'16px'}}>
              <p style={{color:'rgba(224,82,82,0.6)',fontSize:'11px',marginBottom:'4px'}}>Despesas</p>
              <p style={{color:'#e05252',fontSize:'20px',fontWeight:700}}>R$ {despesas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
            </div>
            <div style={{background:saldo>=0?'rgba(91,80,214,0.08)':'rgba(224,82,82,0.08)',border:`1px solid ${saldo>=0?'rgba(91,80,214,0.15)':'rgba(224,82,82,0.15)'}`,borderRadius:'12px',padding:'16px'}}>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:'11px',marginBottom:'4px'}}>Saldo</p>
              <p style={{color:saldo>=0?'#a89ff7':'#e05252',fontSize:'20px',fontWeight:700}}>R$ {saldo.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
            </div>
          </div>
          {loading ? <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {transactions.length===0 && <p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhum lançamento ainda!</p>}
              {transactions.map(t => (
                <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{width:'3px',height:'36px',borderRadius:'2px',background:t.type==='receita'?'#4caf7d':'#e05252',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{color:'#fff',fontSize:'13px',fontWeight:500}}>{t.title}</p>
                    <div style={{display:'flex',gap:'8px',marginTop:'2px'}}>
                      <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>{t.category}</span>
                      {t.date && <span style={{color:'rgba(255,255,255,0.2)',fontSize:'11px'}}>{new Date(t.date+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                  <p style={{color:t.type==='receita'?'#4caf7d':'#e05252',fontSize:'14px',fontWeight:700}}>{t.type==='receita'?'+':'-'} R$ {parseFloat(t.amount).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
                  <button onClick={() => openEdit(t)} style={{padding:'6px 10px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'8px',color:'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer'}}>✎</button>
                  <button onClick={() => remove(t.id)} style={{padding:'6px 10px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'8px',color:'#e05252',fontSize:'12px',cursor:'pointer'}}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div style={{width:'100%',maxWidth:'440px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600}}>{editing?'Editar Lançamento':'Novo Lançamento'}</h2>
              <button onClick={() => setShowForm(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Título *" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <input placeholder="Valor *" type="number" step="0.01" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div>
                  <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Tipo</label>
                  <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} style={{width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none'}}>
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Categoria</label>
                  <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} style={{width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none'}}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Data</label>
                <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none',colorScheme:'dark'}} />
              </div>
              <textarea placeholder="Notas" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none',resize:'none',height:'64px'}} />
              {error && <p style={{color:'#e05252',fontSize:'12px',background:'rgba(224,82,82,0.1)',borderRadius:'8px',padding:'8px 12px'}}>{error}</p>}
              <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                <button onClick={save} disabled={!form.title.trim()||!form.amount||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!form.title.trim()||!form.amount||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
                <button onClick={() => setShowForm(false)} style={{padding:'10px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
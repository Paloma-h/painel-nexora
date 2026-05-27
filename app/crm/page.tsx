'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

const USER_ID = 'paloma'
const STATUSES = ['Prospecção', 'Contato', 'Negociando', 'Ganho', 'Perdido']
const EMPTY = { name: '', email: '', phone: '', company: '', status: 'Prospecção', value: '', notes: '', next_followup: '', followup_notes: '' }

function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  async function logout() { await supabase.auth.signOut(); router.push('/login') }
  return (
    <div style={{width:'160px',background:'#0d0d1a',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',padding:'20px 12px',flexShrink:0,minHeight:'100vh'}}>
      <div style={{color:'#7c6ff7',fontWeight:700,fontSize:'16px',marginBottom:'28px',padding:'0 4px'}}>NEXORA</div>
      <Link href="/dashboard" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/dashboard'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/dashboard'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none'}}>Dashboard</Link>
      <Link href="/agenda" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/agenda'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/agenda'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none'}}>Agenda</Link>
      <Link href="/crm" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/crm'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/crm'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/crm'?500:400}}>CRM</Link>
      <Link href="/financeiro" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/financeiro'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/financeiro'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none'}}>Financeiro</Link>
      <div style={{marginTop:'auto'}}>
        <button onClick={logout} style={{display:'block',width:'100%',padding:'9px 12px',borderRadius:'10px',fontSize:'12px',color:'rgba(255,255,255,0.2)',background:'transparent',border:'none',textAlign:'left',cursor:'pointer'}}>Sair</button>
      </div>
    </div>
  )
}

export default function CRMPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false})
    setLeads(data || [])
    setLoading(false)
  }

  function exportCSV() {
    const headers = ['Nome','Email','Telefone','WhatsApp','Empresa','Endereço','Status','Valor','Origem','Produto','Data Compra','Potes','Follow-up','Notas']
    const rows = leads.map((l:any) => [l.name,l.email||'',l.phone||'',l.whatsapp||'',l.company||'',l.address||'',l.status||'',l.value||0,l.source||'',l.product||'',l.purchase_date||'',l.pots_bought||0,l.next_followup||'',l.notes||''])
    const csv = [headers,...rows].map((r:any) => r.map((v:any) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download='crm-nexora.csv'; a.click()
  }

  async function importCSV(e: any) {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').slice(1).filter((l:string) => l.trim())
    let count = 0
    for (const line of lines) {
      const cols = line.split(',').map((c:string) => c.replace(/"/g,'').trim())
      if (!cols[0]) continue
      await supabase.from('leads').insert({id:crypto.randomUUID(),name:cols[0],email:cols[1]||null,phone:cols[2]||null,whatsapp:cols[3]||null,company:cols[4]||null,address:cols[5]||null,status:cols[6]||'Prospecção',value:parseFloat(cols[7])||0,source:cols[8]||'Indicação',product:cols[9]||null,purchase_date:cols[10]||null,pots_bought:parseInt(cols[11])||0,next_followup:cols[12]||null,notes:cols[13]||null,user_id:USER_ID})
      count++
    }
    alert(`${count} leads importados!`)
    load()
  }
  function openNew() { setEditing(null); setForm(EMPTY); setError(''); setShowForm(true) }
  function openEdit(lead: any) {
    setEditing(lead)
    setForm({name:lead.name,email:lead.email||'',phone:lead.phone||'',company:lead.company||'',status:lead.status,value:lead.value?.toString()||'',notes:lead.notes||'',next_followup:lead.next_followup||'',followup_notes:lead.followup_notes||''})
    setError(''); setShowForm(true)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true); setError('')
    const data: any = {name:form.name.trim(),email:form.email||null,phone:form.phone||null,company:form.company||null,status:form.status,value:form.value?parseFloat(form.value):0,notes:form.notes||null,next_followup:form.next_followup||null,followup_notes:form.followup_notes||null,user_id:USER_ID}
    const { error } = editing ? await supabase.from('leads').update(data).eq('id', editing.id) : await supabase.from('leads').insert({...data,id:crypto.randomUUID()})
    if (error) { setError(error.message); setSaving(false); return }
    if (form.next_followup && !editing) {
      await supabase.from('tasks').insert({id:crypto.randomUUID(),title:`Follow-up: ${form.name.trim()}`,date:form.next_followup,notes:form.followup_notes||null,type:'task',status:'PENDING',priority:'HIGH',category:'trabalho',user_id:USER_ID})
    }
    setShowForm(false); setSaving(false); load()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este lead?')) return
    await supabase.from('leads').delete().eq('id', id); load()
  }

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,padding:'32px',overflowY:'auto'}}>
        <div style={{maxWidth:'800px',margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
            <div>
              <h1 style={{color:'#fff',fontSize:'22px',fontWeight:700}}>CRM</h1>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>{leads.length} leads</p>
            </div>
            <div style={{display:'flex',gap:'8px'}}><label style={{padding:'8px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer'}}>Importar CSV<input type='file' accept='.csv' onChange={importCSV} style={{display:'none'}} /></label><button onClick={exportCSV} style={{padding:'8px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer'}}>Exportar CSV</button><button onClick={openNew} style={{padding:'8px 16px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Novo Lead</button></div>
          </div>
          {loading ? <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {leads.length===0 && <p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhum lead ainda!</p>}
              {leads.map(l => (
                <div key={l.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'rgba(91,80,214,0.3)',display:'flex',alignItems:'center',justifyContent:'center',color:'#a89ff7',fontWeight:700,fontSize:'14px',flexShrink:0}}>{l.name.charAt(0).toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{color:'#fff',fontSize:'13px',fontWeight:500}}>{l.name}</p>
                    <div style={{display:'flex',gap:'8px',marginTop:'2px'}}>
                      {l.company && <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>{l.company}</span>}
                      {l.value>0 && <span style={{color:'#4caf7d',fontSize:'11px'}}>R$ {l.value.toLocaleString('pt-BR')}</span>}
                      {l.next_followup && <span style={{color:'rgba(91,80,214,0.8)',fontSize:'11px'}}>Follow-up: {new Date(l.next_followup+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                  <span style={{fontSize:'11px',padding:'3px 10px',borderRadius:'6px',background:l.status==='Ganho'?'rgba(76,175,125,0.15)':l.status==='Perdido'?'rgba(224,82,82,0.15)':'rgba(255,255,255,0.08)',color:l.status==='Ganho'?'#4caf7d':l.status==='Perdido'?'#e05252':'rgba(255,255,255,0.4)',fontWeight:500}}>{l.status}</span>
                  <button onClick={() => openEdit(l)} style={{padding:'6px 10px',background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'8px',color:'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer'}}>✎</button>
                  <button onClick={() => remove(l.id)} style={{padding:'6px 10px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'8px',color:'#e05252',fontSize:'12px',cursor:'pointer'}}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div style={{width:'100%',maxWidth:'460px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600}}>{editing?'Editar Lead':'Novo Lead'}</h2>
              <button onClick={() => setShowForm(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Nome *" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <input placeholder="Email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <input placeholder="Telefone" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <input placeholder="Empresa" value={form.company} onChange={e => setForm(f=>({...f,company:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <input placeholder="Valor (R$)" type="number" value={form.value} onChange={e => setForm(f=>({...f,value:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
              <div>
                <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Status</label>
                <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))} style={{width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none'}}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{background:'rgba(91,80,214,0.05)',borderRadius:'10px',padding:'12px',border:'1px solid rgba(91,80,214,0.15)'}}>
                <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Data do follow-up</label>
                <input type="date" value={form.next_followup} onChange={e => setForm(f=>({...f,next_followup:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none',colorScheme:'dark'}} />
                <input placeholder="Observação" value={form.followup_notes} onChange={e => setForm(f=>({...f,followup_notes:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none',marginTop:'8px'}} />
                <p style={{fontSize:'10px',color:'rgba(91,80,214,0.6)',marginTop:'6px'}}>Aparece automaticamente na agenda</p>
              </div>
              <textarea placeholder="Notas" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'10px 12px',color:'#fff',fontSize:'13px',outline:'none',resize:'none',height:'64px'}} />
              {error && <p style={{color:'#e05252',fontSize:'12px',background:'rgba(224,82,82,0.1)',borderRadius:'8px',padding:'8px 12px'}}>{error}</p>}
              <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'10px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
                <button onClick={() => setShowForm(false)} style={{padding:'10px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
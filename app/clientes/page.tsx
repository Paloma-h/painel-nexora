'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

const USER_ID = 'paloma'
const SOURCES = ['Indicação', 'Facebook', 'TikTok', 'Instagram', 'Outra pessoa', 'Outro']
const RELATIONS = ['Cônjuge', 'Filho(a)', 'Mãe', 'Pai', 'Irmão/Irmã', 'Amigo(a)', 'Outro']
const EMPTY = { name:'', email:'', phone:'', whatsapp:'', phone2:'', phone2_name:'', phone2_relation:'', address:'', children_count:'0', children_ages:'', difficulties:'', source:'Indicação', product:'', purchase_date:'', pots_bought:'0', notes:'', status:'Ativo' }

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
      <Link href="/clientes" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/clientes'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/clientes'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/clientes'?500:400}}>Clientes</Link>
      <Link href="/financeiro" style={{display:'block',padding:'9px 12px',borderRadius:'10px',fontSize:'13px',color:path==='/financeiro'?'#a89ff7':'rgba(255,255,255,0.35)',background:path==='/financeiro'?'rgba(91,80,214,0.2)':'transparent',marginBottom:'2px',textDecoration:'none',fontWeight:path==='/financeiro'?500:400}}>Financeiro</Link>
      <div style={{marginTop:'auto'}}>
        <button onClick={logout} style={{display:'block',width:'100%',padding:'9px 12px',borderRadius:'10px',fontSize:'12px',color:'rgba(255,255,255,0.2)',background:'transparent',border:'none',textAlign:'left',cursor:'pointer'}}>Sair</button>
      </div>
    </div>
  )
}

const inputStyle: any = {width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'9px 12px',color:'#fff',fontSize:'13px',outline:'none',boxSizing:'border-box'}
const selectStyle: any = {width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'9px 12px',color:'#fff',fontSize:'13px',outline:'none'}

function Section({ title }: { title: string }) {
  return <div style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'1px',marginTop:'16px',marginBottom:'8px',paddingBottom:'6px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{title}</div>
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>{label}</label>
      {children}
    </div>
  )
}

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false})
    setClients(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(EMPTY); setError(''); setShowForm(true) }
  function openEdit(c: any) {
    setEditing(c)
    setForm({
      name:c.name||'', email:c.email||'', phone:c.phone||'', whatsapp:c.whatsapp||'',
      phone2:c.phone2||'', phone2_name:c.phone2_name||'', phone2_relation:c.phone2_relation||'',
      address:c.address||'', children_count:c.children_count?.toString()||'0',
      children_ages:c.children_ages||'', difficulties:c.difficulties||'',
      source:c.source||'Indicação', product:c.product||'',
      purchase_date:c.purchase_date||'', pots_bought:c.pots_bought?.toString()||'0',
      notes:c.notes||'', status:c.status||'Ativo'
    })
    setError(''); setShowForm(true)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true); setError('')
    const data: any = {
      name:form.name.trim(), email:form.email||null, phone:form.phone||null,
      whatsapp:form.whatsapp||null, phone2:form.phone2||null, phone2_name:form.phone2_name||null,
      phone2_relation:form.phone2_relation||null, address:form.address||null,
      children_count:parseInt(form.children_count)||0, children_ages:form.children_ages||null,
      difficulties:form.difficulties||null, source:form.source,
      product:form.product||null, purchase_date:form.purchase_date||null,
      pots_bought:parseInt(form.pots_bought)||0, notes:form.notes||null,
      status:form.status, user_id:USER_ID
    }
    const { error } = editing
      ? await supabase.from('clients').update(data).eq('id', editing.id)
      : await supabase.from('clients').insert({...data, id:crypto.randomUUID()})
    if (error) { setError(error.message); setSaving(false); return }
    setShowForm(false); setSaving(false); load()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este cliente?')) return
    await supabase.from('clients').delete().eq('id', id); load()
  }

  function exportCSV() {
    const headers = ['Nome','Email','Telefone','WhatsApp','Endereço','Produto','Data Compra','Potes','Origem','Status','Notas']
    const rows = clients.map(c => [c.name,c.email||'',c.phone||'',c.whatsapp||'',c.address||'',c.product||'',c.purchase_date||'',c.pots_bought||0,c.source||'',c.status||'',c.notes||''])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'clientes-nexora.csv'; a.click()
  }

  async function importCSV(e: any) {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').slice(1).filter(l => l.trim())
    let count = 0
    for (const line of lines) {
      const cols = line.split(',').map((c:string) => c.replace(/"/g,'').trim())
      if (!cols[0]) continue
      await supabase.from('clients').insert({
        id:crypto.randomUUID(), name:cols[0], email:cols[1]||null, phone:cols[2]||null,
        whatsapp:cols[3]||null, address:cols[4]||null, product:cols[5]||null,
        purchase_date:cols[6]||null, pots_bought:parseInt(cols[7])||0,
        source:cols[8]||'Indicação', status:cols[9]||'Ativo', notes:cols[10]||null, user_id:USER_ID
      })
      count++
    }
    alert(`${count} clientes importados!`)
    load()
  }

  function daysLeft(c: any) {
    if (!c.purchase_date || !c.pots_bought) return null
    const end = new Date(c.purchase_date)
    end.setDate(end.getDate() + c.pots_bought * 30)
    return Math.ceil((end.getTime() - new Date().getTime()) / (1000*60*60*24))
  }

  const sourceColor: any = {'Indicação':'#7c6ff7','Facebook':'#4267B2','TikTok':'#e05252','Instagram':'#e08c42','Outra pessoa':'#4caf7d','Outro':'#888'}
  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search))

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
        <div style={{maxWidth:'900px',margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <div>
              <h1 style={{color:'#fff',fontSize:'22px',fontWeight:700}}>Clientes</h1>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>{clients.length} clientes cadastrados</p>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <label style={{padding:'8px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer'}}>
                Importar CSV
                <input type="file" accept=".csv" onChange={importCSV} style={{display:'none'}} />
              </label>
              <button onClick={exportCSV} style={{padding:'8px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer'}}>Exportar CSV</button>
              <button onClick={openNew} style={{padding:'8px 18px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Novo Cliente</button>
            </div>
          </div>

          <input placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'9px 14px',color:'#fff',fontSize:'13px',outline:'none',marginBottom:'16px',boxSizing:'border-box'}} />

          {loading ? <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {filtered.length===0 && <p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhum cliente encontrado</p>}
              {filtered.map(c => {
                const days = daysLeft(c)
                const isLow = days !== null && days <= 10
                const isOver = days !== null && days <= 0
                return (
                  <div key={c.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:`1px solid ${isOver?'rgba(224,82,82,0.4)':isLow?'rgba(224,82,82,0.2)':'rgba(255,255,255,0.08)'}`,cursor:'pointer'}} onClick={() => openEdit(c)}>
                    <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(76,175,125,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#4caf7d',fontWeight:700,fontSize:'15px',flexShrink:0}}>{c.name.charAt(0).toUpperCase()}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                        <p style={{color:'#fff',fontSize:'13px',fontWeight:500}}>{c.name}</p>
                        {c.source && <span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'5px',background:`${sourceColor[c.source]}22`,color:sourceColor[c.source]}}>{c.source}</span>}
                        {c.product && <span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'5px',background:'rgba(76,175,125,0.1)',color:'#4caf7d'}}>{c.product}</span>}
                      </div>
                      <div style={{display:'flex',gap:'10px',marginTop:'3px',flexWrap:'wrap'}}>
                        {c.phone && <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>{c.phone}</span>}
                        {c.pots_bought>0 && <span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>{c.pots_bought} potes</span>}
                        {days !== null && <span style={{color:isOver?'#e05252':isLow?'#e08c42':'rgba(255,255,255,0.3)',fontSize:'11px',fontWeight:isLow?600:400}}>{isOver?'Potes acabaram!':isLow?`⚠ ${days} dias restantes`:`${days} dias restantes`}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                      {c.whatsapp && (
                        <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{padding:'6px 10px',background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.2)',borderRadius:'8px',color:'#25d366',fontSize:'12px',textDecoration:'none',fontWeight:600}}>WhatsApp</a>
                      )}
                      <span style={{fontSize:'11px',padding:'3px 10px',borderRadius:'6px',background:c.status==='Ativo'?'rgba(76,175,125,0.15)':'rgba(255,255,255,0.08)',color:c.status==='Ativo'?'#4caf7d':'rgba(255,255,255,0.4)',fontWeight:500}}>{c.status}</span>
                      <button onClick={e => {e.stopPropagation();remove(c.id)}} style={{padding:'6px 10px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'8px',color:'#e05252',fontSize:'12px',cursor:'pointer'}}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'560px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
              <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600}}>{editing?'Editar Cliente':'Novo Cliente'}</h2>
              <button onClick={() => setShowForm(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>

            <Section title="Informações básicas" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Nome completo *" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={inputStyle} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Field label="Telefone"><input placeholder="(00) 00000-0000" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} style={inputStyle} /></Field>
                <Field label="WhatsApp"><input placeholder="(00) 00000-0000" value={form.whatsapp} onChange={e => setForm(f=>({...f,whatsapp:e.target.value}))} style={inputStyle} /></Field>
              </div>
              <input placeholder="Email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} style={inputStyle} />
              <input placeholder="Endereço" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} style={inputStyle} />
            </div>

            <Section title="Contato secundário" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
              <Field label="Telefone 2"><input placeholder="(00) 00000-0000" value={form.phone2} onChange={e => setForm(f=>({...f,phone2:e.target.value}))} style={inputStyle} /></Field>
              <Field label="Nome"><input placeholder="Nome" value={form.phone2_name} onChange={e => setForm(f=>({...f,phone2_name:e.target.value}))} style={inputStyle} /></Field>
              <Field label="Parentesco">
                <select value={form.phone2_relation} onChange={e => setForm(f=>({...f,phone2_relation:e.target.value}))} style={selectStyle}>
                  <option value="">Selecione</option>
                  {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </div>

            <Section title="Perfil familiar" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Field label="Qtd. filhos"><input type="number" min="0" value={form.children_count} onChange={e => setForm(f=>({...f,children_count:e.target.value}))} style={inputStyle} /></Field>
                <Field label="Idades dos filhos"><input placeholder="Ex: 3, 7, 12 anos" value={form.children_ages} onChange={e => setForm(f=>({...f,children_ages:e.target.value}))} style={inputStyle} /></Field>
              </div>
              <Field label="Dificuldades enfrentadas">
                <textarea placeholder="Ex: cansaço, falta de foco..." value={form.difficulties} onChange={e => setForm(f=>({...f,difficulties:e.target.value}))} style={{...inputStyle,resize:'none',height:'72px'}} />
              </Field>
            </div>

            <Section title="Origem do contato" />
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px'}}>
              {SOURCES.map(s => (
                <button key={s} onClick={() => setForm(f=>({...f,source:s}))} style={{padding:'8px 4px',borderRadius:'8px',border:`1px solid ${form.source===s?sourceColor[s]:'rgba(255,255,255,0.08)'}`,background:form.source===s?`${sourceColor[s]}22`:'transparent',color:form.source===s?sourceColor[s]:'rgba(255,255,255,0.35)',fontSize:'12px',cursor:'pointer',fontWeight:form.source===s?600:400}}>{s}</button>
              ))}
            </div>

            <Section title="Compra" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <Field label="Produto"><input placeholder="Suplemento" value={form.product} onChange={e => setForm(f=>({...f,product:e.target.value}))} style={inputStyle} /></Field>
                <Field label="Data da compra"><input type="date" value={form.purchase_date} onChange={e => setForm(f=>({...f,purchase_date:e.target.value}))} style={{...inputStyle,colorScheme:'dark'}} /></Field>
                <Field label="Qtd. potes"><input type="number" min="0" value={form.pots_bought} onChange={e => setForm(f=>({...f,pots_bought:e.target.value}))} style={inputStyle} /></Field>
              </div>
              {form.purchase_date && parseInt(form.pots_bought) > 0 && (
                <p style={{fontSize:'11px',color:'rgba(91,80,214,0.7)',background:'rgba(91,80,214,0.08)',borderRadius:'8px',padding:'8px 12px'}}>
                  Potes terminam em: {new Date(new Date(form.purchase_date).getTime() + parseInt(form.pots_bought) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')} — alerta no dashboard com 10 dias
                </p>
              )}
              <Field label="Status">
                <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))} style={selectStyle}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Recompra">Recompra</option>
                </select>
              </Field>
            </div>

            <Section title="Notas" />
            <textarea placeholder="Observações sobre o cliente..." value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} style={{...inputStyle,resize:'none',height:'80px'}} />

            {error && <p style={{color:'#e05252',fontSize:'12px',background:'rgba(224,82,82,0.1)',borderRadius:'8px',padding:'8px 12px',marginTop:'10px'}}>{error}</p>}

            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={() => setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
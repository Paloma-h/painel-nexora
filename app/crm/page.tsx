'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'
const STATUSES = ['Prospecção', 'Contato', 'Negociando', 'Ganho', 'Perdido']
const SOURCES = ['Indicação', 'Facebook', 'TikTok', 'Instagram', 'Outra pessoa', 'Outro']
const RELATIONS = ['Cônjuge', 'Filho(a)', 'Mãe', 'Pai', 'Irmão/Irmã', 'Amigo(a)', 'Outro']
const EMPTY_LEAD = { commission:'', name:'', email:'', phone:'', whatsapp:'', phone2:'', phone2_name:'', phone2_relation:'', company:'', address:'', status:'Prospecção', value:'', notes:'', next_followup:'', followup_notes:'', source:'Indicação', children_count:'0', children_ages:'', difficulties:'', purchase_date:'', pots_bought:'0', product:'' }
const EMPTY_CLIENT = { name:'', email:'', phone:'', whatsapp:'', phone2:'', phone2_name:'', phone2_relation:'', address:'', children_count:'0', children_ages:'', difficulties:'', source:'Indicação', product:'', purchase_date:'', pots_bought:'0', notes:'', status:'Ativo' }
const EMPTY_FORNECEDOR = { name:'', company:'', category:'', product:'', phone:'', whatsapp:'', email:'', instagram:'', notes:'' }
const FORN_CATS = ['Suplementos','Embalagens','Gráfica','Marketing','Tecnologia','Logística','Alimentos','Serviços','Outro']

const inp: any = {width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'9px 12px',color:'#fff',fontSize:'13px',outline:'none',boxSizing:'border-box'}
const sel: any = {width:'100%',background:'#13131f',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'9px 12px',color:'#fff',fontSize:'13px',outline:'none'}
const sourceColor: any = {'Indicação':'#7c6ff7','Facebook':'#4267B2','TikTok':'#e05252','Instagram':'#e08c42','Outra pessoa':'#4caf7d','Outro':'#888'}

function Sec({title}:{title:string}) {
  return <div style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'1px',marginTop:'16px',marginBottom:'8px',paddingBottom:'6px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{title}</div>
}
function Fld({label,children}:{label:string,children:any}) {
  return <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>{label}</label>{children}</div>
}

export default function CRMPage() {
  const [tab, setTab] = useState('leads')
  const [leads, setLeads] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [leadForm, setLeadForm] = useState(EMPTY_LEAD)
  const [clientForm, setClientForm] = useState(EMPTY_CLIENT)
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [fornForm, setFornForm] = useState(EMPTY_FORNECEDOR)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [importMsg, setImportMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [l, c, f] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false}),
      supabase.from('clients').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false}),
      supabase.from('fornecedores').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false})
    ])
    setLeads(l.data || [])
    setClients(c.data || [])
    setFornecedores(f.data || [])
    setLoading(false)
  }

  function openNewForn() { setEditing(null); setFornForm(EMPTY_FORNECEDOR); setError(''); setShowForm('forn') }
  function openEditForn(f: any) {
    setEditing(f)
    setFornForm({name:f.name||'',company:f.company||'',category:f.category||'',product:f.product||'',phone:f.phone||'',whatsapp:f.whatsapp||'',email:f.email||'',instagram:f.instagram||'',notes:f.notes||''})
    setError(''); setShowForm('forn')
  }
  async function saveForn() {
    if (!fornForm.name.trim()) return
    setSaving(true); setError('')
    const data = {name:fornForm.name.trim(),company:fornForm.company||null,category:fornForm.category||null,product:fornForm.product||null,phone:fornForm.phone||null,whatsapp:fornForm.whatsapp||null,email:fornForm.email||null,instagram:fornForm.instagram||null,notes:fornForm.notes||null,user_id:USER_ID}
    const { error } = editing
      ? await supabase.from('fornecedores').update(data).eq('id', editing.id)
      : await supabase.from('fornecedores').insert({...data, id:crypto.randomUUID()})
    if (error) { setError(error.message); setSaving(false); return }
    setShowForm(''); setSaving(false); load()
  }
  async function removeForn(id: string) {
    if (!confirm('Excluir fornecedor?')) return
    await supabase.from('fornecedores').delete().eq('id', id); load()
  }

  function openNewLead() { setEditing(null); setLeadForm(EMPTY_LEAD); setError(''); setShowForm('lead') }
  function openEditLead(lead: any) {
    setEditing(lead)
    setLeadForm({name:lead.name||'',email:lead.email||'',phone:lead.phone||'',whatsapp:lead.whatsapp||'',phone2:lead.phone2||'',phone2_name:lead.phone2_name||'',phone2_relation:lead.phone2_relation||'',company:lead.company||'',address:lead.address||'',status:lead.status||'Prospecção',value:lead.value?.toString()||'',notes:lead.notes||'',next_followup:lead.next_followup||'',followup_notes:lead.followup_notes||'',source:lead.source||'Indicação',children_count:lead.children_count?.toString()||'0',children_ages:lead.children_ages||'',difficulties:lead.difficulties||'',purchase_date:lead.purchase_date||'',pots_bought:lead.pots_bought?.toString()||'0',product:lead.product||'',commission:lead.commission?.toString()||''})
    setError(''); setShowForm('lead')
  }

  async function saveLead() {
    if (!leadForm.name.trim()) return
    setSaving(true); setError('')
    const data: any = {name:leadForm.name.trim(),email:leadForm.email||null,phone:leadForm.phone||null,whatsapp:leadForm.whatsapp||null,phone2:leadForm.phone2||null,phone2_name:leadForm.phone2_name||null,phone2_relation:leadForm.phone2_relation||null,company:leadForm.company||null,address:leadForm.address||null,status:leadForm.status,value:leadForm.value?parseFloat(leadForm.value):0,notes:leadForm.notes||null,next_followup:leadForm.next_followup||null,followup_notes:leadForm.followup_notes||null,source:leadForm.source,children_count:parseInt(leadForm.children_count)||0,children_ages:leadForm.children_ages||null,difficulties:leadForm.difficulties||null,purchase_date:leadForm.purchase_date||null,pots_bought:parseInt(leadForm.pots_bought)||0,product:leadForm.product||null,user_id:USER_ID}
    const { error } = editing ? await supabase.from('leads').update(data).eq('id', editing.id) : await supabase.from('leads').insert({...data,id:crypto.randomUUID()})
    if (error) { setError(error.message); setSaving(false); return }
    if (leadForm.next_followup && !editing) {
      await supabase.from('tasks').insert({id:crypto.randomUUID(),title:`Follow-up: ${leadForm.name.trim()}`,date:leadForm.next_followup,notes:leadForm.followup_notes||null,type:'task',status:'PENDING',priority:'HIGH',category:'trabalho',user_id:USER_ID})
    }
    if (leadForm.status === 'Ganho' && leadForm.value && parseFloat(leadForm.value) > 0) {
      const confirmFinanceiro = window.confirm(`Deseja registrar R$ ${parseFloat(leadForm.commission||leadForm.value||"0").toFixed(2)} de ${leadForm.name.trim()} no Financeiro?`)
      if (confirmFinanceiro) {
        await supabase.from('transactions').insert({id:crypto.randomUUID(),title:`Venda: ${leadForm.name.trim()}`,amount:parseFloat(leadForm.commission||leadForm.value),type:'receita',category:'trabalho',date:leadForm.purchase_date||new Date().toISOString().split('T')[0],notes:'Origem: CRM',user_id:USER_ID})
      }
    }
    if (leadForm.status === 'Ganho') {
      const existing = await supabase.from('clients').select('id').eq('user_id', USER_ID).eq('name', leadForm.name.trim())
      if (!existing.data || existing.data.length === 0) {
        await supabase.from('clients').insert({id:crypto.randomUUID(),name:leadForm.name.trim(),email:leadForm.email||null,phone:leadForm.phone||null,whatsapp:leadForm.whatsapp||null,phone2:leadForm.phone2||null,phone2_name:leadForm.phone2_name||null,phone2_relation:leadForm.phone2_relation||null,address:leadForm.address||null,children_count:parseInt(leadForm.children_count)||0,children_ages:leadForm.children_ages||null,difficulties:leadForm.difficulties||null,source:leadForm.source,product:leadForm.product||null,purchase_date:leadForm.purchase_date||null,pots_bought:parseInt(leadForm.pots_bought)||0,notes:leadForm.notes||null,status:'Ativo',user_id:USER_ID})
      }
    }
    setShowForm(''); setSaving(false); load()
  }

  async function removeClient(id: string) {
    if (!confirm('Excluir este cliente?')) return
    await supabase.from('clients').delete().eq('id', id); load()
  }

  async function removeLead(id: string) {
    if (!confirm('Excluir este lead?')) return
    await supabase.from('leads').delete().eq('id', id); load()
  }

  function openNewClient() { setEditing(null); setClientForm(EMPTY_CLIENT); setError(''); setShowForm('client') }
  function openEditClient(c: any) {
    setEditing(c)
    setClientForm({name:c.name||'',email:c.email||'',phone:c.phone||'',whatsapp:c.whatsapp||'',phone2:c.phone2||'',phone2_name:c.phone2_name||'',phone2_relation:c.phone2_relation||'',address:c.address||'',children_count:c.children_count?.toString()||'0',children_ages:c.children_ages||'',difficulties:c.difficulties||'',source:c.source||'Indicação',product:c.product||'',purchase_date:c.purchase_date||'',pots_bought:c.pots_bought?.toString()||'0',notes:c.notes||'',status:c.status||'Ativo'})
    setError(''); setShowForm('client')
  }

  async function saveClient() {
    if (!clientForm.name.trim()) return
    setSaving(true); setError('')
    const data: any = {name:clientForm.name.trim(),email:clientForm.email||null,phone:clientForm.phone||null,whatsapp:clientForm.whatsapp||null,phone2:clientForm.phone2||null,phone2_name:clientForm.phone2_name||null,phone2_relation:clientForm.phone2_relation||null,address:clientForm.address||null,children_count:parseInt(clientForm.children_count)||0,children_ages:clientForm.children_ages||null,difficulties:clientForm.difficulties||null,source:clientForm.source,product:clientForm.product||null,purchase_date:clientForm.purchase_date||null,pots_bought:parseInt(clientForm.pots_bought)||0,notes:clientForm.notes||null,status:clientForm.status,user_id:USER_ID}
    const { error } = editing ? await supabase.from('clients').update(data).eq('id', editing.id) : await supabase.from('clients').insert({...data,id:crypto.randomUUID()})
    if (error) { setError(error.message); setSaving(false); return }
    setShowForm(''); setSaving(false); load()
  }

  // ===== EXPORTAR =====
  function exportLeads() {
    const headers = ['Nome','Email','Telefone','WhatsApp','Status','Valor','Origem','Produto','Follow-up','Notas']
    const rows = leads.map(l => [l.name,l.email||'',l.phone||'',l.whatsapp||'',l.status||'',l.value||0,l.source||'',l.product||'',l.next_followup||'',l.notes||''])
    const csv = [headers,...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='leads-nexora.csv'; a.click()
  }

  function exportClients() {
    const headers = ['Nome','Email','Telefone','WhatsApp','Produto','Data Compra','Potes','Origem','Status','Notas']
    const rows = clients.map(c => [c.name,c.email||'',c.phone||'',c.whatsapp||'',c.product||'',c.purchase_date||'',c.pots_bought||0,c.source||'',c.status||'',c.notes||''])
    const csv = [headers,...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='clientes-nexora.csv'; a.click()
  }

  function exportForn() {
    const headers = ['Nome','Empresa','Categoria','Produto','Telefone','WhatsApp','Email','Instagram','Notas']
    const rows = fornecedores.map(f => [f.name,f.company||'',f.category||'',f.product||'',f.phone||'',f.whatsapp||'',f.email||'',f.instagram||'',f.notes||''])
    const csv = [headers,...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='fornecedores-nexora.csv'; a.click()
  }

  // ===== IMPORTAR =====
  function parseCSV(text: string): string[][] {
    const firstLine = text.trim().split('\n')[0]
    const sep = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ','
    return text.trim().split('\n').map(line => {
      const result: string[] = []
      let cur = '', inQ = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') { inQ = !inQ }
        else if (ch === sep && !inQ) { result.push(cur.trim()); cur = '' }
        else { cur += ch }
      }
      result.push(cur.trim())
      return result
    })
  }

  async function importLeads(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImportMsg('Importando...')
    try {
      let rows: string[][] = []
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const XLSX = await import('xlsx')
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, {type:'array'})
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, {header:1, defval:''})
        rows = raw.map((r:any[]) => r.map((v:any) => String(v??'')))
      } else {
        const text = await file.text()
        rows = parseCSV(text)
      }
      const header = rows[0].map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,''))
      const get = (r: string[], keys: string[]) => { for (const k of keys) { const i = header.findIndex(h => h.includes(k)); if (i>=0) return String(r[i]||'').trim() } return '' }
      const parseDate = (v: string) => {
        if (!v || v==='---') return null
        const m = v.match(/(\d{2})\/(\d{2})\/(\d{4})/)
        if (m) return `${m[3]}-${m[2]}-${m[1]}`
        return null
      }
      const data = rows.slice(1).filter(r => get(r,['nome','name'])).map(r => {
        const rawPhone = get(r,['telefone','phone','tel']).replace(/\D/g,'').replace(/^55/,'')
        const statusPag = get(r,['statusdepagamento','statuspag','statuspagamentodavenda']).toLowerCase()
        const leadStatus = statusPag.includes('aprovado') ? 'Ganho' : statusPag.includes('aguardando') ? 'Negociando' : statusPag.includes('reembolso') || statusPag.includes('cancelado') ? 'Perdido' : 'Prospecção'
        const dateRaw = get(r,['datapagamento','datacriacao'])
        return {
          id: crypto.randomUUID(), user_id: USER_ID,
          name: get(r,['nome','name']),
          email: get(r,['email']) || null,
          phone: rawPhone || null,
          whatsapp: rawPhone || null,
          address: [get(r,['rua']), get(r,['numero','nmero']), get(r,['bairro']), get(r,['cidade']), get(r,['estado'])].filter(Boolean).join(', ') || null,
          status: leadStatus,
          value: parseFloat(get(r,['valordavenda','valor','value'])) || 0,
          source: 'Coinzz',
          product: get(r,['produto','oferta']) || null,
          purchase_date: parseDate(dateRaw),
          pots_bought: parseInt(get(r,['quantidade','qtd'])) || 0,
          notes: get(r,['oferta']) || null,
        }
      })
      if (data.length === 0) { setImportMsg('Nenhum dado encontrado no arquivo.'); return }
      const { error } = await supabase.from('leads').insert(data)
      if (error) { setImportMsg('Erro: ' + error.message) } else { setImportMsg(`✓ ${data.length} lead(s) importado(s)!`); load() }
    } catch(err: any) { setImportMsg('Erro ao ler arquivo: ' + err.message) }
    e.target.value = ''
    setTimeout(() => setImportMsg(''), 5000)
  }

  async function importClients(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImportMsg('Importando...')
    try {
      let rows: string[][] = []
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const XLSX = await import('xlsx')
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, {type:'array'})
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, {header:1, defval:''})
        rows = raw.map((r:any[]) => r.map((v:any) => String(v??'')))
      } else {
        const text = await file.text()
        rows = parseCSV(text)
      }
      const header = rows[0].map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,''))
      const get = (r: string[], keys: string[]) => { for (const k of keys) { const i = header.findIndex(h => h.includes(k)); if (i>=0) return String(r[i]||'').trim() } return '' }
      const parseDate = (v: string) => {
        if (!v || v==='---') return null
        const m = v.match(/(\d{2})\/(\d{2})\/(\d{4})/)
        if (m) return `${m[3]}-${m[2]}-${m[1]}`
        return null
      }
      const data = rows.slice(1).filter(r => get(r,['nome','name'])).map(r => {
        const rawPhone = get(r,['telefone','phone','tel']).replace(/\D/g,'').replace(/^55/,'')
        const product = get(r,['produto','product','oferta'])
        const qtd = parseInt(get(r,['quantidade','qtd'])) || 1
        const dateRaw = get(r,['datapagamento','datac','purchasedate','datacriacao'])
        const statusPag = get(r,['statusdepagamento','statuspag','statuspagamento']).toLowerCase()
        const statusCliente = statusPag.includes('aprovado') ? 'Ativo' : statusPag.includes('reembolso') ? 'Inativo' : 'Ativo'
        return {
          id: crypto.randomUUID(), user_id: USER_ID,
          name: get(r,['nome','name']),
          email: get(r,['email']) || null,
          phone: rawPhone || null,
          whatsapp: rawPhone || null,
          address: [get(r,['rua']), get(r,['nmero','numero']), get(r,['bairro']), get(r,['cidade']), get(r,['estado'])].filter(Boolean).join(', ') || null,
          product: product || null,
          purchase_date: parseDate(dateRaw),
          pots_bought: qtd,
          source: 'Outro',
          status: statusCliente,
          notes: get(r,['oferta']) || null,
        }
      })
      if (data.length === 0) { setImportMsg('Nenhum dado encontrado no arquivo.'); return }
      const { error } = await supabase.from('clients').insert(data)
      if (error) { setImportMsg('Erro: ' + error.message) } else { setImportMsg(`✓ ${data.length} cliente(s) importado(s)!`); load() }
    } catch(err: any) { setImportMsg('Erro ao ler arquivo: ' + err.message) }
    e.target.value = ''
    setTimeout(() => setImportMsg(''), 5000)
  }

  async function importForn(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const rows = parseCSV(text)
    const header = rows[0].map(h => h.toLowerCase().replace(/[^a-z]/g,''))
    const data = rows.slice(1).filter(r => r[0]).map(r => {
      const get = (keys: string[]) => { for (const k of keys) { const i = header.findIndex(h => h.includes(k)); if (i>=0) return r[i]||'' } return '' }
      return {
        id: crypto.randomUUID(), user_id: USER_ID,
        name: get(['nome','name']),
        company: get(['empresa','company']) || null,
        category: get(['categoria','category']) || null,
        product: get(['produto','product']) || null,
        phone: get(['telefone','phone','tel']) || null,
        whatsapp: get(['whatsapp','wha']) || null,
        email: get(['email']) || null,
        instagram: get(['instagram','insta']) || null,
        notes: get(['nota','note','obs']) || null,
      }
    })
    if (data.length === 0) { setImportMsg('Nenhum dado encontrado no arquivo.'); return }
    const { error } = await supabase.from('fornecedores').insert(data)
    if (error) { setImportMsg('Erro: ' + error.message) } else { setImportMsg(`✓ ${data.length} fornecedor(es) importado(s)!`); load() }
    e.target.value = ''
    setTimeout(() => setImportMsg(''), 4000)
  }

  function daysLeft(c: any) {
    if (!c.purchase_date || !c.pots_bought) return null
    const end = new Date(c.purchase_date)
    end.setDate(end.getDate() + c.pots_bought * 30)
    return Math.ceil((end.getTime() - new Date().getTime()) / (1000*60*60*24))
  }

  const filteredLeads = leads.filter(l => {
    const ms = l.name.toLowerCase().includes(search.toLowerCase()) || (l.phone||'').includes(search)
    const mf = filterStatus === 'Todos' || l.status === filterStatus
    return ms && mf
  })

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search))

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0f',fontFamily:'system-ui,sans-serif'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column',overflowY:'auto'}}>

        {importMsg && (
          <div style={{position:'fixed',top:'16px',right:'16px',zIndex:100,background:importMsg.startsWith('✓')?'rgba(76,175,125,0.15)':'rgba(224,82,82,0.15)',border:`1px solid ${importMsg.startsWith('✓')?'rgba(76,175,125,0.3)':'rgba(224,82,82,0.3)'}`,borderRadius:'10px',padding:'10px 16px',color:importMsg.startsWith('✓')?'#4caf7d':'#e05252',fontSize:'13px',fontWeight:500}}>
            {importMsg}
          </div>
        )}

        <div style={{background:'#0d0d1a',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 28px',display:'flex',gap:'4px',alignItems:'center',flexShrink:0}}>
          <button onClick={()=>setTab('leads')} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab==='leads'?'#7c6ff7':'transparent'}`,color:tab==='leads'?'#a89ff7':'rgba(255,255,255,0.35)',fontSize:'13px',cursor:'pointer',fontWeight:tab==='leads'?600:400}}>Leads {leads.length>0&&<span style={{background:'rgba(91,80,214,0.2)',color:'#a89ff7',borderRadius:'10px',padding:'1px 7px',fontSize:'11px',marginLeft:'4px'}}>{leads.length}</span>}</button>
          <button onClick={()=>setTab('clients')} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab==='clients'?'#7c6ff7':'transparent'}`,color:tab==='clients'?'#a89ff7':'rgba(255,255,255,0.35)',fontSize:'13px',cursor:'pointer',fontWeight:tab==='clients'?600:400}}>Clientes {clients.length>0&&<span style={{background:'rgba(76,175,125,0.15)',color:'#4caf7d',borderRadius:'10px',padding:'1px 7px',fontSize:'11px',marginLeft:'4px'}}>{clients.length}</span>}</button>
          <button onClick={()=>setTab('fornecedores')} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab==='fornecedores'?'#e08c42':'transparent'}`,color:tab==='fornecedores'?'#e08c42':'rgba(255,255,255,0.35)',fontSize:'13px',cursor:'pointer',fontWeight:tab==='fornecedores'?600:400}}>Fornecedores {fornecedores.length>0&&<span style={{background:'rgba(224,140,66,0.15)',color:'#e08c42',borderRadius:'10px',padding:'1px 7px',fontSize:'11px',marginLeft:'4px'}}>{fornecedores.length}</span>}</button>
        </div>

        <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
          <div style={{maxWidth:'900px',margin:'0 auto'}}>

            {tab==='leads' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <div>
                    <h1 style={{color:'#fff',fontSize:'20px',fontWeight:700}}>Leads</h1>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>{leads.length} contatos em prospecção</p>
                  </div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <button onClick={exportLeads} style={{padding:'7px 12px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.5)',fontSize:'12px',cursor:'pointer'}}>Exportar CSV</button>
                    <label style={{padding:'7px 12px',background:'rgba(91,80,214,0.1)',border:'1px solid rgba(91,80,214,0.2)',borderRadius:'10px',color:'#a89ff7',fontSize:'12px',cursor:'pointer'}}>
                      Importar CSV
                      <input type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={importLeads} />
                    </label>
                    <button onClick={openNewLead} style={{padding:'7px 14px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Novo Lead</button>
                  </div>
                </div>
                <div style={{display:'flex',gap:'10px',marginBottom:'16px'}}>
                  <input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none'}} />
                  <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...sel,width:'auto',padding:'8px 12px',fontSize:'12px'}}>
                    <option value="Todos">Todos</option>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {loading?<p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'40px'}}>Carregando...</p>:(
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {filteredLeads.length===0&&<p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhum lead encontrado</p>}
                    {filteredLeads.map(l=>(
                      <div key={l.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 15px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',cursor:'pointer'}} onClick={()=>openEditLead(l)}>
                        <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'rgba(91,80,214,0.25)',display:'flex',alignItems:'center',justifyContent:'center',color:'#a89ff7',fontWeight:700,fontSize:'14px',flexShrink:0}}>{l.name.charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                            <p style={{color:'#fff',fontSize:'13px',fontWeight:500}}>{l.name}</p>
                            {l.product&&<span style={{fontSize:"11px",padding:"2px 10px",borderRadius:"6px",background:"rgba(139,92,246,0.2)",color:"#a78bfa",fontWeight:600,border:"1px solid rgba(139,92,246,0.3)"}}>{l.product}</span>}
                            {l.source&&<span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'5px',background:`${sourceColor[l.source]}22`,color:sourceColor[l.source]}}>{l.source}</span>}
                          </div>
                          <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                            {l.phone&&<span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>{l.phone}</span>}
                            {l.value>0&&<span style={{color:'#4caf7d',fontSize:'11px'}}>R$ {l.value.toLocaleString('pt-BR')}</span>}
                            {l.next_followup&&<span style={{color:'rgba(91,80,214,0.8)',fontSize:'11px'}}>Follow-up: {new Date(l.next_followup+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                          </div>
                        </div>
                        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                          {l.whatsapp&&<a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{padding:'5px 9px',background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.2)',borderRadius:'7px',color:'#25d366',fontSize:'11px',textDecoration:'none',fontWeight:600}}>WA</a>}
                          <span style={{fontSize:'11px',padding:'3px 9px',borderRadius:'6px',background:l.status==='Ganho'?'rgba(76,175,125,0.15)':l.status==='Perdido'?'rgba(224,82,82,0.15)':'rgba(255,255,255,0.08)',color:l.status==='Ganho'?'#4caf7d':l.status==='Perdido'?'#e05252':'rgba(255,255,255,0.4)',fontWeight:500}}>{l.status}</span>
                          <button onClick={e=>{e.stopPropagation();removeLead(l.id)}} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'11px',cursor:'pointer'}}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab==='clients' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <div>
                    <h1 style={{color:'#fff',fontSize:'20px',fontWeight:700}}>Clientes</h1>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>{clients.length} clientes cadastrados</p>
                  </div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <button onClick={exportClients} style={{padding:'7px 12px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.5)',fontSize:'12px',cursor:'pointer'}}>Exportar CSV</button>
                    <label style={{padding:'7px 12px',background:'rgba(76,175,125,0.1)',border:'1px solid rgba(76,175,125,0.2)',borderRadius:'10px',color:'#4caf7d',fontSize:'12px',cursor:'pointer'}}>
                      Importar CSV
                      <input type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={importClients} />
                    </label>
                    <button onClick={openNewClient} style={{padding:'7px 14px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Novo Cliente</button>
                  </div>
                </div>
                <input placeholder="Buscar cliente..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none',marginBottom:'16px',boxSizing:'border-box'}} />
                {loading?<p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'40px'}}>Carregando...</p>:(
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {filteredClients.length===0&&<p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhum cliente encontrado</p>}
                    {filteredClients.map(c=>{
                      const days = daysLeft(c)
                      const isLow = days!==null&&days<=10
                      const isOver = days!==null&&days<=0
                      return (
                        <div key={c.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 15px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:`1px solid ${isOver?'rgba(224,82,82,0.3)':isLow?'rgba(224,82,82,0.15)':'rgba(255,255,255,0.07)'}`,cursor:'pointer'}} onClick={()=>openEditClient(c)}>
                          <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'rgba(76,175,125,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#4caf7d',fontWeight:700,fontSize:'14px',flexShrink:0}}>{c.name.charAt(0).toUpperCase()}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                              <p style={{color:'#fff',fontSize:'13px',fontWeight:500}}>{c.name}</p>
                              {c.source&&<span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'5px',background:`${sourceColor[c.source]}22`,color:sourceColor[c.source]}}>{c.source}</span>}
                              {c.product&&<span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'5px',background:'rgba(76,175,125,0.1)',color:'#4caf7d'}}>{c.product}</span>}
                            </div>
                            <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                              {c.phone&&<span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>{c.phone}</span>}
                              {c.pots_bought>0&&<span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>{c.pots_bought} potes</span>}
                              {days!==null&&<span style={{color:isOver?'#e05252':isLow?'#e08c42':'rgba(255,255,255,0.3)',fontSize:'11px',fontWeight:isLow?600:400}}>{isOver?'Potes acabaram!':isLow?`⚠ ${days} dias`:days+' dias'}</span>}
                            </div>
                          </div>
                          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                            {c.whatsapp&&<a href={`https://wa.me/55${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{padding:'5px 9px',background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.2)',borderRadius:'7px',color:'#25d366',fontSize:'11px',textDecoration:'none',fontWeight:600}}>WA</a>}
                            <span style={{fontSize:'11px',padding:'3px 9px',borderRadius:'6px',background:c.status==='Ativo'?'rgba(76,175,125,0.15)':'rgba(255,255,255,0.08)',color:c.status==='Ativo'?'#4caf7d':'rgba(255,255,255,0.4)',fontWeight:500}}>{c.status}</span>
                            <button onClick={e=>{e.stopPropagation();removeClient(c.id)}} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'11px',cursor:'pointer'}}>✕</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {tab==='fornecedores' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <div>
                    <h1 style={{color:'#fff',fontSize:'20px',fontWeight:700}}>Fornecedores</h1>
                    <p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>{fornecedores.length} fornecedor{fornecedores.length!==1?'es':''} cadastrado{fornecedores.length!==1?'s':''}</p>
                  </div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <button onClick={exportForn} style={{padding:'7px 12px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.5)',fontSize:'12px',cursor:'pointer'}}>Exportar CSV</button>
                    <label style={{padding:'7px 12px',background:'rgba(224,140,66,0.1)',border:'1px solid rgba(224,140,66,0.2)',borderRadius:'10px',color:'#e08c42',fontSize:'12px',cursor:'pointer'}}>
                      Importar CSV
                      <input type="file" accept=".csv" style={{display:'none'}} onChange={importForn} />
                    </label>
                    <button onClick={openNewForn} style={{padding:'7px 14px',background:'#e08c42',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Novo Fornecedor</button>
                  </div>
                </div>
                <input placeholder="Buscar fornecedor..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'8px 12px',color:'#fff',fontSize:'13px',outline:'none',marginBottom:'16px',boxSizing:'border-box'}} />
                {loading ? <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {fornecedores.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())||(f.company||'').toLowerCase().includes(search.toLowerCase())||(f.product||'').toLowerCase().includes(search.toLowerCase())).length===0 && <p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhum fornecedor encontrado</p>}
                    {fornecedores.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())||(f.company||'').toLowerCase().includes(search.toLowerCase())||(f.product||'').toLowerCase().includes(search.toLowerCase())).map(f=>(
                      <div key={f.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 15px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(224,140,66,0.15)',cursor:'pointer'}} onClick={()=>openEditForn(f)}>
                        <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'rgba(224,140,66,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#e08c42',fontWeight:700,fontSize:'14px',flexShrink:0}}>{f.name.charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                            <p style={{color:'#fff',fontSize:'13px',fontWeight:500}}>{f.name}</p>
                            {f.company&&<span style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>{f.company}</span>}
                            {f.category&&<span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'5px',background:'rgba(224,140,66,0.15)',color:'#e08c42'}}>{f.category}</span>}
                          </div>
                          <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                            {f.product&&<span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>📦 {f.product}</span>}
                            {f.phone&&<span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>📞 {f.phone}</span>}
                          </div>
                        </div>
                        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                          {f.whatsapp&&<a href={`https://wa.me/55${f.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{padding:'5px 9px',background:'rgba(37,211,102,0.12)',border:'1px solid rgba(37,211,102,0.2)',borderRadius:'7px',color:'#25d366',fontSize:'11px',textDecoration:'none',fontWeight:600}}>WA</a>}
                          <button onClick={e=>{e.stopPropagation();removeForn(f.id)}} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'11px',cursor:'pointer'}}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm==='forn' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600}}>{editing?'Editar Fornecedor':'Novo Fornecedor'}</h2>
              <button onClick={()=>setShowForm('')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Nome do contato *" value={fornForm.name} onChange={e=>setFornForm(f=>({...f,name:e.target.value}))} style={inp} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Empresa</label><input placeholder="Nome da empresa" value={fornForm.company} onChange={e=>setFornForm(f=>({...f,company:e.target.value}))} style={inp} /></div>
                <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Categoria</label><select value={fornForm.category} onChange={e=>setFornForm(f=>({...f,category:e.target.value}))} style={sel}><option value="">Selecione</option>{FORN_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
              </div>
              <input placeholder="Produto / Serviço oferecido" value={fornForm.product} onChange={e=>setFornForm(f=>({...f,product:e.target.value}))} style={inp} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>Telefone</label><input placeholder="(00) 00000-0000" value={fornForm.phone} onChange={e=>setFornForm(f=>({...f,phone:e.target.value}))} style={inp} /></div>
                <div><label style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',display:'block',marginBottom:'4px'}}>WhatsApp</label><input placeholder="(00) 00000-0000" value={fornForm.whatsapp} onChange={e=>setFornForm(f=>({...f,whatsapp:e.target.value}))} style={inp} /></div>
              </div>
              <input placeholder="E-mail" value={fornForm.email} onChange={e=>setFornForm(f=>({...f,email:e.target.value}))} style={inp} />
              <input placeholder="Instagram (@)" value={fornForm.instagram} onChange={e=>setFornForm(f=>({...f,instagram:e.target.value}))} style={inp} />
              <textarea placeholder="Observações, condições, preços..." value={fornForm.notes} onChange={e=>setFornForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'70px'}} />
            </div>
            {error&&<p style={{color:'#e05252',fontSize:'12px',background:'rgba(224,82,82,0.1)',borderRadius:'8px',padding:'8px 12px',marginTop:'10px'}}>{error}</p>}
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={saveForn} disabled={!fornForm.name.trim()||saving} style={{flex:1,padding:'11px',background:'#e08c42',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!fornForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'11px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showForm==='lead' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'560px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
              <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600}}>{editing?'Editar Lead':'Novo Lead'}</h2>
              <button onClick={()=>setShowForm('')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <Sec title="Informações básicas" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Nome *" value={leadForm.name} onChange={e=>setLeadForm(f=>({...f,name:e.target.value}))} style={inp} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Telefone"><input placeholder="(00) 00000-0000" value={leadForm.phone} onChange={e=>setLeadForm(f=>({...f,phone:e.target.value}))} style={inp} /></Fld>
                <Fld label="WhatsApp"><input placeholder="(00) 00000-0000" value={leadForm.whatsapp} onChange={e=>setLeadForm(f=>({...f,whatsapp:e.target.value}))} style={inp} /></Fld>
              </div>
              <input placeholder="Email" value={leadForm.email} onChange={e=>setLeadForm(f=>({...f,email:e.target.value}))} style={inp} />
              <input placeholder="Endereço" value={leadForm.address} onChange={e=>setLeadForm(f=>({...f,address:e.target.value}))} style={inp} />
            </div>
            <Sec title="Contato secundário" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
              <Fld label="Telefone 2"><input placeholder="(00) 00000-0000" value={leadForm.phone2} onChange={e=>setLeadForm(f=>({...f,phone2:e.target.value}))} style={inp} /></Fld>
              <Fld label="Nome"><input value={leadForm.phone2_name} onChange={e=>setLeadForm(f=>({...f,phone2_name:e.target.value}))} style={inp} /></Fld>
              <Fld label="Parentesco"><select value={leadForm.phone2_relation} onChange={e=>setLeadForm(f=>({...f,phone2_relation:e.target.value}))} style={sel}><option value="">Selecione</option>{RELATIONS.map(r=><option key={r} value={r}>{r}</option>)}</select></Fld>
            </div>
            <Sec title="Perfil familiar" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Qtd. filhos"><input type="number" min="0" value={leadForm.children_count} onChange={e=>setLeadForm(f=>({...f,children_count:e.target.value}))} style={inp} /></Fld>
                <Fld label="Idades"><input placeholder="Ex: 3, 7 anos" value={leadForm.children_ages} onChange={e=>setLeadForm(f=>({...f,children_ages:e.target.value}))} style={inp} /></Fld>
              </div>
              <Fld label="Dificuldades"><textarea placeholder="Ex: cansaço, falta de foco..." value={leadForm.difficulties} onChange={e=>setLeadForm(f=>({...f,difficulties:e.target.value}))} style={{...inp,resize:'none',height:'60px'}} /></Fld>
            </div>
            <Sec title="Origem" />
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px'}}>
              {SOURCES.map(s=><button key={s} onClick={()=>setLeadForm(f=>({...f,source:s}))} style={{padding:'8px 4px',borderRadius:'8px',border:`1px solid ${leadForm.source===s?sourceColor[s]:'rgba(255,255,255,0.08)'}`,background:leadForm.source===s?`${sourceColor[s]}22`:'transparent',color:leadForm.source===s?sourceColor[s]:'rgba(255,255,255,0.35)',fontSize:'12px',cursor:'pointer',fontWeight:leadForm.source===s?600:400}}>{s}</button>)}
            </div>
            <Sec title="Produto e venda" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <Fld label="Produto"><input placeholder="Suplemento" value={leadForm.product} onChange={e=>setLeadForm(f=>({...f,product:e.target.value}))} style={inp} /></Fld>
                <Fld label="Data compra"><input type="date" value={leadForm.purchase_date} onChange={e=>setLeadForm(f=>({...f,purchase_date:e.target.value}))} style={{...inp,colorScheme:'dark'}} /></Fld>
                <Fld label="Qtd. potes"><input type="number" min="0" value={leadForm.pots_bought} onChange={e=>setLeadForm(f=>({...f,pots_bought:e.target.value}))} style={inp} /></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Valor total kit (R$)"><input type="number" value={leadForm.value} onChange={e=>setLeadForm(f=>({...f,value:e.target.value}))} style={inp} /></Fld>
                <Fld label="Status"><select value={leadForm.status} onChange={e=>setLeadForm(f=>({...f,status:e.target.value}))} style={sel}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
              </div>
              {leadForm.status==='Ganho'&&<p style={{fontSize:'11px',color:'rgba(76,175,125,0.7)',background:'rgba(76,175,125,0.08)',borderRadius:'8px',padding:'8px 12px'}}>✓ Este lead será automaticamente adicionado como Cliente</p>}
            </div>
            <Sec title="Follow-up" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <Fld label="Data"><input type="date" value={leadForm.next_followup} onChange={e=>setLeadForm(f=>({...f,next_followup:e.target.value}))} style={{...inp,colorScheme:'dark'}} /></Fld>
              <Fld label="Observação"><input placeholder="O que falar?" value={leadForm.followup_notes} onChange={e=>setLeadForm(f=>({...f,followup_notes:e.target.value}))} style={inp} /></Fld>
            </div>
            <Sec title="Notas" />
            <textarea placeholder="Observações gerais..." value={leadForm.notes} onChange={e=>setLeadForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'64px'}} />
            {error&&<p style={{color:'#e05252',fontSize:'12px',background:'rgba(224,82,82,0.1)',borderRadius:'8px',padding:'8px 12px',marginTop:'10px'}}>{error}</p>}
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={saveLead} disabled={!leadForm.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!leadForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'11px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showForm==='client' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'560px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
              <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600}}>{editing?'Editar Cliente':'Novo Cliente'}</h2>
              <button onClick={()=>setShowForm('')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <Sec title="Informações básicas" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Nome completo *" value={clientForm.name} onChange={e=>setClientForm(f=>({...f,name:e.target.value}))} style={inp} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Telefone"><input placeholder="(00) 00000-0000" value={clientForm.phone} onChange={e=>setClientForm(f=>({...f,phone:e.target.value}))} style={inp} /></Fld>
                <Fld label="WhatsApp"><input placeholder="(00) 00000-0000" value={clientForm.whatsapp} onChange={e=>setClientForm(f=>({...f,whatsapp:e.target.value}))} style={inp} /></Fld>
              </div>
              <input placeholder="Email" value={clientForm.email} onChange={e=>setClientForm(f=>({...f,email:e.target.value}))} style={inp} />
              <input placeholder="Endereço" value={clientForm.address} onChange={e=>setClientForm(f=>({...f,address:e.target.value}))} style={inp} />
            </div>
            <Sec title="Contato secundário" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
              <Fld label="Telefone 2"><input value={clientForm.phone2} onChange={e=>setClientForm(f=>({...f,phone2:e.target.value}))} style={inp} /></Fld>
              <Fld label="Nome"><input value={clientForm.phone2_name} onChange={e=>setClientForm(f=>({...f,phone2_name:e.target.value}))} style={inp} /></Fld>
              <Fld label="Parentesco"><select value={clientForm.phone2_relation} onChange={e=>setClientForm(f=>({...f,phone2_relation:e.target.value}))} style={sel}><option value="">Selecione</option>{RELATIONS.map(r=><option key={r} value={r}>{r}</option>)}</select></Fld>
            </div>
            <Sec title="Perfil familiar" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Qtd. filhos"><input type="number" min="0" value={clientForm.children_count} onChange={e=>setClientForm(f=>({...f,children_count:e.target.value}))} style={inp} /></Fld>
                <Fld label="Idades"><input placeholder="Ex: 3, 7 anos" value={clientForm.children_ages} onChange={e=>setClientForm(f=>({...f,children_ages:e.target.value}))} style={inp} /></Fld>
              </div>
              <Fld label="Dificuldades"><textarea value={clientForm.difficulties} onChange={e=>setClientForm(f=>({...f,difficulties:e.target.value}))} style={{...inp,resize:'none',height:'60px'}} /></Fld>
            </div>
            <Sec title="Origem" />
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px'}}>
              {SOURCES.map(s=><button key={s} onClick={()=>setClientForm(f=>({...f,source:s}))} style={{padding:'8px 4px',borderRadius:'8px',border:`1px solid ${clientForm.source===s?sourceColor[s]:'rgba(255,255,255,0.08)'}`,background:clientForm.source===s?`${sourceColor[s]}22`:'transparent',color:clientForm.source===s?sourceColor[s]:'rgba(255,255,255,0.35)',fontSize:'12px',cursor:'pointer',fontWeight:clientForm.source===s?600:400}}>{s}</button>)}
            </div>
            <Sec title="Compra" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <Fld label="Produto"><input placeholder="Suplemento" value={clientForm.product} onChange={e=>setClientForm(f=>({...f,product:e.target.value}))} style={inp} /></Fld>
                <Fld label="Data compra"><input type="date" value={clientForm.purchase_date} onChange={e=>setClientForm(f=>({...f,purchase_date:e.target.value}))} style={{...inp,colorScheme:'dark'}} /></Fld>
                <Fld label="Qtd. potes"><input type="number" min="0" value={clientForm.pots_bought} onChange={e=>setClientForm(f=>({...f,pots_bought:e.target.value}))} style={inp} /></Fld>
              </div>
              {clientForm.purchase_date&&parseInt(clientForm.pots_bought)>0&&<p style={{fontSize:'11px',color:'rgba(91,80,214,0.7)',background:'rgba(91,80,214,0.08)',borderRadius:'8px',padding:'8px 12px'}}>Potes terminam em: {new Date(new Date(clientForm.purchase_date).getTime()+parseInt(clientForm.pots_bought)*30*24*60*60*1000).toLocaleDateString('pt-BR')}</p>}
              <Fld label="Status"><select value={clientForm.status} onChange={e=>setClientForm(f=>({...f,status:e.target.value}))} style={sel}><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option><option value="Recompra">Recompra</option></select></Fld>
            </div>
            <Sec title="Notas" />
            <textarea value={clientForm.notes} onChange={e=>setClientForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'64px'}} />
            {error&&<p style={{color:'#e05252',fontSize:'12px',background:'rgba(224,82,82,0.1)',borderRadius:'8px',padding:'8px 12px',marginTop:'10px'}}>{error}</p>}
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={saveClient} disabled={!clientForm.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!clientForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'11px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

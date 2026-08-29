'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'
const STATUSES = ['Prospecção', 'Contato', 'Negociando', 'Ganho', 'Perdido']
const SOURCES = ['Indicação', 'Facebook', 'TikTok', 'Instagram', 'Outra pessoa', 'Outro']
const RELATIONS = ['Cônjuge', 'Filho(a)', 'Mãe', 'Pai', 'Irmão/Irmã', 'Amigo(a)', 'Outro']
const EMPTY_LEAD = { commission:'', name:'', cpf:'', email:'', phone:'', whatsapp:'', phone2:'', phone2_name:'', phone2_relation:'', company:'', address:'', status:'Prospecção', value:'', notes:'', next_followup:'', followup_notes:'', source:'Indicação', children_count:'0', children_ages:'', difficulties:'', purchase_date:'', pots_bought:'0', product:'' }
const EMPTY_CLIENT = { name:'', cpf:'', email:'', phone:'', whatsapp:'', phone2:'', phone2_name:'', phone2_relation:'', address:'', children_count:'0', children_ages:'', difficulties:'', source:'Indicação', product:'', purchase_date:'', pots_bought:'0', notes:'', status:'Ativo', social1_type:'Instagram', social1_user:'', social2_type:'TikTok', social2_user:'', value:'' }
const EMPTY_FORNECEDOR = { name:'', company:'', category:'', product:'', phone:'', whatsapp:'', email:'', instagram:'', notes:'' }
const FORN_CATS = ['Suplementos','Embalagens','Gráfica','Marketing','Tecnologia','Logística','Alimentos','Serviços','Outro']

const inp: any = {width:'100%',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'9px 12px',color:'#111',fontSize:'15px',outline:'none',boxSizing:'border-box'}
const sel: any = {width:'100%',background:'#ffffff',border:'2px solid #bbb',borderRadius:'10px',padding:'9px 12px',color:'#111',fontSize:'15px',outline:'none'}
const sourceColor: any = {'Indicação':'#7c6ff7','Facebook':'#4267B2','TikTok':'#e05252','Instagram':'#e08c42','Outra pessoa':'#4caf7d','Outro':'#888'}

function Sec({title}:{title:string}) {
  return <div style={{fontSize:'12px',color:'#444',textTransform:'uppercase',letterSpacing:'1px',marginTop:'16px',marginBottom:'8px',paddingBottom:'6px',borderBottom:'2px solid #bbb'}}>{title}</div>
}
function Fld({label,children}:{label:string,children:any}) {
  return <div><label style={{fontSize:'15px',color:'#444',display:'block',marginBottom:'4px'}}>{label}</label>{children}</div>
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
  const [estoque, setEstoque] = useState<any[]>([])
  const [estoqueForm, setEstoqueForm] = useState({name:'',quantity:'0',min_quantity:'5',cost_price:'',sell_price:'',location:'',expiry_date:'',notes:''})
  const [showMovForm, setShowMovForm] = useState<any>(null)
  const [movQty, setMovQty] = useState('1')
  const [movType, setMovType] = useState('saida')
  const [movNotes, setMovNotes] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [l, c, f, e] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false}),
      supabase.from('clients').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false}),
      supabase.from('fornecedores').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false}),
      supabase.from('estoque').select('*').eq('user_id', USER_ID).order('name', {ascending:true})
    ])
    setLeads(l.data || [])
    setClients(c.data || [])
    setFornecedores(f.data || [])
    setEstoque(e.data || [])
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
    setLeadForm({name:lead.name||'',cpf:lead.cpf||'',email:lead.email||'',phone:lead.phone||'',whatsapp:lead.whatsapp||'',phone2:lead.phone2||'',phone2_name:lead.phone2_name||'',phone2_relation:lead.phone2_relation||'',company:lead.company||'',address:lead.address||'',status:lead.status||'Prospecção',value:lead.value?.toString()||'',notes:lead.notes||'',next_followup:lead.next_followup||'',followup_notes:lead.followup_notes||'',source:lead.source||'Indicação',children_count:lead.children_count?.toString()||'0',children_ages:lead.children_ages||'',difficulties:lead.difficulties||'',purchase_date:lead.purchase_date||'',pots_bought:lead.pots_bought?.toString()||'0',product:lead.product||'',commission:lead.commission?.toString()||''})
    setError(''); setShowForm('lead')
  }

  async function saveLead() {
    if (!leadForm.name.trim()) return
    setSaving(true); setError('')
    const data: any = {name:leadForm.name.trim(),cpf:leadForm.cpf||null,email:leadForm.email||null,phone:leadForm.phone||null,whatsapp:leadForm.whatsapp||null,phone2:leadForm.phone2||null,phone2_name:leadForm.phone2_name||null,phone2_relation:leadForm.phone2_relation||null,company:leadForm.company||null,address:leadForm.address||null,status:leadForm.status,value:leadForm.value?parseFloat(leadForm.value):0,notes:leadForm.notes||null,next_followup:leadForm.next_followup||null,followup_notes:leadForm.followup_notes||null,source:leadForm.source,children_count:parseInt(leadForm.children_count)||0,children_ages:leadForm.children_ages||null,difficulties:leadForm.difficulties||null,purchase_date:leadForm.purchase_date||null,pots_bought:parseInt(leadForm.pots_bought)||0,product:leadForm.product||null,user_id:USER_ID}
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
        await supabase.from('clients').insert({id:crypto.randomUUID(),name:leadForm.name.trim(),cpf:leadForm.cpf||null,email:leadForm.email||null,phone:leadForm.phone||null,whatsapp:leadForm.whatsapp||null,phone2:leadForm.phone2||null,phone2_name:leadForm.phone2_name||null,phone2_relation:leadForm.phone2_relation||null,address:leadForm.address||null,children_count:parseInt(leadForm.children_count)||0,children_ages:leadForm.children_ages||null,difficulties:leadForm.difficulties||null,source:leadForm.source,product:leadForm.product||null,purchase_date:leadForm.purchase_date||null,pots_bought:parseInt(leadForm.pots_bought)||0,notes:leadForm.notes||null,status:'Ativo',user_id:USER_ID})
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
    setClientForm({name:c.name||'',cpf:c.cpf||'',email:c.email||'',phone:c.phone||'',whatsapp:c.whatsapp||'',phone2:c.phone2||'',phone2_name:c.phone2_name||'',phone2_relation:c.phone2_relation||'',address:c.address||'',children_count:c.children_count?.toString()||'0',children_ages:c.children_ages||'',difficulties:c.difficulties||'',source:c.source||'Indicação',product:c.product||'',purchase_date:c.purchase_date||'',pots_bought:c.pots_bought?.toString()||'0',notes:c.notes||'',status:c.status||'Ativo',social1_type:c.social1_type||'Instagram',social1_user:c.social1_user||'',social2_type:c.social2_type||'TikTok',social2_user:c.social2_user||'',value:c.value?.toString()||''})
    setError(''); setShowForm('client')
  }

  async function saveClient() {
    if (!clientForm.name.trim()) return
    setSaving(true); setError('')
    const data: any = {name:clientForm.name.trim(),cpf:clientForm.cpf||null,email:clientForm.email||null,phone:clientForm.phone||null,whatsapp:clientForm.whatsapp||null,phone2:clientForm.phone2||null,phone2_name:clientForm.phone2_name||null,phone2_relation:clientForm.phone2_relation||null,address:clientForm.address||null,children_count:parseInt(clientForm.children_count)||0,children_ages:clientForm.children_ages||null,difficulties:clientForm.difficulties||null,source:clientForm.source,product:clientForm.product||null,purchase_date:clientForm.purchase_date||null,pots_bought:parseInt(clientForm.pots_bought)||0,notes:clientForm.notes||null,status:clientForm.status,value:clientForm.value?parseFloat(clientForm.value):null,social1_type:clientForm.social1_type||null,social1_user:clientForm.social1_user||null,social2_type:clientForm.social2_type||null,social2_user:clientForm.social2_user||null,user_id:USER_ID}
    const { error } = editing ? await supabase.from('clients').update(data).eq('id', editing.id) : await supabase.from('clients').insert({...data,id:crypto.randomUUID()})
    if (error) { setError(error.message); setSaving(false); return }
    if (!editing && clientForm.value && parseFloat(clientForm.value) > 0) {
      const confirmFin = window.confirm('Registrar R$ ' + parseFloat(clientForm.value).toFixed(2) + ' de ' + clientForm.name.trim() + ' no Financeiro?')
      if (confirmFin) {
        await supabase.from('transactions').insert({id:crypto.randomUUID(),title:'Venda: '+clientForm.name.trim(),amount:parseFloat(clientForm.value),type:'receita',category:'trabalho',date:clientForm.purchase_date||new Date().toISOString().split('T')[0],notes:'Origem: CRM Clientes',user_id:USER_ID})
      }
    }
    setShowForm(''); setSaving(false); load()
  }

  // ===== ESTOQUE =====
  async function saveEstoque() {
    if (!estoqueForm.name.trim()) return
    setSaving(true); setError('')
    const data: any = {name:estoqueForm.name.trim(),quantity:parseInt(estoqueForm.quantity)||0,min_quantity:parseInt(estoqueForm.min_quantity)||5,cost_price:estoqueForm.cost_price?parseFloat(estoqueForm.cost_price):null,sell_price:estoqueForm.sell_price?parseFloat(estoqueForm.sell_price):null,location:estoqueForm.location||null,expiry_date:estoqueForm.expiry_date||null,notes:estoqueForm.notes||null,user_id:USER_ID}
    const {error} = editing ? await supabase.from('estoque').update(data).eq('id',editing.id) : await supabase.from('estoque').insert({...data,id:crypto.randomUUID()})
    if (error) { setError(error.message); setSaving(false); return }
    setShowForm(''); setSaving(false); setEditing(null); load()
  }
  async function removeEstoque(id: string) {
    if (!confirm('Excluir produto do estoque?')) return
    await supabase.from('estoque').delete().eq('id',id); load()
  }
  async function registrarMovimentacao() {
    if (!showMovForm || !movQty) return
    setSaving(true)
    const qty = parseInt(movQty)
    const novaQtd = movType === 'entrada' ? showMovForm.quantity + qty : showMovForm.quantity - qty
    await supabase.from('estoque').update({quantity: Math.max(0, novaQtd)}).eq('id', showMovForm.id)
    if (movType === 'saida' && showMovForm.sell_price) {
      const confirmFin = window.confirm('Registrar R$ ' + (showMovForm.sell_price * qty).toFixed(2) + ' no Financeiro?')
      if (confirmFin) {
        await supabase.from('transactions').insert({id:crypto.randomUUID(),title:'Venda: '+showMovForm.name+' ('+qty+'x)',amount:showMovForm.sell_price*qty,type:'receita',category:'trabalho',date:new Date().toISOString().split('T')[0],notes:movNotes||'Origem: Estoque',user_id:USER_ID})
      }
    }
    setShowMovForm(null); setMovQty('1'); setMovNotes(''); setSaving(false); load()
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
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column',overflowY:'auto'}}>

        {importMsg && (
          <div style={{position:'fixed',top:'16px',right:'16px',zIndex:100,background:importMsg.startsWith('✓')?'#ddf5e8':'#ffe0e0',border:`1px solid ${importMsg.startsWith('✓')?'#a0e0be':'#ffb0b0'}`,borderRadius:'10px',padding:'10px 16px',color:importMsg.startsWith('✓')?'#4caf7d':'#e05252',fontSize:'15px',fontWeight:500}}>
            {importMsg}
          </div>
        )}

        <div style={{background:'#fff',borderBottom:'2px solid #bbb',padding:'0 28px',display:'flex',gap:'4px',alignItems:'center',flexShrink:0}}>
          <button onClick={()=>setTab('leads')} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab==='leads'?'#7c6ff7':'transparent'}`,color:tab==='leads'?'#a89ff7':'#999',fontSize:'15px',cursor:'pointer',fontWeight:tab==='leads'?600:400}}>Leads {leads.length>0&&<span style={{background:'#c4b5fd',color:'#5b21b6',borderRadius:'10px',padding:'1px 7px',fontSize:'15px',marginLeft:'4px'}}>{leads.length}</span>}</button>
          <button onClick={()=>setTab('clients')} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab==='clients'?'#7c6ff7':'transparent'}`,color:tab==='clients'?'#a89ff7':'#999',fontSize:'15px',cursor:'pointer',fontWeight:tab==='clients'?600:400}}>Clientes {clients.length>0&&<span style={{background:'#fff',color:'#15803d',borderRadius:'10px',padding:'1px 7px',fontSize:'15px',marginLeft:'4px'}}>{clients.length}</span>}</button>
          <button onClick={()=>setTab('estoque')} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab==='estoque'?'#4caf7d':'transparent'}`,color:tab==='estoque'?'#4caf7d':'#999',fontSize:'15px',cursor:'pointer',fontWeight:tab==='estoque'?600:400}}>Estoque {estoque.length>0&&<span style={{background:'#fff',color:'#15803d',borderRadius:'10px',padding:'1px 7px',fontSize:'15px',marginLeft:'4px'}}>{estoque.length}</span>}</button>
          <button onClick={()=>setTab('fornecedores')} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab==='fornecedores'?'#e08c42':'transparent'}`,color:tab==='fornecedores'?'#e08c42':'#999',fontSize:'15px',cursor:'pointer',fontWeight:tab==='fornecedores'?600:400}}>Fornecedores {fornecedores.length>0&&<span style={{background:'#fff',color:'#c2410c',borderRadius:'10px',padding:'1px 7px',fontSize:'15px',marginLeft:'4px'}}>{fornecedores.length}</span>}</button>
        </div>

        <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
          <div style={{maxWidth:'900px',margin:'0 auto'}}>

            {tab==='leads' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <div>
                    <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>Leads</h1>
                    <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{leads.length} contatos em prospecção</p>
                  </div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <button onClick={exportLeads} style={{padding:'7px 12px',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',color:'#444',fontSize:'15px',cursor:'pointer'}}>Exportar CSV</button>
                    <label style={{padding:'7px 12px',background:'#fff',border:'2px solid #7c3aed',borderRadius:'10px',color:'#5b21b6',fontSize:'15px',cursor:'pointer'}}>
                      Importar CSV
                      <input type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={importLeads} />
                    </label>
                    <button onClick={openNewLead} style={{padding:'7px 14px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo Lead</button>
                  </div>
                </div>
                <div style={{display:'flex',gap:'10px',marginBottom:'16px'}}>
                  <input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'8px 12px',color:'#111',fontSize:'15px',outline:'none'}} />
                  <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...sel,width:'auto',padding:'8px 12px',fontSize:'15px'}}>
                    <option value="Todos">Todos</option>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {loading?<p style={{color:'#444',textAlign:'center',padding:'40px'}}>Carregando...</p>:(
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {filteredLeads.length===0&&<p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhum lead encontrado</p>}
                    {filteredLeads.map(l=>(
                      <div key={l.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 15px',borderRadius:'12px',background:'#fff',border:'2px solid #bbb',cursor:'pointer'}} onClick={()=>openEditLead(l)}>
                        <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'#c4b5fd',display:'flex',alignItems:'center',justifyContent:'center',color:'#5b21b6',fontWeight:700,fontSize:'15px',flexShrink:0}}>{l.name.charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                            <p style={{color:'#111',fontSize:'15px',fontWeight:500}}>{l.name}</p>
                            {l.product&&<span style={{fontSize:"11px",padding:"2px 10px",borderRadius:"6px",background:"#e0d4ff",color:"#a78bfa",fontWeight:600,border:"1px solid #d0c0ff"}}>{l.product}</span>}
                            {l.source&&<span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${sourceColor[l.source]}22`,color:sourceColor[l.source]}}>{l.source}</span>}
                          </div>
                          <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                            {l.phone&&<span style={{color:'#444',fontSize:'15px'}}>{l.phone}</span>}
                            {l.value>0&&<span style={{color:'#15803d',fontSize:'15px'}}>R$ {l.value.toLocaleString('pt-BR')}</span>}
                            {l.next_followup&&<span style={{color:'#4c1d95',fontSize:'15px'}}>Follow-up: {new Date(l.next_followup+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                          </div>
                        </div>
                        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                          {l.whatsapp&&<a href={`https://wa.me/55${l.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{padding:'5px 9px',background:'#fff',border:'2px solid #22c55e',borderRadius:'7px',color:'#16a34a',fontSize:'15px',textDecoration:'none',fontWeight:600}}>WA</a>}
                          <span style={{fontSize:'15px',padding:'3px 9px',borderRadius:'6px',background:l.status==='Ganho'?'#ddf5e8':l.status==='Perdido'?'#ffe0e0':'#e8e8ee',color:l.status==='Ganho'?'#4caf7d':l.status==='Perdido'?'#e05252':'#888',fontWeight:500}}>{l.status}</span>
                          <button onClick={e=>{e.stopPropagation();removeLead(l.id)}} style={{padding:'5px 8px',background:'#fff',border:'none',borderRadius:'7px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>✕</button>
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
                    <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>Clientes</h1>
                    <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{clients.length} clientes cadastrados</p>
                  </div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <button onClick={exportClients} style={{padding:'7px 12px',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',color:'#444',fontSize:'15px',cursor:'pointer'}}>Exportar CSV</button>
                    <label style={{padding:'7px 12px',background:'#fff',border:'2px solid #16a34a',borderRadius:'10px',color:'#15803d',fontSize:'15px',cursor:'pointer'}}>
                      Importar CSV
                      <input type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={importClients} />
                    </label>
                    <button onClick={openNewClient} style={{padding:'7px 14px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo Cliente</button>
                  </div>
                </div>
                <input placeholder="Buscar cliente..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'8px 12px',color:'#111',fontSize:'15px',outline:'none',marginBottom:'16px',boxSizing:'border-box'}} />
                {loading?<p style={{color:'#444',textAlign:'center',padding:'40px'}}>Carregando...</p>:(
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {filteredClients.length===0&&<p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhum cliente encontrado</p>}
                    {filteredClients.map(c=>{
                      const days = daysLeft(c)
                      const isLow = days!==null&&days<=10
                      const isOver = days!==null&&days<=0
                      return (
                        <div key={c.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 15px',borderRadius:'12px',background:'#fff',border:`1px solid ${isOver?'#ffb0b0':isLow?'#ffe0e0':'#f0f0f3'}`,cursor:'pointer'}} onClick={()=>openEditClient(c)}>
                          <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',color:'#15803d',fontWeight:700,fontSize:'15px',flexShrink:0}}>{c.name.charAt(0).toUpperCase()}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                              <p style={{color:'#111',fontSize:'15px',fontWeight:500}}>{c.name}</p>
                              {c.source&&<span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${sourceColor[c.source]}22`,color:sourceColor[c.source]}}>{c.source}</span>}
                              {c.product&&<span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:'#fff',color:'#15803d'}}>{c.product}</span>}
                            </div>
                            <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                              {c.phone&&<span style={{color:'#444',fontSize:'15px'}}>{c.phone}</span>}
                              {c.pots_bought>0&&<span style={{color:'#444',fontSize:'15px'}}>{c.pots_bought} potes</span>}
                              {days!==null&&<span style={{color:isOver?'#e05252':isLow?'#e08c42':'#999',fontSize:'15px',fontWeight:isLow?600:400}}>{isOver?'Potes acabaram!':isLow?`⚠ ${days} dias`:days+' dias'}</span>}
                            </div>
                          </div>
                          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                            {c.whatsapp&&<a href={`https://wa.me/55${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{padding:'5px 9px',background:'#fff',border:'2px solid #22c55e',borderRadius:'7px',color:'#16a34a',fontSize:'15px',textDecoration:'none',fontWeight:600}}>WA</a>}
                            <span style={{fontSize:'15px',padding:'3px 9px',borderRadius:'6px',background:c.status==='Ativo'?'#ddf5e8':'#e8e8ee',color:c.status==='Ativo'?'#4caf7d':'#888',fontWeight:500}}>{c.status}</span>
                            <button onClick={e=>{e.stopPropagation();removeClient(c.id)}} style={{padding:'5px 8px',background:'#fff',border:'none',borderRadius:'7px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>✕</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {tab==='estoque' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <div><h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>Estoque</h1><p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{estoque.length} produto(s) cadastrado(s)</p></div>
                  <button onClick={()=>{setEditing(null);setEstoqueForm({name:'',quantity:'0',min_quantity:'5',cost_price:'',sell_price:'',location:'',expiry_date:'',notes:''});setError('');setShowForm('estoque')}} style={{padding:'7px 14px',background:'#4caf7d',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo Produto</button>
                </div>
                {loading?<p style={{color:'#444',textAlign:'center',padding:'40px'}}>Carregando...</p>:(
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {estoque.length===0&&<p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhum produto cadastrado</p>}
                    {estoque.map(p=>{
                      const isLow = p.quantity <= p.min_quantity
                      const isOut = p.quantity === 0
                      return (
                        <div key={p.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 15px',borderRadius:'12px',background:'#fff',border:`1px solid ${isOut?'#ff9999':isLow?'#ffca90':'#f0f0f3'}`,cursor:'pointer'}} onClick={()=>{setEditing(p);setEstoqueForm({name:p.name,quantity:p.quantity?.toString()||'0',min_quantity:p.min_quantity?.toString()||'5',cost_price:p.cost_price?.toString()||'',sell_price:p.sell_price?.toString()||'',location:p.location||'',expiry_date:p.expiry_date||'',notes:p.notes||''});setError('');setShowForm('estoque')}}>
                          <div style={{width:'38px',height:'38px',borderRadius:'10px',background:isOut?'#ffc8c8':isLow?'#ffd9b0':'#c0ebd3',display:'flex',alignItems:'center',justifyContent:'center',color:isOut?'#e05252':isLow?'#e08c42':'#4caf7d',fontWeight:700,fontSize:'18px',flexShrink:0}}>{p.quantity}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                              <p style={{color:'#111',fontSize:'15px',fontWeight:500}}>{p.name}</p>
                              {p.location&&<span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:'#fff',color:'#333'}}>📍 {p.location}</span>}
                              {isOut&&<span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:'#fff',color:'#dc2626'}}>SEM ESTOQUE</span>}
                              {!isOut&&isLow&&<span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:'#fff',color:'#c2410c'}}>⚠ ESTOQUE BAIXO</span>}
                            </div>
                            <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                              {p.sell_price&&<span style={{color:'#15803d',fontSize:'15px'}}>Venda: R$ {p.sell_price}</span>}
                              {p.cost_price&&<span style={{color:'#444',fontSize:'15px'}}>Custo: R$ {p.cost_price}</span>}
                              {p.expiry_date&&<span style={{color:'#444',fontSize:'15px'}}>Val: {new Date(p.expiry_date+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                            </div>
                          </div>
                          <div style={{display:'flex',gap:'6px'}}>
                            <button onClick={e=>{e.stopPropagation();setShowMovForm(p);setMovType('entrada');setMovQty('1')}} style={{padding:'5px 9px',background:'#fff',border:'2px solid #16a34a',borderRadius:'7px',color:'#15803d',fontSize:'15px',cursor:'pointer'}}>+ Entrada</button>
                            <button onClick={e=>{e.stopPropagation();setShowMovForm(p);setMovType('saida');setMovQty('1')}} style={{padding:'5px 9px',background:'#fff',border:'2px solid #7c3aed',borderRadius:'7px',color:'#5b21b6',fontSize:'15px',cursor:'pointer'}}>- Saída</button>
                            <button onClick={e=>{e.stopPropagation();removeEstoque(p.id)}} style={{padding:'5px 8px',background:'#fff',border:'none',borderRadius:'7px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>✕</button>
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
                    <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>Fornecedores</h1>
                    <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{fornecedores.length} fornecedor{fornecedores.length!==1?'es':''} cadastrado{fornecedores.length!==1?'s':''}</p>
                  </div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <button onClick={exportForn} style={{padding:'7px 12px',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',color:'#444',fontSize:'15px',cursor:'pointer'}}>Exportar CSV</button>
                    <label style={{padding:'7px 12px',background:'#fff',border:'2px solid #f97316',borderRadius:'10px',color:'#c2410c',fontSize:'15px',cursor:'pointer'}}>
                      Importar CSV
                      <input type="file" accept=".csv" style={{display:'none'}} onChange={importForn} />
                    </label>
                    <button onClick={openNewForn} style={{padding:'7px 14px',background:'#e08c42',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo Fornecedor</button>
                  </div>
                </div>
                <input placeholder="Buscar fornecedor..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'8px 12px',color:'#111',fontSize:'15px',outline:'none',marginBottom:'16px',boxSizing:'border-box'}} />
                {loading ? <p style={{color:'#444',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {fornecedores.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())||(f.company||'').toLowerCase().includes(search.toLowerCase())||(f.product||'').toLowerCase().includes(search.toLowerCase())).length===0 && <p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhum fornecedor encontrado</p>}
                    {fornecedores.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())||(f.company||'').toLowerCase().includes(search.toLowerCase())||(f.product||'').toLowerCase().includes(search.toLowerCase())).map(f=>(
                      <div key={f.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 15px',borderRadius:'12px',background:'#fff',border:'2px solid #fb923c',cursor:'pointer'}} onClick={()=>openEditForn(f)}>
                        <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'#ffd9b0',display:'flex',alignItems:'center',justifyContent:'center',color:'#c2410c',fontWeight:700,fontSize:'15px',flexShrink:0}}>{f.name.charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                            <p style={{color:'#111',fontSize:'15px',fontWeight:500}}>{f.name}</p>
                            {f.company&&<span style={{fontSize:'15px',color:'#333'}}>{f.company}</span>}
                            {f.category&&<span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:'#fff',color:'#c2410c'}}>{f.category}</span>}
                          </div>
                          <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                            {f.product&&<span style={{color:'#444',fontSize:'15px'}}>📦 {f.product}</span>}
                            {f.phone&&<span style={{color:'#444',fontSize:'15px'}}>📞 {f.phone}</span>}
                          </div>
                        </div>
                        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                          {f.whatsapp&&<a href={`https://wa.me/55${f.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{padding:'5px 9px',background:'#fff',border:'2px solid #22c55e',borderRadius:'7px',color:'#16a34a',fontSize:'15px',textDecoration:'none',fontWeight:600}}>WA</a>}
                          <button onClick={e=>{e.stopPropagation();removeForn(f.id)}} style={{padding:'5px 8px',background:'#fff',border:'none',borderRadius:'7px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>✕</button>
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

      {showMovForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'360px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'2px solid #bbb'}}>
            <h2 style={{color:'#111',fontSize:'18px',fontWeight:600,marginBottom:'16px'}}>{movType==='entrada'?'+ Entrada':'- Saída'}: {showMovForm.name}</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={()=>setMovType('entrada')} style={{flex:1,padding:'8px',borderRadius:'8px',border:`1px solid ${movType==='entrada'?'#4caf7d':'#eaeaea)'}`,background:movType==='entrada'?'#ddf5e8':'transparent',color:movType==='entrada'?'#4caf7d':'#999',cursor:'pointer',fontWeight:600}}>+ Entrada</button>
                <button onClick={()=>setMovType('saida')} style={{flex:1,padding:'8px',borderRadius:'8px',border:`1px solid ${movType==='saida'?'#a89ff7':'#eaeaea)'}`,background:movType==='saida'?'#e8e4ff':'transparent',color:movType==='saida'?'#a89ff7':'#999',cursor:'pointer',fontWeight:600}}>- Saída</button>
              </div>
              <Fld label="Quantidade"><input type="number" min="1" value={movQty} onChange={e=>setMovQty(e.target.value)} style={inp} /></Fld>
              <Fld label="Observação"><input placeholder="Opcional" value={movNotes} onChange={e=>setMovNotes(e.target.value)} style={inp} /></Fld>
              <p style={{fontSize:'15px',color:'#444'}}>Estoque atual: {showMovForm.quantity} → {movType==='entrada'?showMovForm.quantity+parseInt(movQty||'0'):Math.max(0,showMovForm.quantity-parseInt(movQty||'0'))}</p>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={registrarMovimentacao} disabled={saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>{saving?'Salvando...':'Confirmar'}</button>
              <button onClick={()=>setShowMovForm(null)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #bbb',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showForm==='estoque' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'2px solid #bbb',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>{editing?'Editar Produto':'Novo Produto'}</h2>
              <button onClick={()=>setShowForm('')} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Nome do produto *" value={estoqueForm.name} onChange={e=>setEstoqueForm(f=>({...f,name:e.target.value}))} style={inp} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Quantidade"><input type="number" min="0" value={estoqueForm.quantity} onChange={e=>setEstoqueForm(f=>({...f,quantity:e.target.value}))} style={inp} /></Fld>
                <Fld label="Alerta mínimo"><input type="number" min="0" value={estoqueForm.min_quantity} onChange={e=>setEstoqueForm(f=>({...f,min_quantity:e.target.value}))} style={inp} /></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Preço custo (R$)"><input type="number" value={estoqueForm.cost_price} onChange={e=>setEstoqueForm(f=>({...f,cost_price:e.target.value}))} style={inp} /></Fld>
                <Fld label="Preço venda (R$)"><input type="number" value={estoqueForm.sell_price} onChange={e=>setEstoqueForm(f=>({...f,sell_price:e.target.value}))} style={inp} /></Fld>
              </div>
              <Fld label="Local"><input placeholder="Ex: Gaveta 1, Prateleira A..." value={estoqueForm.location} onChange={e=>setEstoqueForm(f=>({...f,location:e.target.value}))} style={inp} /></Fld>
              <Fld label="Validade"><input type="date" value={estoqueForm.expiry_date} onChange={e=>setEstoqueForm(f=>({...f,expiry_date:e.target.value}))} style={{...inp,colorScheme:'light'}} /></Fld>
              <Fld label="Notas"><textarea value={estoqueForm.notes} onChange={e=>setEstoqueForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}} /></Fld>
            </div>
            {error&&<p style={{color:'#dc2626',fontSize:'15px',background:'#fff',borderRadius:'8px',padding:'8px 12px',marginTop:'10px'}}>{error}</p>}
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={saveEstoque} disabled={!estoqueForm.name.trim()||saving} style={{flex:1,padding:'11px',background:'#4caf7d',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!estoqueForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              {editing&&<button onClick={()=>{removeEstoque(editing.id);setShowForm('')}} style={{padding:'11px 14px',background:'#fff',border:'2px solid #ef4444',borderRadius:'10px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>Apagar</button>}
              <button onClick={()=>setShowForm('')} style={{padding:'11px 16px',background:'transparent',border:'2px solid #bbb',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showForm==='forn' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'2px solid #bbb',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>{editing?'Editar Fornecedor':'Novo Fornecedor'}</h2>
              <button onClick={()=>setShowForm('')} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Nome do contato *" value={fornForm.name} onChange={e=>setFornForm(f=>({...f,name:e.target.value}))} style={inp} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div><label style={{fontSize:'15px',color:'#444',display:'block',marginBottom:'4px'}}>Empresa</label><input placeholder="Nome da empresa" value={fornForm.company} onChange={e=>setFornForm(f=>({...f,company:e.target.value}))} style={inp} /></div>
                <div><label style={{fontSize:'15px',color:'#444',display:'block',marginBottom:'4px'}}>Categoria</label><select value={fornForm.category} onChange={e=>setFornForm(f=>({...f,category:e.target.value}))} style={sel}><option value="">Selecione</option>{FORN_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
              </div>
              <input placeholder="Produto / Serviço oferecido" value={fornForm.product} onChange={e=>setFornForm(f=>({...f,product:e.target.value}))} style={inp} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div><label style={{fontSize:'15px',color:'#444',display:'block',marginBottom:'4px'}}>Telefone</label><input placeholder="(00) 00000-0000" value={fornForm.phone} onChange={e=>setFornForm(f=>({...f,phone:e.target.value}))} style={inp} /></div>
                <div><label style={{fontSize:'15px',color:'#444',display:'block',marginBottom:'4px'}}>WhatsApp</label><input placeholder="(00) 00000-0000" value={fornForm.whatsapp} onChange={e=>setFornForm(f=>({...f,whatsapp:e.target.value}))} style={inp} /></div>
              </div>
              <input placeholder="E-mail" value={fornForm.email} onChange={e=>setFornForm(f=>({...f,email:e.target.value}))} style={inp} />
              <input placeholder="Instagram (@)" value={fornForm.instagram} onChange={e=>setFornForm(f=>({...f,instagram:e.target.value}))} style={inp} />
              <textarea placeholder="Observações, condições, preços..." value={fornForm.notes} onChange={e=>setFornForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'70px'}} />
            </div>
            {error&&<p style={{color:'#dc2626',fontSize:'15px',background:'#fff',borderRadius:'8px',padding:'8px 12px',marginTop:'10px'}}>{error}</p>}
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={saveForn} disabled={!fornForm.name.trim()||saving} style={{flex:1,padding:'11px',background:'#e08c42',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!fornForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'11px 16px',background:'transparent',border:'2px solid #bbb',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showForm==='lead' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'560px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'2px solid #bbb',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>{editing?'Editar Lead':'Novo Lead'}</h2>
              <button onClick={()=>setShowForm('')} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <Sec title="Informações básicas" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Nome *" value={leadForm.name} onChange={e=>setLeadForm(f=>({...f,name:e.target.value}))} style={inp} />
              <Fld label="CPF"><input placeholder="000.000.000-00" value={leadForm.cpf} onChange={e=>setLeadForm(f=>({...f,cpf:e.target.value}))} style={inp} /></Fld>
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
              {SOURCES.map(s=><button key={s} onClick={()=>setLeadForm(f=>({...f,source:s}))} style={{padding:'8px 4px',borderRadius:'8px',border:`1px solid ${leadForm.source===s?sourceColor[s]:'#e8e8ee'}`,background:leadForm.source===s?`${sourceColor[s]}22`:'transparent',color:leadForm.source===s?sourceColor[s]:'#999',fontSize:'15px',cursor:'pointer',fontWeight:leadForm.source===s?600:400}}>{s}</button>)}
            </div>
            <Sec title="Produto e venda" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <Fld label="Produto"><input placeholder="Suplemento" value={leadForm.product} onChange={e=>setLeadForm(f=>({...f,product:e.target.value}))} style={inp} /></Fld>
                <Fld label="Data compra"><input type="date" value={leadForm.purchase_date} onChange={e=>setLeadForm(f=>({...f,purchase_date:e.target.value}))} style={{...inp,colorScheme:'light'}} /></Fld>
                <Fld label="Qtd. potes"><input type="number" min="0" value={leadForm.pots_bought} onChange={e=>setLeadForm(f=>({...f,pots_bought:e.target.value}))} style={inp} /></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Valor total kit (R$)"><input type="number" value={leadForm.value} onChange={e=>setLeadForm(f=>({...f,value:e.target.value}))} style={inp} /></Fld>
                <Fld label="Status"><select value={leadForm.status} onChange={e=>setLeadForm(f=>({...f,status:e.target.value}))} style={sel}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
              </div>
              {leadForm.status==='Ganho'&&<p style={{fontSize:'15px',color:'#3d9e6e',background:'#fff',borderRadius:'8px',padding:'8px 12px'}}>✓ Este lead será automaticamente adicionado como Cliente</p>}
            </div>
            <Sec title="Follow-up" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <Fld label="Data"><input type="date" value={leadForm.next_followup} onChange={e=>setLeadForm(f=>({...f,next_followup:e.target.value}))} style={{...inp,colorScheme:'light'}} /></Fld>
              <Fld label="Observação"><input placeholder="O que falar?" value={leadForm.followup_notes} onChange={e=>setLeadForm(f=>({...f,followup_notes:e.target.value}))} style={inp} /></Fld>
            </div>
            <Sec title="Notas" />
            <textarea placeholder="Observações gerais..." value={leadForm.notes} onChange={e=>setLeadForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'64px'}} />
            {error&&<p style={{color:'#dc2626',fontSize:'15px',background:'#fff',borderRadius:'8px',padding:'8px 12px',marginTop:'10px'}}>{error}</p>}
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={saveLead} disabled={!leadForm.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!leadForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'11px 16px',background:'transparent',border:'2px solid #bbb',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showForm==='client' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'560px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'2px solid #bbb',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>{editing?'Editar Cliente':'Novo Cliente'}</h2>
              <button onClick={()=>setShowForm('')} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <Sec title="Informações básicas" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input placeholder="Nome completo *" value={clientForm.name} onChange={e=>setClientForm(f=>({...f,name:e.target.value}))} style={inp} />
              <Fld label="CPF"><input placeholder="000.000.000-00" value={clientForm.cpf} onChange={e=>setClientForm(f=>({...f,cpf:e.target.value}))} style={inp} /></Fld>
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
              {SOURCES.map(s=><button key={s} onClick={()=>setClientForm(f=>({...f,source:s}))} style={{padding:'8px 4px',borderRadius:'8px',border:`1px solid ${clientForm.source===s?sourceColor[s]:'#e8e8ee'}`,background:clientForm.source===s?`${sourceColor[s]}22`:'transparent',color:clientForm.source===s?sourceColor[s]:'#999',fontSize:'15px',cursor:'pointer',fontWeight:clientForm.source===s?600:400}}>{s}</button>)}
            </div>
            <Sec title="Compra" />
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                <Fld label="Produto"><input placeholder="Suplemento" value={clientForm.product} onChange={e=>setClientForm(f=>({...f,product:e.target.value}))} style={inp} /></Fld>
                <Fld label="Data compra"><input type="date" value={clientForm.purchase_date} onChange={e=>setClientForm(f=>({...f,purchase_date:e.target.value}))} style={{...inp,colorScheme:'light'}} /></Fld>
                <Fld label="Qtd. potes"><input type="number" min="0" value={clientForm.pots_bought} onChange={e=>setClientForm(f=>({...f,pots_bought:e.target.value}))} style={inp} /></Fld>
              </div>
              {clientForm.purchase_date&&parseInt(clientForm.pots_bought)>0&&<p style={{fontSize:'15px',color:'#4c1d95',background:'#fff',borderRadius:'8px',padding:'8px 12px'}}>Potes terminam em: {new Date(new Date(clientForm.purchase_date).getTime()+parseInt(clientForm.pots_bought)*30*24*60*60*1000).toLocaleDateString('pt-BR')}</p>}
              <Fld label="Valor (R$)"><input type="number" placeholder="0,00" value={clientForm.value} onChange={e=>setClientForm(f=>({...f,value:e.target.value}))} style={inp} /></Fld>
              <Fld label="Status"><select value={clientForm.status} onChange={e=>setClientForm(f=>({...f,status:e.target.value}))} style={sel}><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option><option value="Recompra">Recompra</option></select></Fld>
            </div>
            <Sec title="Redes sociais" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'8px',marginBottom:'8px'}}>
              <select value={clientForm.social1_type} onChange={e=>setClientForm(f=>({...f,social1_type:e.target.value}))} style={sel}><option>Instagram</option><option>TikTok</option><option>Facebook</option><option>YouTube</option><option>Outro</option></select>
              <input placeholder="@usuario" value={clientForm.social1_user} onChange={e=>setClientForm(f=>({...f,social1_user:e.target.value}))} style={inp} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'8px',marginBottom:'8px'}}>
              <select value={clientForm.social2_type} onChange={e=>setClientForm(f=>({...f,social2_type:e.target.value}))} style={sel}><option>TikTok</option><option>Instagram</option><option>Facebook</option><option>YouTube</option><option>Outro</option></select>
              <input placeholder="@usuario" value={clientForm.social2_user} onChange={e=>setClientForm(f=>({...f,social2_user:e.target.value}))} style={inp} />
            </div>
            <Sec title="Notas" />
            <textarea value={clientForm.notes} onChange={e=>setClientForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'64px'}} />
            {error&&<p style={{color:'#dc2626',fontSize:'15px',background:'#fff',borderRadius:'8px',padding:'8px 12px',marginTop:'10px'}}>{error}</p>}
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={saveClient} disabled={!clientForm.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!clientForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm('')} style={{padding:'11px 16px',background:'transparent',border:'2px solid #bbb',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

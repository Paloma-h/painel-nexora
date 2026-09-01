'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'
const inp: any = {width:'100%',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'9px 12px',color:'#111',fontSize:'15px',outline:'none',boxSizing:'border-box'}
const sel: any = {width:'100%',background:'#ffffff',border:'2px solid #bbb',borderRadius:'10px',padding:'9px 12px',color:'#111',fontSize:'15px',outline:'none'}
function Fld({label,children}:{label:string,children:any}) {
  return <div><label style={{fontSize:'15px',color:'#444',display:'block',marginBottom:'4px'}}>{label}</label>{children}</div>
}
const TYPES = ['Grande compra','Compra rotineira','Presente','Outro']
const CATEGORIES = ['Eletrônico','Veículo','Imóvel','Roupa','Calçado','Casa','Beleza','Mercado','Farmácia','Curso','Viagem','Presente','Outro']
const PRIORITIES = ['Urgente','Importante','Pode esperar']
const STATUS_LIST = ['Aguardando promoção','Em observação','Comprado','Descartado']
const EMPTY = {name:'',type:'Grande compra',category:'Eletrônico',target_price:'',current_price:'',url:'',priority:'Pode esperar',status:'Aguardando promoção',notes:'',links:[] as {url:string,loja:string,preco:string,data:string}[]}
const statusColor: any = {'Aguardando promoção':'#d4b84a','Em observação':'#7c6ff7','Comprado':'#4caf7d','Descartado':'#888'}
const priorityColor: any = {'Urgente':'#e05252','Importante':'#d4b84a','Pode esperar':'#888'}
const typeIcon: any = {'Grande compra':'💎','Compra rotineira':'🛒','Presente':'🎁','Outro':'📦'}
const typeColor: any = {'Grande compra':'#7c6ff7','Compra rotineira':'#4caf7d','Presente':'#e08c42','Outro':'#888'}
function fmt(v:number|null) { if (!v) return null; return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }

export default function DesejosPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterType, setFilterType] = useState('Todos')
  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const {data} = await supabase.from('pendencias_desejos').select('*').eq('user_id',USER_ID).order('updated_at',{ascending:false})
    setItems(data||[]); setLoading(false)
  }
  function openNew() { setEditing(null); setForm({...EMPTY}); setShowForm(true) }
  function openEdit(item:any) {
    setEditing(item)
    setForm({name:item.name,type:item.type||'Grande compra',category:item.category||'Eletrônico',target_price:item.target_price?.toString()||'',current_price:item.current_price?.toString()||'',url:item.url||'',priority:item.priority||'Pode esperar',status:item.status||'Aguardando promoção',notes:item.notes||'',links:item.links||[]})
    setShowForm(true)
  }
  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    const data: any = {name:form.name.trim(),type:form.type,category:form.category,target_price:form.target_price?parseFloat(form.target_price):null,current_price:form.current_price?parseFloat(form.current_price):null,url:form.url||null,priority:form.priority,status:form.status,notes:form.notes||null,links:form.links&&form.links.length>0?form.links:null,user_id:USER_ID,updated_at:now}
    if (editing) { await supabase.from('pendencias_desejos').update(data).eq('id',editing.id) }
    else { await supabase.from('pendencias_desejos').insert({...data,id:crypto.randomUUID(),created_at:now}) }
    setSaving(false); setShowForm(false); load()
  }
  async function remove(id:string) {
    if (!confirm('Excluir item?')) return
    await supabase.from('pendencias_desejos').delete().eq('id',id); load()
  }
  const filtered = items.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) && (filterStatus==='Todos'||c.status===filterStatus) && (filterType==='Todos'||c.type===filterType))
  const aguardando = items.filter(c=>c.status==='Aguardando promoção').length
  const comprados = items.filter(c=>c.status==='Comprado').length
  const urgentes = items.filter(c=>c.priority==='Urgente'&&c.status!=='Comprado').length
  function discount(item:any) {
    if (!item.current_price||!item.target_price) return null
    return Math.round(((item.current_price-item.target_price)/item.current_price)*100)
  }
  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />
      <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
        <div style={{maxWidth:'860px',margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <div>
              <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>🛒 Lista de Desejos</h1>
              <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{items.length} item{items.length!==1?'s':''} na lista</p>
            </div>
            <button onClick={openNew} style={{padding:'8px 18px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Novo Item</button>
          </div>
          {items.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'20px'}}>
              <div style={{background:'#fff',border:'2px solid #eab308',borderRadius:'12px',padding:'14px',textAlign:'center'}}><p style={{color:'#854d0e',fontSize:'22px',fontWeight:700}}>{aguardando}</p><p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>Aguardando promoção</p></div>
              <div style={{background:'#fff',border:'2px solid #f87171',borderRadius:'12px',padding:'14px',textAlign:'center'}}><p style={{color:'#dc2626',fontSize:'22px',fontWeight:700}}>{urgentes}</p><p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>Urgentes</p></div>
              <div style={{background:'#fff',border:'1px solid #ddf5e8',borderRadius:'12px',padding:'14px',textAlign:'center'}}><p style={{color:'#15803d',fontSize:'22px',fontWeight:700}}>{comprados}</p><p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>Comprados</p></div>
            </div>
          )}
          <div style={{display:'flex',gap:'10px',marginBottom:'16px',flexWrap:'wrap'}}>
            <input placeholder="Buscar item..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:'160px',background:'#fff',border:'2px solid #bbb',borderRadius:'10px',padding:'8px 12px',color:'#111',fontSize:'15px',outline:'none'}}/>
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{...sel,width:'auto',padding:'8px 12px',fontSize:'15px'}}><option value="Todos">Todos os tipos</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...sel,width:'auto',padding:'8px 12px',fontSize:'15px'}}><option value="Todos">Todos os status</option>{STATUS_LIST.map(s=><option key={s}>{s}</option>)}</select>
          </div>
          {loading ? <p style={{color:'#444',textAlign:'center',padding:'40px'}}>Carregando...</p> : (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {filtered.length===0 && <p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhum item encontrado</p>}
              {filtered.map(item => {
                const diff = discount(item)
                return (
                  <div key={item.id} style={{borderRadius:'14px',background:'#fff',border:`1px solid ${item.priority==='Urgente'?'#ffc8c8':'#f0f0f3'}`,padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{width:'42px',height:'42px',borderRadius:'10px',background:`${typeColor[item.type]||'#888'}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>{typeIcon[item.type]||'📦'}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                        <p style={{color:'#111',fontSize:'15px',fontWeight:600}}>{item.name}</p>
                        <span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${typeColor[item.type]||'#888'}20`,color:typeColor[item.type]||'#888'}}>{item.type}</span>
                        <span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${statusColor[item.status]||'#888'}22`,color:statusColor[item.status]||'#888'}}>{item.status}</span>
                        <span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${priorityColor[item.priority]||'#888'}18`,color:priorityColor[item.priority]||'#888'}}>{item.priority}</span>
                      </div>
                      <div style={{display:'flex',gap:'12px',marginTop:'5px',flexWrap:'wrap',alignItems:'center'}}>
                        <span style={{color:'#444',fontSize:'15px'}}>{item.category}</span>
                        {item.target_price && <span style={{color:'#15803d',fontSize:'15px',fontWeight:600}}>Alvo: {fmt(item.target_price)}</span>}
                        {item.current_price && <span style={{color:'#333',fontSize:'15px'}}>Atual: {fmt(item.current_price)}</span>}
                        {diff!==null&&diff>0 && <span style={{color:'#dc2626',fontSize:'15px'}}>↑ {diff}% acima</span>}
                        {diff!==null&&diff<=0 && <span style={{color:'#15803d',fontSize:'15px'}}>✓ Dentro do alvo!</span>}
                      </div>
                      {item.notes && <p style={{color:'#444',fontSize:'13px',marginTop:'4px'}}>{item.notes}</p>}
                      {/* Links de lojas */}
                      {item.links && item.links.length > 0 && (() => {
                        const sorted = [...item.links].filter((l:any)=>l.preco).sort((a:any,b:any)=>parseFloat(a.preco)-parseFloat(b.preco))
                        const menorPreco = sorted.length > 0 ? sorted[0] : null
                        return (
                          <div style={{marginTop:'6px',display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
                            {menorPreco && <span style={{fontSize:'12px',padding:'2px 8px',borderRadius:'5px',background:'#ecfdf5',color:'#16a34a',fontWeight:700}}>💰 Menor: R$ {parseFloat(menorPreco.preco).toLocaleString('pt-BR',{minimumFractionDigits:2})} — {menorPreco.loja||'loja'}</span>}
                            <span style={{fontSize:'12px',color:'#7c3aed',fontWeight:600}}>🔗 {item.links.length} link{item.links.length>1?'s':''}</span>
                          </div>
                        )
                      })()}
                    </div>
                    <div style={{display:'flex',gap:'6px',flexShrink:0,alignItems:'center'}}>
                      {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{padding:'5px 9px',background:'#fff',border:'2px solid #7c3aed',borderRadius:'7px',color:'#5b21b6',fontSize:'13px',textDecoration:'none',fontWeight:600}}>Ver</a>}
                      <button onClick={()=>openEdit(item)} style={{padding:'5px 9px',background:'#fff',border:'none',borderRadius:'7px',color:'#333',fontSize:'13px',cursor:'pointer'}}>Editar</button>
                      <button onClick={()=>remove(item.id)} style={{padding:'5px 8px',background:'#fff',border:'none',borderRadius:'7px',color:'#dc2626',fontSize:'15px',cursor:'pointer'}}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'520px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'2px solid #bbb',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>{editing?'Editar Item':'Novo Item'}</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome do item *"><input placeholder="Ex: iPhone 16, Geladeira, Carro..." value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Tipo"><select value={form.type} onChange={e=>setForm((f:any)=>({...f,type:e.target.value}))} style={sel}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></Fld>
                <Fld label="Categoria"><select value={form.category} onChange={e=>setForm((f:any)=>({...f,category:e.target.value}))} style={sel}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Prioridade"><select value={form.priority} onChange={e=>setForm((f:any)=>({...f,priority:e.target.value}))} style={sel}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></Fld>
                <Fld label="Status"><select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))} style={sel}>{STATUS_LIST.map(s=><option key={s}>{s}</option>)}</select></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Preço alvo (R$)"><input type="number" min="0" step="0.01" placeholder="299,00" value={form.target_price} onChange={e=>setForm((f:any)=>({...f,target_price:e.target.value}))} style={inp}/></Fld>
                <Fld label="Preço atual (R$)"><input type="number" min="0" step="0.01" placeholder="450,00" value={form.current_price} onChange={e=>setForm((f:any)=>({...f,current_price:e.target.value}))} style={inp}/></Fld>
              </div>
              <Fld label="Link principal"><input placeholder="https://..." value={form.url} onChange={e=>setForm((f:any)=>({...f,url:e.target.value}))} style={inp}/></Fld>

              {/* Múltiplos links com preços */}
              <div style={{background:'#faf5ff',border:'2px solid #e9d5ff',borderRadius:'10px',padding:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <p style={{color:'#7c3aed',fontSize:'13px',fontWeight:700}}>🔗 Links de lojas com preços</p>
                  <button type="button" onClick={()=>setForm((f:any)=>({...f,links:[...(f.links||[]),{url:'',loja:'',preco:'',data:new Date().toISOString().split('T')[0]}]}))} style={{padding:'4px 12px',background:'#7c3aed',border:'none',borderRadius:'7px',color:'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>+ Link</button>
                </div>
                {(form.links||[]).length === 0 && <p style={{color:'#aaa',fontSize:'12px',textAlign:'center',padding:'8px 0'}}>Adicione links de diferentes lojas para comparar preços</p>}
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {(form.links||[]).map((link:any, i:number) => (
                    <div key={i} style={{display:'flex',gap:'6px',alignItems:'flex-end'}}>
                      <div style={{flex:2}}><label style={{fontSize:'11px',color:'#888'}}>Loja</label><input placeholder="Amazon, Shopee..." value={link.loja} onChange={e=>{const newLinks=[...(form.links||[])];newLinks[i]={...newLinks[i],loja:e.target.value};setForm((f:any)=>({...f,links:newLinks}))}} style={{...inp,fontSize:'13px',padding:'6px 8px'}}/></div>
                      <div style={{flex:1}}><label style={{fontSize:'11px',color:'#888'}}>Preço (R$)</label><input type="number" step="0.01" placeholder="299" value={link.preco} onChange={e=>{const newLinks=[...(form.links||[])];newLinks[i]={...newLinks[i],preco:e.target.value};setForm((f:any)=>({...f,links:newLinks}))}} style={{...inp,fontSize:'13px',padding:'6px 8px'}}/></div>
                      <div style={{flex:1}}><label style={{fontSize:'11px',color:'#888'}}>Data</label><input type="date" value={link.data} onChange={e=>{const newLinks=[...(form.links||[])];newLinks[i]={...newLinks[i],data:e.target.value};setForm((f:any)=>({...f,links:newLinks}))}} style={{...inp,fontSize:'13px',padding:'6px 8px',colorScheme:'light'}}/></div>
                      <div style={{flex:3}}><label style={{fontSize:'11px',color:'#888'}}>Link</label><input placeholder="https://..." value={link.url} onChange={e=>{const newLinks=[...(form.links||[])];newLinks[i]={...newLinks[i],url:e.target.value};setForm((f:any)=>({...f,links:newLinks}))}} style={{...inp,fontSize:'13px',padding:'6px 8px'}}/></div>
                      <button type="button" onClick={()=>{const newLinks=[...(form.links||[])];newLinks.splice(i,1);setForm((f:any)=>({...f,links:newLinks}))}} style={{padding:'6px 8px',background:'transparent',border:'none',color:'#dc2626',fontSize:'14px',cursor:'pointer',marginBottom:'2px'}}>✕</button>
                    </div>
                  ))}
                </div>
                {(form.links||[]).length > 1 && (() => {
                  const precos = (form.links||[]).filter((l:any)=>l.preco).map((l:any)=>({...l,preco:parseFloat(l.preco)})).sort((a:any,b:any)=>a.preco-b.preco)
                  if (precos.length > 0) {
                    const menor = precos[0]
                    return <p style={{color:'#16a34a',fontSize:'12px',fontWeight:700,marginTop:'8px',padding:'6px 10px',background:'#ecfdf5',borderRadius:'6px'}}>💰 Menor preço: R$ {menor.preco.toLocaleString('pt-BR',{minimumFractionDigits:2})} na <strong>{menor.loja||'loja sem nome'}</strong></p>
                  }
                  return null
                })()}
              </div>

              <Fld label="Notas"><textarea placeholder="Onde pesquisar, condições, observações..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'70px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #bbb',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
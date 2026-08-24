const fs = require('fs')
let c = fs.readFileSync('app/crm/page.tsx', 'utf8')

// 1. Adiciona estado do estoque
c = c.replace(
  "const [importMsg, setImportMsg] = useState('')",
  "const [importMsg, setImportMsg] = useState('')\n  const [estoque, setEstoque] = useState<any[]>([])\n  const [estoqueForm, setEstoqueForm] = useState({name:'',quantity:'0',min_quantity:'5',cost_price:'',sell_price:'',location:'',expiry_date:'',notes:''})\n  const [showMovForm, setShowMovForm] = useState<any>(null)\n  const [movQty, setMovQty] = useState('1')\n  const [movType, setMovType] = useState('saida')\n  const [movNotes, setMovNotes] = useState('')"
)

// 2. Carrega estoque no load
c = c.replace(
  "const [l, c, f] = await Promise.all([",
  "const [l, c, f, e] = await Promise.all(["
)
c = c.replace(
  "supabase.from('fornecedores').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false})\n    ])",
  "supabase.from('fornecedores').select('*').eq('user_id', USER_ID).order('created_at', {ascending:false}),\n      supabase.from('estoque').select('*').eq('user_id', USER_ID).order('name', {ascending:true})\n    ])"
)
c = c.replace(
  "setFornecedores(f.data || [])\n    setLoading(false)",
  "setFornecedores(f.data || [])\n    setEstoque(e.data || [])\n    setLoading(false)"
)

// 3. Adiciona funções de estoque antes do exportLeads
c = c.replace(
  "// ===== EXPORTAR =====",
  `// ===== ESTOQUE =====
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

  // ===== EXPORTAR =====`
)

// 4. Adiciona aba Estoque na navbar
c = c.replace(
  "<button onClick={()=>setTab('fornecedores')}",
  "<button onClick={()=>setTab('estoque')} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab==='estoque'?'#4caf7d':'transparent'}`,color:tab==='estoque'?'#4caf7d':'rgba(255,255,255,0.35)',fontSize:'13px',cursor:'pointer',fontWeight:tab==='estoque'?600:400}}>Estoque {estoque.length>0&&<span style={{background:'rgba(76,175,125,0.15)',color:'#4caf7d',borderRadius:'10px',padding:'1px 7px',fontSize:'11px',marginLeft:'4px'}}>{estoque.length}</span>}</button>\n          <button onClick={()=>setTab('fornecedores')}"
)

// 5. Adiciona tab de estoque antes do fechamento das tabs
c = c.replace(
  "{tab==='fornecedores' && (",
  `{tab==='estoque' && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <div><h1 style={{color:'#fff',fontSize:'20px',fontWeight:700}}>Estoque</h1><p style={{color:'rgba(255,255,255,0.3)',fontSize:'12px',marginTop:'2px'}}>{estoque.length} produto(s) cadastrado(s)</p></div>
                  <button onClick={()=>{setEditing(null);setEstoqueForm({name:'',quantity:'0',min_quantity:'5',cost_price:'',sell_price:'',location:'',expiry_date:'',notes:''});setError('');setShowForm('estoque')}} style={{padding:'7px 14px',background:'#4caf7d',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>+ Novo Produto</button>
                </div>
                {loading?<p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'40px'}}>Carregando...</p>:(
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {estoque.length===0&&<p style={{color:'rgba(255,255,255,0.2)',textAlign:'center',padding:'40px'}}>Nenhum produto cadastrado</p>}
                    {estoque.map(p=>{
                      const isLow = p.quantity <= p.min_quantity
                      const isOut = p.quantity === 0
                      return (
                        <div key={p.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 15px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:\`1px solid \${isOut?'rgba(224,82,82,0.4)':isLow?'rgba(224,140,66,0.3)':'rgba(255,255,255,0.07)'}\`,cursor:'pointer'}} onClick={()=>{setEditing(p);setEstoqueForm({name:p.name,quantity:p.quantity?.toString()||'0',min_quantity:p.min_quantity?.toString()||'5',cost_price:p.cost_price?.toString()||'',sell_price:p.sell_price?.toString()||'',location:p.location||'',expiry_date:p.expiry_date||'',notes:p.notes||''});setError('');setShowForm('estoque')}}>
                          <div style={{width:'38px',height:'38px',borderRadius:'10px',background:isOut?'rgba(224,82,82,0.2)':isLow?'rgba(224,140,66,0.2)':'rgba(76,175,125,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:isOut?'#e05252':isLow?'#e08c42':'#4caf7d',fontWeight:700,fontSize:'16px',flexShrink:0}}>{p.quantity}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                              <p style={{color:'#fff',fontSize:'13px',fontWeight:500}}>{p.name}</p>
                              {p.location&&<span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'5px',background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.4)'}}>📍 {p.location}</span>}
                              {isOut&&<span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'5px',background:'rgba(224,82,82,0.15)',color:'#e05252'}}>SEM ESTOQUE</span>}
                              {!isOut&&isLow&&<span style={{fontSize:'10px',padding:'1px 7px',borderRadius:'5px',background:'rgba(224,140,66,0.15)',color:'#e08c42'}}>⚠ ESTOQUE BAIXO</span>}
                            </div>
                            <div style={{display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                              {p.sell_price&&<span style={{color:'#4caf7d',fontSize:'11px'}}>Venda: R$ {p.sell_price}</span>}
                              {p.cost_price&&<span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>Custo: R$ {p.cost_price}</span>}
                              {p.expiry_date&&<span style={{color:'rgba(255,255,255,0.3)',fontSize:'11px'}}>Val: {new Date(p.expiry_date+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                            </div>
                          </div>
                          <div style={{display:'flex',gap:'6px'}}>
                            <button onClick={e=>{e.stopPropagation();setShowMovForm(p);setMovType('entrada');setMovQty('1')}} style={{padding:'5px 9px',background:'rgba(76,175,125,0.12)',border:'1px solid rgba(76,175,125,0.2)',borderRadius:'7px',color:'#4caf7d',fontSize:'11px',cursor:'pointer'}}>+ Entrada</button>
                            <button onClick={e=>{e.stopPropagation();setShowMovForm(p);setMovType('saida');setMovQty('1')}} style={{padding:'5px 9px',background:'rgba(91,80,214,0.12)',border:'1px solid rgba(91,80,214,0.2)',borderRadius:'7px',color:'#a89ff7',fontSize:'11px',cursor:'pointer'}}>- Saída</button>
                            <button onClick={e=>{e.stopPropagation();removeEstoque(p.id)}} style={{padding:'5px 8px',background:'rgba(224,82,82,0.08)',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'11px',cursor:'pointer'}}>✕</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {tab==='fornecedores' && (`
)

// 6. Adiciona modal de estoque e movimentação antes do fechamento
c = c.replace(
  "{showForm==='forn' && (",
  `{showMovForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'360px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)'}}>
            <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600,marginBottom:'16px'}}>{movType==='entrada'?'+ Entrada':'- Saída'}: {showMovForm.name}</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={()=>setMovType('entrada')} style={{flex:1,padding:'8px',borderRadius:'8px',border:\`1px solid \${movType==='entrada'?'#4caf7d':'rgba(255,255,255,0.1)'}\`,background:movType==='entrada'?'rgba(76,175,125,0.15)':'transparent',color:movType==='entrada'?'#4caf7d':'rgba(255,255,255,0.3)',cursor:'pointer',fontWeight:600}}>+ Entrada</button>
                <button onClick={()=>setMovType('saida')} style={{flex:1,padding:'8px',borderRadius:'8px',border:\`1px solid \${movType==='saida'?'#a89ff7':'rgba(255,255,255,0.1)'}\`,background:movType==='saida'?'rgba(91,80,214,0.15)':'transparent',color:movType==='saida'?'#a89ff7':'rgba(255,255,255,0.3)',cursor:'pointer',fontWeight:600}}>- Saída</button>
              </div>
              <Fld label="Quantidade"><input type="number" min="1" value={movQty} onChange={e=>setMovQty(e.target.value)} style={inp} /></Fld>
              <Fld label="Observação"><input placeholder="Opcional" value={movNotes} onChange={e=>setMovNotes(e.target.value)} style={inp} /></Fld>
              <p style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>Estoque atual: {showMovForm.quantity} → {movType==='entrada'?showMovForm.quantity+parseInt(movQty||'0'):Math.max(0,showMovForm.quantity-parseInt(movQty||'0'))}</p>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={registrarMovimentacao} disabled={saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>{saving?'Salvando...':'Confirmar'}</button>
              <button onClick={()=>setShowMovForm(null)} style={{padding:'11px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showForm==='estoque' && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,overflowY:'auto',display:'flex',justifyContent:'center',padding:'20px'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#13131f',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.1)',height:'fit-content'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#fff',fontSize:'16px',fontWeight:600}}>{editing?'Editar Produto':'Novo Produto'}</h2>
              <button onClick={()=>setShowForm('')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'18px'}}>✕</button>
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
              <Fld label="Validade"><input type="date" value={estoqueForm.expiry_date} onChange={e=>setEstoqueForm(f=>({...f,expiry_date:e.target.value}))} style={{...inp,colorScheme:'dark'}} /></Fld>
              <Fld label="Notas"><textarea value={estoqueForm.notes} onChange={e=>setEstoqueForm(f=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}} /></Fld>
            </div>
            {error&&<p style={{color:'#e05252',fontSize:'12px',background:'rgba(224,82,82,0.1)',borderRadius:'8px',padding:'8px 12px',marginTop:'10px'}}>{error}</p>}
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <button onClick={saveEstoque} disabled={!estoqueForm.name.trim()||saving} style={{flex:1,padding:'11px',background:'#4caf7d',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',opacity:!estoqueForm.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              {editing&&<button onClick={()=>{removeEstoque(editing.id);setShowForm('')}} style={{padding:'11px 14px',background:'rgba(224,82,82,0.1)',border:'1px solid rgba(224,82,82,0.2)',borderRadius:'10px',color:'#e05252',fontSize:'13px',cursor:'pointer'}}>Apagar</button>}
              <button onClick={()=>setShowForm('')} style={{padding:'11px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showForm==='forn' && (`
)

fs.writeFileSync('app/crm/page.tsx', c)
console.log('Pronto!')
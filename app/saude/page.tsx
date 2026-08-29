'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'



const inp: any = {width:'100%',background:'#fff',border:'1px solid #d0d0d8',borderRadius:'10px',padding:'9px 12px',color:'#111',fontSize:'15px',outline:'none',boxSizing:'border-box'}
const sel: any = {width:'100%',background:'#ffffff',border:'1px solid #d0d0d8',borderRadius:'10px',padding:'9px 12px',color:'#111',fontSize:'15px',outline:'none'}

function Fld({label,children}:{label:string,children:any}) {
  return <div><label style={{fontSize:'15px',color:'#444',display:'block',marginBottom:'4px'}}>{label}</label>{children}</div>
}

// ── ATIVIDADES ──────────────────────────────────────────────────────
const TIPOS_ATIV = ['Musculação','Cardio','Yoga','Pilates','Caminhada','Corrida','Natação','Funcional','Outro']
const FREQ = ['Diário','2x por semana','3x por semana','4x por semana','5x por semana','Fins de semana','Variado']
const EMPTY_ATIV = {name:'',type:'Musculação',frequency:'3x por semana',duration_min:'',time:'',notes:'',active:true}

function AtividadesTab() {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_ATIV)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const {data} = await supabase.from('saude_atividades').select('*').eq('user_id',USER_ID).order('created_at',{ascending:false})
    setList(data||[])
  }

  function openNew() { setEditing(null); setForm(EMPTY_ATIV); setShowForm(true) }
  function openEdit(item:any) { setEditing(item); setForm({name:item.name,type:item.type,frequency:item.frequency,duration_min:item.duration_min?.toString()||'',time:item.time||'',notes:item.notes||'',active:item.active??true}); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {name:form.name.trim(),type:form.type,frequency:form.frequency,duration_min:form.duration_min?parseInt(form.duration_min):null,time:form.time||null,notes:form.notes||null,active:form.active,user_id:USER_ID}
    if (editing) await supabase.from('saude_atividades').update(data).eq('id',editing.id)
    else await supabase.from('saude_atividades').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir atividade?')) return
    await supabase.from('saude_atividades').delete().eq('id',id); load()
  }

  async function toggleActive(item:any) {
    await supabase.from('saude_atividades').update({active:!item.active}).eq('id',item.id); load()
  }

  const typeColor:any = {Musculação:'#7c6ff7',Cardio:'#e05252',Yoga:'#4caf7d',Pilates:'#4caf7d',Caminhada:'#4caf7d',Corrida:'#e08c42',Natação:'#4267B2',Funcional:'#d4b84a',Outro:'#888'}

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div>
          <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>Atividades Físicas</h1>
          <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{list.filter(a=>a.active).length} ativas · {list.length} total</p>
        </div>
        <button onClick={openNew} style={{padding:'8px 16px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Adicionar</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhuma atividade cadastrada</p>}
        {list.map(item => (
          <div key={item.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#fff',border:'1px solid #d0d0d8',opacity:item.active?1:0.5}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:`${typeColor[item.type]||'#888'}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>
              {item.type==='Musculação'?'🏋️':item.type==='Cardio'||item.type==='Corrida'?'🏃':item.type==='Yoga'||item.type==='Pilates'?'🧘':item.type==='Caminhada'?'🚶':item.type==='Natação'?'🏊':'⚡'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <p style={{color:'#111',fontSize:'15px',fontWeight:500}}>{item.name}</p>
                <span style={{fontSize:'12px',padding:'1px 7px',borderRadius:'5px',background:`${typeColor[item.type]||'#888'}22`,color:typeColor[item.type]||'#888'}}>{item.type}</span>
              </div>
              <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>
                {item.frequency}{item.duration_min?` · ${item.duration_min} min`:''}{item.time?` · ${item.time}`:''}
              </p>
              {item.notes && <p style={{color:'#555',fontSize:'15px',marginTop:'2px'}}>{item.notes}</p>}
            </div>
            <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
              <button onClick={()=>toggleActive(item)} style={{padding:'5px 10px',background:item.active?'#ddf5e8':'#f5f5f5',border:'none',borderRadius:'7px',color:item.active?'#4caf7d':'#999',fontSize:'15px',cursor:'pointer'}}>{item.active?'Ativa':'Inativa'}</button>
              <button onClick={()=>openEdit(item)} style={{padding:'5px 10px',background:'#fff',border:'none',borderRadius:'7px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Editar</button>
              <button onClick={()=>remove(item.id)} style={{padding:'5px 8px',background:'#fff0f0',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'1px solid #d0d0d8'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>{editing?'Editar Atividade':'Nova Atividade'}</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome da atividade *"><input placeholder="Ex: Treino A — Peito e Tríceps" value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Tipo"><select value={form.type} onChange={e=>setForm((f:any)=>({...f,type:e.target.value}))} style={sel}>{TIPOS_ATIV.map(t=><option key={t}>{t}</option>)}</select></Fld>
                <Fld label="Frequência"><select value={form.frequency} onChange={e=>setForm((f:any)=>({...f,frequency:e.target.value}))} style={sel}>{FREQ.map(f=><option key={f}>{f}</option>)}</select></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Duração (min)"><input type="number" placeholder="60" value={form.duration_min} onChange={e=>setForm((f:any)=>({...f,duration_min:e.target.value}))} style={inp}/></Fld>
                <Fld label="Horário"><input type="time" value={form.time} onChange={e=>setForm((f:any)=>({...f,time:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              </div>
              <Fld label="Observações"><textarea placeholder="Detalhes, exercícios, séries..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'72px'}}/></Fld>
              <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
                <input type="checkbox" checked={form.active} onChange={e=>setForm((f:any)=>({...f,active:e.target.checked}))} />
                <span style={{color:'#444',fontSize:'15px'}}>Atividade ativa</span>
              </label>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'1px solid #d0d0d8',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MEDIDAS ──────────────────────────────────────────────────────────
const EMPTY_MED = {date:'',weight:'',waist:'',hip:'',chest:'',arm:'',thigh:'',notes:''}

function MedidasTab() {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(EMPTY_MED)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const {data} = await supabase.from('saude_medidas').select('*').eq('user_id',USER_ID).order('date',{ascending:false})
    setList(data||[])
  }

  async function save() {
    if (!form.date) return
    setSaving(true)
    const data = {date:form.date,weight:form.weight?parseFloat(form.weight):null,waist:form.waist?parseFloat(form.waist):null,hip:form.hip?parseFloat(form.hip):null,chest:form.chest?parseFloat(form.chest):null,arm:form.arm?parseFloat(form.arm):null,thigh:form.thigh?parseFloat(form.thigh):null,notes:form.notes||null,user_id:USER_ID}
    await supabase.from('saude_medidas').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); setForm(EMPTY_MED); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir registro?')) return
    await supabase.from('saude_medidas').delete().eq('id',id); load()
  }

  const latest = list[0]

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div>
          <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>Medidas e Peso</h1>
          <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{list.length} registro{list.length!==1?'s':''}</p>
        </div>
        <button onClick={()=>{setForm({...EMPTY_MED,date:new Date().toISOString().split('T')[0]});setShowForm(true)}} style={{padding:'8px 16px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Registrar</button>
      </div>

      {/* Último registro em destaque */}
      {latest && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'24px'}}>
          {[
            {label:'Peso',value:latest.weight,unit:'kg',color:'#6d5ce0'},
            {label:'Cintura',value:latest.waist,unit:'cm',color:'#4caf7d'},
            {label:'Quadril',value:latest.hip,unit:'cm',color:'#e08c42'},
            {label:'Peito',value:latest.chest,unit:'cm',color:'#4267B2'},
          ].map(m => m.value && (
            <div key={m.label} style={{background:'#fff',border:'1px solid #d0d0d8',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
              <p style={{color:'#444',fontSize:'12px',marginBottom:'4px'}}>{m.label}</p>
              <p style={{color:m.color,fontSize:'22px',fontWeight:700}}>{m.value}</p>
              <p style={{color:'#555',fontSize:'12px'}}>{m.unit}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhum registro ainda</p>}
        {list.map(item => (
          <div key={item.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderRadius:'12px',background:'#fff',border:'1px solid #d0d0d8'}}>
            <div style={{flex:1}}>
              <p style={{color:'#444',fontSize:'15px',marginBottom:'6px'}}>{new Date(item.date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</p>
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                {item.weight && <span style={{color:'#6d5ce0',fontSize:'15px',fontWeight:600}}>{item.weight} kg</span>}
                {item.waist && <span style={{color:'#333',fontSize:'15px'}}>Cintura: {item.waist} cm</span>}
                {item.hip && <span style={{color:'#333',fontSize:'15px'}}>Quadril: {item.hip} cm</span>}
                {item.chest && <span style={{color:'#333',fontSize:'15px'}}>Peito: {item.chest} cm</span>}
                {item.arm && <span style={{color:'#333',fontSize:'15px'}}>Braço: {item.arm} cm</span>}
                {item.thigh && <span style={{color:'#333',fontSize:'15px'}}>Coxa: {item.thigh} cm</span>}
              </div>
              {item.notes && <p style={{color:'#555',fontSize:'15px',marginTop:'4px'}}>{item.notes}</p>}
            </div>
            <button onClick={()=>remove(item.id)} style={{padding:'5px 8px',background:'#fff0f0',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>✕</button>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'1px solid #d0d0d8'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>Novo Registro</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Data *"><input type="date" value={form.date} onChange={e=>setForm((f:any)=>({...f,date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Peso (kg)"><input type="number" step="0.1" placeholder="65.5" value={form.weight} onChange={e=>setForm((f:any)=>({...f,weight:e.target.value}))} style={inp}/></Fld>
                <Fld label="Cintura (cm)"><input type="number" step="0.5" placeholder="70" value={form.waist} onChange={e=>setForm((f:any)=>({...f,waist:e.target.value}))} style={inp}/></Fld>
                <Fld label="Quadril (cm)"><input type="number" step="0.5" placeholder="90" value={form.hip} onChange={e=>setForm((f:any)=>({...f,hip:e.target.value}))} style={inp}/></Fld>
                <Fld label="Peito (cm)"><input type="number" step="0.5" placeholder="85" value={form.chest} onChange={e=>setForm((f:any)=>({...f,chest:e.target.value}))} style={inp}/></Fld>
                <Fld label="Braço (cm)"><input type="number" step="0.5" placeholder="30" value={form.arm} onChange={e=>setForm((f:any)=>({...f,arm:e.target.value}))} style={inp}/></Fld>
                <Fld label="Coxa (cm)"><input type="number" step="0.5" placeholder="55" value={form.thigh} onChange={e=>setForm((f:any)=>({...f,thigh:e.target.value}))} style={inp}/></Fld>
              </div>
              <Fld label="Observações"><textarea placeholder="Como se sentiu, contexto..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.date||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!form.date||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'1px solid #d0d0d8',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── DIETAS ───────────────────────────────────────────────────────────
const EMPTY_DIETA = {name:'',description:'',start_date:'',status:'Ativa',goal:'',meals:'',notes:''}

function DietasTab() {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_DIETA)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const {data} = await supabase.from('saude_dietas').select('*').eq('user_id',USER_ID).order('created_at',{ascending:false})
    setList(data||[])
  }

  function openNew() { setEditing(null); setForm({...EMPTY_DIETA,start_date:new Date().toISOString().split('T')[0]}); setShowForm(true) }
  function openEdit(item:any) { setEditing(item); setForm({name:item.name,description:item.description||'',start_date:item.start_date||'',status:item.status||'Ativa',goal:item.goal||'',meals:item.meals||'',notes:item.notes||''}); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {name:form.name.trim(),description:form.description||null,start_date:form.start_date||null,status:form.status,goal:form.goal||null,meals:form.meals||null,notes:form.notes||null,user_id:USER_ID}
    if (editing) await supabase.from('saude_dietas').update(data).eq('id',editing.id)
    else await supabase.from('saude_dietas').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir dieta?')) return
    await supabase.from('saude_dietas').delete().eq('id',id); load()
  }

  const statusColor:any = {'Ativa':'#4caf7d','Pausada':'#d4b84a','Concluída':'#a89ff7'}

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div>
          <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>Dietas</h1>
          <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{list.filter(d=>d.status==='Ativa').length} ativa{list.filter(d=>d.status==='Ativa').length!==1?'s':''}</p>
        </div>
        <button onClick={openNew} style={{padding:'8px 16px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Nova Dieta</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhuma dieta cadastrada</p>}
        {list.map(item => (
          <div key={item.id} style={{padding:'16px',borderRadius:'12px',background:'#fff',border:'1px solid #d0d0d8',cursor:'pointer'}} onClick={()=>openEdit(item)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <p style={{color:'#111',fontSize:'15px',fontWeight:600}}>🥗 {item.name}</p>
                  <span style={{fontSize:'12px',padding:'2px 8px',borderRadius:'5px',background:`${statusColor[item.status]||'#888'}22`,color:statusColor[item.status]||'#888'}}>{item.status}</span>
                </div>
                {item.goal && <p style={{color:'#333',fontSize:'15px',marginBottom:'4px'}}>Objetivo: {item.goal}</p>}
                {item.description && <p style={{color:'#444',fontSize:'15px'}}>{item.description}</p>}
                {item.meals && (
                  <div style={{marginTop:'8px',padding:'10px',background:'#fff',borderRadius:'8px'}}>
                    <p style={{color:'#555',fontSize:'12px',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Refeições</p>
                    <p style={{color:'#444',fontSize:'15px',whiteSpace:'pre-wrap'}}>{item.meals}</p>
                  </div>
                )}
              </div>
              <button onClick={e=>{e.stopPropagation();remove(item.id)}} style={{padding:'5px 8px',background:'#fff0f0',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'15px',cursor:'pointer',marginLeft:'12px'}}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'520px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'1px solid #d0d0d8'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>{editing?'Editar Dieta':'Nova Dieta'}</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome da dieta *"><input placeholder="Ex: Low Carb, Cetogênica..." value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Status"><select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))} style={sel}><option>Ativa</option><option>Pausada</option><option>Concluída</option></select></Fld>
                <Fld label="Início"><input type="date" value={form.start_date} onChange={e=>setForm((f:any)=>({...f,start_date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              </div>
              <Fld label="Objetivo"><input placeholder="Ex: Perder 5kg, ganhar massa..." value={form.goal} onChange={e=>setForm((f:any)=>({...f,goal:e.target.value}))} style={inp}/></Fld>
              <Fld label="Descrição"><textarea placeholder="Como funciona a dieta..." value={form.description} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
              <Fld label="Refeições do dia"><textarea placeholder="Café: ...\nAlmoço: ...\nJantar: ..." value={form.meals} onChange={e=>setForm((f:any)=>({...f,meals:e.target.value}))} style={{...inp,resize:'none',height:'100px'}}/></Fld>
              <Fld label="Notas"><textarea placeholder="Observações, restrições..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'1px solid #d0d0d8',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MÉDICOS ──────────────────────────────────────────────────────────
const EMPTY_DOC = {name:'',specialty:'',phone:'',address:'',next_appointment:'',next_appointment_time:'',notes:''}

function MedicosTab() {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_DOC)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const {data} = await supabase.from('saude_medicos').select('*').eq('user_id',USER_ID).order('next_appointment',{ascending:true})
    setList(data||[])
  }

  function openNew() { setEditing(null); setForm(EMPTY_DOC); setShowForm(true) }
  function openEdit(item:any) { setEditing(item); setForm({name:item.name,specialty:item.specialty||'',phone:item.phone||'',address:item.address||'',next_appointment:item.next_appointment||'',next_appointment_time:item.next_appointment_time||'',notes:item.notes||''}); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {name:form.name.trim(),specialty:form.specialty||null,phone:form.phone||null,address:form.address||null,next_appointment:form.next_appointment||null,next_appointment_time:form.next_appointment_time||null,notes:form.notes||null,user_id:USER_ID}
    if (editing) await supabase.from('saude_medicos').update(data).eq('id',editing.id)
    else await supabase.from('saude_medicos').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir médico?')) return
    await supabase.from('saude_medicos').delete().eq('id',id); load()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div>
          <h1 style={{color:'#111',fontSize:'22px',fontWeight:700}}>Médicos</h1>
          <p style={{color:'#444',fontSize:'15px',marginTop:'2px'}}>{list.length} médico{list.length!==1?'s':''} cadastrado{list.length!==1?'s':''}</p>
        </div>
        <button onClick={openNew} style={{padding:'8px 16px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>+ Adicionar</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#555',textAlign:'center',padding:'40px'}}>Nenhum médico cadastrado</p>}
        {list.map(item => {
          const hasUpcoming = item.next_appointment && item.next_appointment >= today
          const isToday = item.next_appointment === today
          return (
            <div key={item.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#fff',border:`1px solid ${isToday?'#c0b8ff':'#f0f0f3'}`,cursor:'pointer'}} onClick={()=>openEdit(item)}>
              <div style={{width:'42px',height:'42px',borderRadius:'50%',background:'#e8e4ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>🩺</div>
              <div style={{flex:1}}>
                <p style={{color:'#111',fontSize:'15px',fontWeight:500}}>{item.name}</p>
                {item.specialty && <p style={{color:'#6d5ce0',fontSize:'15px',marginTop:'1px'}}>{item.specialty}</p>}
                <div style={{display:'flex',gap:'10px',marginTop:'4px',flexWrap:'wrap'}}>
                  {item.phone && <span style={{color:'#444',fontSize:'15px'}}>📞 {item.phone}</span>}
                  {item.next_appointment && <span style={{color:isToday?'#a89ff7':hasUpcoming?'#4caf7d':'#999',fontSize:'15px',fontWeight:isToday?600:400}}>
                    {isToday?'🔔 Consulta HOJE':hasUpcoming?`Consulta: ${new Date(item.next_appointment+'T12:00:00').toLocaleDateString('pt-BR')}`:`Última: ${new Date(item.next_appointment+'T12:00:00').toLocaleDateString('pt-BR')}`}
                    {item.next_appointment_time?` às ${item.next_appointment_time}`:''}
                  </span>}
                </div>
                {item.notes && <p style={{color:'#555',fontSize:'15px',marginTop:'4px'}}>{item.notes}</p>}
              </div>
              <button onClick={e=>{e.stopPropagation();remove(item.id)}} style={{padding:'5px 8px',background:'#fff0f0',border:'none',borderRadius:'7px',color:'#e05252',fontSize:'15px',cursor:'pointer'}}>✕</button>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#ffffff',borderRadius:'16px',padding:'24px',border:'1px solid #d0d0d8'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:600}}>{editing?'Editar Médico':'Novo Médico'}</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome do médico *"><input placeholder="Dr. João Silva" value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Especialidade"><input placeholder="Cardiologista" value={form.specialty} onChange={e=>setForm((f:any)=>({...f,specialty:e.target.value}))} style={inp}/></Fld>
                <Fld label="Telefone"><input placeholder="(00) 00000-0000" value={form.phone} onChange={e=>setForm((f:any)=>({...f,phone:e.target.value}))} style={inp}/></Fld>
              </div>
              <Fld label="Endereço / Clínica"><input placeholder="Rua..." value={form.address} onChange={e=>setForm((f:any)=>({...f,address:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Próxima consulta"><input type="date" value={form.next_appointment} onChange={e=>setForm((f:any)=>({...f,next_appointment:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                <Fld label="Horário"><input type="time" value={form.next_appointment_time} onChange={e=>setForm((f:any)=>({...f,next_appointment_time:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              </div>
              <Fld label="Notas"><textarea placeholder="Observações, medicamentos, histórico..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'80px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#5b50d6',border:'none',borderRadius:'10px',color:'#111',fontSize:'15px',fontWeight:600,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'1px solid #d0d0d8',borderRadius:'10px',color:'#333',fontSize:'15px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PÁGINA PRINCIPAL ─────────────────────────────────────────────────
const TABS = [
  {id:'atividades',label:'💪 Atividades'},
  {id:'medidas',label:'⚖️ Medidas e Peso'},
  {id:'dietas',label:'🥗 Dietas'},
  {id:'medicos',label:'🩺 Médicos'},
]

export default function SaudePage() {
  const [tab, setTab] = useState('atividades')

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#ffffff'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column',overflowY:'auto'}}>
        {/* Tabs */}
        <div style={{background:'#f9f9fb',borderBottom:'1px solid #d0d0d8',padding:'0 28px',display:'flex',gap:'4px',alignItems:'center',flexShrink:0}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'14px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${tab===t.id?'#7c6ff7':'transparent'}`,color:tab===t.id?'#a89ff7':'#999',fontSize:'15px',cursor:'pointer',fontWeight:tab===t.id?600:400,whiteSpace:'nowrap'}}>{t.label}</button>
          ))}
        </div>
        <div style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
          <div style={{maxWidth:'860px',margin:'0 auto'}}>
            {tab==='atividades' && <AtividadesTab />}
            {tab==='medidas' && <MedidasTab />}
            {tab==='dietas' && <DietasTab />}
            {tab==='medicos' && <MedicosTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

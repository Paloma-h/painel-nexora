'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'

const MEMBROS = [
  { id: 'paloma',  label: 'Paloma',  emoji: '👩', tipo: 'pessoa' },
  { id: 'fabio',   label: 'Fábio',   emoji: '👨', tipo: 'pessoa' },
  { id: 'arthur',  label: 'Arthur',  emoji: '👦', tipo: 'pessoa' },
  { id: 'mae',     label: 'Mãe',     emoji: '👩', tipo: 'pessoa' },
  { id: 'pai',     label: 'Pai',     emoji: '👨', tipo: 'pessoa' },
]

// Pets serão carregados do Supabase + hardcoded iniciais
const PETS_DEFAULT = [
  { id: 'pet1', label: 'Pet 1', emoji: '🐕', tipo: 'pet', especie: 'Cachorro' },
]

const TABS_PESSOA = [
  {id:'medicos',label:'🩺 Médicos'},
  {id:'medicamentos',label:'💊 Medicamentos'},
  {id:'exames',label:'🔬 Exames'},
  {id:'plano',label:'🏥 Plano de Saúde'},
  {id:'atividades',label:'💪 Atividades'},
  {id:'medidas',label:'⚖️ Medidas'},
  {id:'dietas',label:'🥗 Dietas'},
]

const TABS_PET = [
  {id:'veterinarios',label:'🩺 Veterinários'},
  {id:'vacinas_pet',label:'💉 Vacinas'},
  {id:'medicamentos_pet',label:'💊 Medicamentos'},
  {id:'cuidados',label:'🛁 Cuidados'},
  {id:'info_pet',label:'📋 Informações'},
]

const inp: any = {width:'100%',background:'#fff',border:'2px solid #e5e5ea',borderRadius:'10px',padding:'10px 12px',color:'#111',fontSize:'14px',outline:'none',boxSizing:'border-box'}
const sel: any = {width:'100%',background:'#fff',border:'2px solid #e5e5ea',borderRadius:'10px',padding:'10px 12px',color:'#111',fontSize:'14px',outline:'none'}

function Fld({label,children}:{label:string,children:any}) {
  return <div><label style={{fontSize:'13px',color:'#555',display:'block',marginBottom:'4px',fontWeight:600}}>{label}</label>{children}</div>
}

// ══════════════════════════════════════════════════════════════════════
// MÉDICOS / VETERINÁRIOS (compartilhado)
// ══════════════════════════════════════════════════════════════════════
const EMPTY_DOC = {name:'',specialty:'',phone:'',address:'',next_appointment:'',next_appointment_time:'',notes:'',person:''}
const ESPECIALIDADES_PET = ['Clínico Geral','Dermatologia','Ortopedia','Cardiologia','Oftalmologia','Odontologia','Cirurgião','Oncologia','Outro']

function MedicosTab({person, isPet}:{person:string, isPet:boolean}) {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_DOC)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [person])
  async function load() {
    const {data} = await supabase.from('saude_medicos').select('*').eq('user_id',USER_ID).eq('person',person).order('next_appointment',{ascending:true})
    // fallback: se não tiver coluna person, carrega tudo
    if (!data || data.length === 0) {
      const {data:all} = await supabase.from('saude_medicos').select('*').eq('user_id',USER_ID).order('next_appointment',{ascending:true})
      // Só mostra registros sem person quando é paloma
      if (person === 'paloma') setList((all||[]).filter(d => !d.person || d.person === 'paloma'))
      else setList([])
    } else {
      setList(data)
    }
  }

  function openNew() { setEditing(null); setForm({...EMPTY_DOC,person}); setShowForm(true) }
  function openEdit(item:any) { setEditing(item); setForm({name:item.name,specialty:item.specialty||'',phone:item.phone||'',address:item.address||'',next_appointment:item.next_appointment||'',next_appointment_time:item.next_appointment_time||'',notes:item.notes||'',person:item.person||person}); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {name:form.name.trim(),specialty:form.specialty||null,phone:form.phone||null,address:form.address||null,next_appointment:form.next_appointment||null,next_appointment_time:form.next_appointment_time||null,notes:form.notes||null,person,user_id:USER_ID}
    if (editing) await supabase.from('saude_medicos').update(data).eq('id',editing.id)
    else await supabase.from('saude_medicos').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm(`Excluir ${isPet?'veterinário':'médico'}?`)) return
    await supabase.from('saude_medicos').delete().eq('id',id); load()
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const titulo = isPet ? 'Veterinários' : 'Médicos'

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div>
          <h2 style={{color:'#111',fontSize:'20px',fontWeight:800}}>{isPet?'🐾':'🩺'} {titulo}</h2>
          <p style={{color:'#888',fontSize:'13px',marginTop:'2px'}}>{list.length} cadastrado{list.length!==1?'s':''}</p>
        </div>
        <button onClick={openNew} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>+ Adicionar</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#bbb',textAlign:'center',padding:'40px',fontSize:'14px'}}>Nenhum {isPet?'veterinário':'médico'} cadastrado</p>}
        {list.map(item => {
          const hasUpcoming = item.next_appointment && item.next_appointment >= todayStr
          const isToday = item.next_appointment === todayStr
          return (
            <div key={item.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#fff',border:`2px solid ${isToday?'#7c3aed':'#e5e5ea'}`,cursor:'pointer'}} onClick={()=>openEdit(item)}>
              <div style={{width:'42px',height:'42px',borderRadius:'50%',background:isPet?'#fef3c7':'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>{isPet?'🐾':'🩺'}</div>
              <div style={{flex:1}}>
                <p style={{color:'#111',fontSize:'15px',fontWeight:700}}>{item.name}</p>
                {item.specialty && <p style={{color:'#7c3aed',fontSize:'13px',fontWeight:600,marginTop:'1px'}}>{item.specialty}</p>}
                <div style={{display:'flex',gap:'10px',marginTop:'4px',flexWrap:'wrap'}}>
                  {item.phone && <span style={{color:'#555',fontSize:'13px'}}>📞 {item.phone}</span>}
                  {item.next_appointment && <span style={{color:isToday?'#7c3aed':hasUpcoming?'#16a34a':'#999',fontSize:'13px',fontWeight:isToday?700:400}}>
                    {isToday?'🔔 HOJE':hasUpcoming?`📅 ${new Date(item.next_appointment+'T12:00:00').toLocaleDateString('pt-BR')}`:`Último: ${new Date(item.next_appointment+'T12:00:00').toLocaleDateString('pt-BR')}`}
                    {item.next_appointment_time?` às ${item.next_appointment_time}`:''}
                  </span>}
                </div>
                {item.notes && <p style={{color:'#888',fontSize:'12px',marginTop:'4px'}}>{item.notes}</p>}
              </div>
              <button onClick={e=>{e.stopPropagation();remove(item.id)}} style={{padding:'5px 8px',background:'transparent',border:'none',color:'#dc2626',fontSize:'16px',cursor:'pointer'}}>✕</button>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#fff',borderRadius:'16px',padding:'24px',border:'2px solid #e5e5ea'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:700}}>{editing?'Editar':'Novo'} {isPet?'Veterinário':'Médico'}</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label={`Nome do ${isPet?'veterinário':'médico'} *`}><input placeholder={isPet?"Dr. Silva — Vet":"Dr. João Silva"} value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Especialidade"><input placeholder={isPet?"Clínico Geral":"Cardiologista"} value={form.specialty} onChange={e=>setForm((f:any)=>({...f,specialty:e.target.value}))} style={inp}/></Fld>
                <Fld label="Telefone"><input placeholder="(00) 00000-0000" value={form.phone} onChange={e=>setForm((f:any)=>({...f,phone:e.target.value}))} style={inp}/></Fld>
              </div>
              <Fld label={isPet?"Clínica Veterinária":"Endereço / Clínica"}><input placeholder={isPet?"Pet Shop / Clínica":"Rua..."} value={form.address} onChange={e=>setForm((f:any)=>({...f,address:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Próxima consulta"><input type="date" value={form.next_appointment} onChange={e=>setForm((f:any)=>({...f,next_appointment:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                <Fld label="Horário"><input type="time" value={form.next_appointment_time} onChange={e=>setForm((f:any)=>({...f,next_appointment_time:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              </div>
              <Fld label="Notas"><textarea placeholder={isPet?"Observações, tratamentos...":"Observações, medicamentos..."} value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'80px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MEDICAMENTOS (pessoa ou pet)
// ══════════════════════════════════════════════════════════════════════
const EMPTY_MED_RX = {name:'',dosage:'',frequency:'',time:'',doctor:'',start_date:'',end_date:'',notes:'',active:true}

function MedicamentosTab({person, isPet}:{person:string, isPet:boolean}) {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_MED_RX)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [person])
  async function load() {
    const {data} = await supabase.from('saude_medicamentos').select('*').eq('user_id',USER_ID).eq('person',person).order('active',{ascending:false})
    setList(data||[])
  }

  function openNew() { setEditing(null); setForm(EMPTY_MED_RX); setShowForm(true) }
  function openEdit(item:any) { setEditing(item); setForm({name:item.name,dosage:item.dosage||'',frequency:item.frequency||'',time:item.time||'',doctor:item.doctor||'',start_date:item.start_date||'',end_date:item.end_date||'',notes:item.notes||'',active:item.active??true}); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {name:form.name.trim(),dosage:form.dosage||null,frequency:form.frequency||null,time:form.time||null,doctor:form.doctor||null,start_date:form.start_date||null,end_date:form.end_date||null,notes:form.notes||null,active:form.active,person,user_id:USER_ID}
    if (editing) await supabase.from('saude_medicamentos').update(data).eq('id',editing.id)
    else await supabase.from('saude_medicamentos').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir medicamento?')) return
    await supabase.from('saude_medicamentos').delete().eq('id',id); load()
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{color:'#111',fontSize:'20px',fontWeight:800}}>💊 Medicamentos</h2>
        <button onClick={openNew} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>+ Adicionar</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#bbb',textAlign:'center',padding:'40px',fontSize:'14px'}}>Nenhum medicamento cadastrado</p>}
        {list.map(item => (
          <div key={item.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#fff',border:'2px solid #e5e5ea',opacity:item.active?1:0.5}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:item.active?'#faf5ff':'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>💊</div>
            <div style={{flex:1}}>
              <p style={{color:'#111',fontSize:'15px',fontWeight:700}}>{item.name}</p>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'2px'}}>
                {item.dosage && <span style={{fontSize:'12px',padding:'2px 8px',borderRadius:'5px',background:'#eff6ff',color:'#2563eb',fontWeight:600}}>{item.dosage}</span>}
                {item.frequency && <span style={{fontSize:'12px',color:'#888'}}>{item.frequency}</span>}
                {item.time && <span style={{fontSize:'12px',color:'#888'}}>⏰ {item.time}</span>}
              </div>
              {item.doctor && <p style={{color:'#888',fontSize:'12px',marginTop:'2px'}}>Prescrito por: {item.doctor}</p>}
            </div>
            <div style={{display:'flex',gap:'4px'}}>
              <button onClick={()=>openEdit(item)} style={{padding:'5px 10px',background:'#f5f5f5',border:'none',borderRadius:'7px',color:'#555',fontSize:'12px',cursor:'pointer'}}>Editar</button>
              <button onClick={()=>remove(item.id)} style={{padding:'5px 8px',background:'transparent',border:'none',color:'#dc2626',fontSize:'16px',cursor:'pointer'}}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#fff',borderRadius:'16px',padding:'24px',border:'2px solid #e5e5ea'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:700}}>{editing?'Editar':'Novo'} Medicamento</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome do medicamento *"><input placeholder={isPet?"Vermífugo, Antipulgas...":"Dipirona, Omeprazol..."} value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Dosagem"><input placeholder="500mg, 1 comprimido" value={form.dosage} onChange={e=>setForm((f:any)=>({...f,dosage:e.target.value}))} style={inp}/></Fld>
                <Fld label="Frequência"><input placeholder="1x ao dia, 8/8h" value={form.frequency} onChange={e=>setForm((f:any)=>({...f,frequency:e.target.value}))} style={inp}/></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Horário"><input type="time" value={form.time} onChange={e=>setForm((f:any)=>({...f,time:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                <Fld label={isPet?"Veterinário":"Médico que prescreveu"}><input placeholder="Dr..." value={form.doctor} onChange={e=>setForm((f:any)=>({...f,doctor:e.target.value}))} style={inp}/></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Data início"><input type="date" value={form.start_date} onChange={e=>setForm((f:any)=>({...f,start_date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                <Fld label="Data fim"><input type="date" value={form.end_date} onChange={e=>setForm((f:any)=>({...f,end_date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              </div>
              <Fld label="Notas"><textarea placeholder="Observações..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
              <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
                <input type="checkbox" checked={form.active} onChange={e=>setForm((f:any)=>({...f,active:e.target.checked}))} />
                <span style={{color:'#555',fontSize:'14px',fontWeight:600}}>Em uso atualmente</span>
              </label>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// EXAMES (só pessoas)
// ══════════════════════════════════════════════════════════════════════
const EMPTY_EXAME = {name:'',date:'',result:'',doctor:'',lab:'',file_url:'',notes:''}

function ExamesTab({person}:{person:string}) {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_EXAME)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [person])
  async function load() {
    const {data} = await supabase.from('saude_exames').select('*').eq('user_id',USER_ID).eq('person',person).order('date',{ascending:false})
    setList(data||[])
  }

  function openNew() { setEditing(null); setForm({...EMPTY_EXAME,date:new Date().toISOString().split('T')[0]}); setShowForm(true) }
  function openEdit(item:any) { setEditing(item); setForm({name:item.name,date:item.date||'',result:item.result||'',doctor:item.doctor||'',lab:item.lab||'',file_url:item.file_url||'',notes:item.notes||''}); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {name:form.name.trim(),date:form.date||null,result:form.result||null,doctor:form.doctor||null,lab:form.lab||null,file_url:form.file_url||null,notes:form.notes||null,person,user_id:USER_ID}
    if (editing) await supabase.from('saude_exames').update(data).eq('id',editing.id)
    else await supabase.from('saude_exames').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir exame?')) return
    await supabase.from('saude_exames').delete().eq('id',id); load()
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{color:'#111',fontSize:'20px',fontWeight:800}}>🔬 Exames</h2>
        <button onClick={openNew} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>+ Adicionar</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#bbb',textAlign:'center',padding:'40px',fontSize:'14px'}}>Nenhum exame registrado</p>}
        {list.map(item => (
          <div key={item.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#fff',border:'2px solid #e5e5ea',cursor:'pointer'}} onClick={()=>openEdit(item)}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>🔬</div>
            <div style={{flex:1}}>
              <p style={{color:'#111',fontSize:'15px',fontWeight:700}}>{item.name}</p>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'2px'}}>
                {item.date && <span style={{fontSize:'12px',color:'#888'}}>📅 {new Date(item.date+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                {item.lab && <span style={{fontSize:'12px',color:'#888'}}>🏥 {item.lab}</span>}
                {item.doctor && <span style={{fontSize:'12px',color:'#888'}}>🩺 {item.doctor}</span>}
              </div>
              {item.result && <p style={{color:'#16a34a',fontSize:'13px',fontWeight:600,marginTop:'2px'}}>Resultado: {item.result}</p>}
            </div>
            <button onClick={e=>{e.stopPropagation();remove(item.id)}} style={{padding:'5px 8px',background:'transparent',border:'none',color:'#dc2626',fontSize:'16px',cursor:'pointer'}}>✕</button>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#fff',borderRadius:'16px',padding:'24px',border:'2px solid #e5e5ea'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:700}}>{editing?'Editar':'Novo'} Exame</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome do exame *"><input placeholder="Hemograma, Glicemia..." value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Data"><input type="date" value={form.date} onChange={e=>setForm((f:any)=>({...f,date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                <Fld label="Laboratório"><input placeholder="Lab Mais, Unimed..." value={form.lab} onChange={e=>setForm((f:any)=>({...f,lab:e.target.value}))} style={inp}/></Fld>
              </div>
              <Fld label="Médico solicitante"><input placeholder="Dr..." value={form.doctor} onChange={e=>setForm((f:any)=>({...f,doctor:e.target.value}))} style={inp}/></Fld>
              <Fld label="Resultado"><textarea placeholder="Normal, Alterado, valores..." value={form.result} onChange={e=>setForm((f:any)=>({...f,result:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
              <Fld label="Notas"><textarea placeholder="Observações..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// PLANO DE SAÚDE (só pessoas)
// ══════════════════════════════════════════════════════════════════════
function PlanoTab({person}:{person:string}) {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>({operadora:'',plano:'',numero_carteira:'',validade:'',tipo:'Individual',cobertura:'',valor:'',notes:''})
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [person])
  async function load() {
    const {data} = await supabase.from('saude_planos').select('*').eq('user_id',USER_ID).eq('person',person).order('created_at',{ascending:false})
    setList(data||[])
  }

  async function save() {
    if (!form.operadora.trim()) return
    setSaving(true)
    const data = {operadora:form.operadora.trim(),plano:form.plano||null,numero_carteira:form.numero_carteira||null,validade:form.validade||null,tipo:form.tipo,cobertura:form.cobertura||null,valor:form.valor?parseFloat(form.valor):null,notes:form.notes||null,person,user_id:USER_ID}
    if (editing) await supabase.from('saude_planos').update(data).eq('id',editing.id)
    else await supabase.from('saude_planos').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir plano?')) return
    await supabase.from('saude_planos').delete().eq('id',id); load()
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{color:'#111',fontSize:'20px',fontWeight:800}}>🏥 Plano de Saúde</h2>
        <button onClick={()=>{setEditing(null);setForm({operadora:'',plano:'',numero_carteira:'',validade:'',tipo:'Individual',cobertura:'',valor:'',notes:''});setShowForm(true)}} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>+ Adicionar</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#bbb',textAlign:'center',padding:'40px',fontSize:'14px'}}>Nenhum plano cadastrado</p>}
        {list.map(item => (
          <div key={item.id} style={{padding:'16px',borderRadius:'12px',background:'#fff',border:'2px solid #e5e5ea',cursor:'pointer'}} onClick={()=>{setEditing(item);setForm({operadora:item.operadora,plano:item.plano||'',numero_carteira:item.numero_carteira||'',validade:item.validade||'',tipo:item.tipo||'Individual',cobertura:item.cobertura||'',valor:item.valor?.toString()||'',notes:item.notes||''});setShowForm(true)}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <p style={{color:'#111',fontSize:'16px',fontWeight:800}}>🏥 {item.operadora}</p>
                {item.plano && <p style={{color:'#7c3aed',fontSize:'13px',fontWeight:600}}>{item.plano}</p>}
                <div style={{display:'flex',gap:'10px',marginTop:'6px',flexWrap:'wrap'}}>
                  {item.numero_carteira && <span style={{fontSize:'12px',color:'#888'}}>Carteira: {item.numero_carteira}</span>}
                  {item.validade && <span style={{fontSize:'12px',color:'#888'}}>Val: {item.validade}</span>}
                  {item.valor && <span style={{fontSize:'12px',color:'#16a34a',fontWeight:600}}>R$ {item.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}/mês</span>}
                </div>
              </div>
              <button onClick={e=>{e.stopPropagation();remove(item.id)}} style={{padding:'5px 8px',background:'transparent',border:'none',color:'#dc2626',fontSize:'16px',cursor:'pointer'}}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#fff',borderRadius:'16px',padding:'24px',border:'2px solid #e5e5ea'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:700}}>{editing?'Editar':'Novo'} Plano de Saúde</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Operadora *"><input placeholder="Unimed, Hapvida, SUS..." value={form.operadora} onChange={e=>setForm((f:any)=>({...f,operadora:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Nome do plano"><input placeholder="Enfermaria, Apartamento..." value={form.plano} onChange={e=>setForm((f:any)=>({...f,plano:e.target.value}))} style={inp}/></Fld>
                <Fld label="Tipo"><select value={form.tipo} onChange={e=>setForm((f:any)=>({...f,tipo:e.target.value}))} style={sel}><option>Individual</option><option>Familiar</option><option>Empresarial</option><option>SUS</option></select></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Nº Carteira"><input placeholder="0000000000" value={form.numero_carteira} onChange={e=>setForm((f:any)=>({...f,numero_carteira:e.target.value}))} style={inp}/></Fld>
                <Fld label="Validade"><input placeholder="12/2027" value={form.validade} onChange={e=>setForm((f:any)=>({...f,validade:e.target.value}))} style={inp}/></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Valor mensal (R$)"><input type="number" step="0.01" placeholder="450.00" value={form.valor} onChange={e=>setForm((f:any)=>({...f,valor:e.target.value}))} style={inp}/></Fld>
                <Fld label="Cobertura"><input placeholder="Nacional, Regional..." value={form.cobertura} onChange={e=>setForm((f:any)=>({...f,cobertura:e.target.value}))} style={inp}/></Fld>
              </div>
              <Fld label="Notas"><textarea placeholder="Observações, carências..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.operadora.trim()||saving} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!form.operadora.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// ATIVIDADES (reutilizada da versão anterior, agora com person)
// ══════════════════════════════════════════════════════════════════════
const TIPOS_ATIV = ['Musculação','Cardio','Yoga','Pilates','Caminhada','Corrida','Natação','Funcional','Outro']
const FREQ = ['Diário','2x por semana','3x por semana','4x por semana','5x por semana','Fins de semana','Variado']
const EMPTY_ATIV = {name:'',type:'Musculação',frequency:'3x por semana',duration_min:'',time:'',notes:'',active:true}

function AtividadesTab({person}:{person:string}) {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_ATIV)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [person])
  async function load() {
    const {data} = await supabase.from('saude_atividades').select('*').eq('user_id',USER_ID).order('created_at',{ascending:false})
    // Filtra por person (retrocompatível)
    if (person === 'paloma') setList((data||[]).filter(d => !d.person || d.person === 'paloma'))
    else setList((data||[]).filter(d => d.person === person))
  }

  function openNew() { setEditing(null); setForm(EMPTY_ATIV); setShowForm(true) }
  function openEdit(item:any) { setEditing(item); setForm({name:item.name,type:item.type,frequency:item.frequency,duration_min:item.duration_min?.toString()||'',time:item.time||'',notes:item.notes||'',active:item.active??true}); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {name:form.name.trim(),type:form.type,frequency:form.frequency,duration_min:form.duration_min?parseInt(form.duration_min):null,time:form.time||null,notes:form.notes||null,active:form.active,person,user_id:USER_ID}
    if (editing) await supabase.from('saude_atividades').update(data).eq('id',editing.id)
    else await supabase.from('saude_atividades').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir atividade?')) return
    await supabase.from('saude_atividades').delete().eq('id',id); load()
  }

  const typeColor:any = {Musculação:'#7c3aed',Cardio:'#dc2626',Yoga:'#16a34a',Pilates:'#16a34a',Caminhada:'#16a34a',Corrida:'#ea580c',Natação:'#2563eb',Funcional:'#ca8a04',Outro:'#888'}

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{color:'#111',fontSize:'20px',fontWeight:800}}>💪 Atividades Físicas</h2>
        <button onClick={openNew} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>+ Adicionar</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#bbb',textAlign:'center',padding:'40px',fontSize:'14px'}}>Nenhuma atividade cadastrada</p>}
        {list.map(item => (
          <div key={item.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#fff',border:'2px solid #e5e5ea',opacity:item.active?1:0.5}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:`${typeColor[item.type]||'#888'}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>
              {item.type==='Musculação'?'🏋️':item.type==='Cardio'||item.type==='Corrida'?'🏃':item.type==='Yoga'||item.type==='Pilates'?'🧘':'⚡'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <p style={{color:'#111',fontSize:'15px',fontWeight:700}}>{item.name}</p>
                <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'5px',background:`${typeColor[item.type]||'#888'}15`,color:typeColor[item.type]||'#888',fontWeight:600}}>{item.type}</span>
              </div>
              <p style={{color:'#888',fontSize:'13px',marginTop:'2px'}}>{item.frequency}{item.duration_min?` · ${item.duration_min} min`:''}{item.time?` · ${item.time}`:''}</p>
            </div>
            <div style={{display:'flex',gap:'4px'}}>
              <button onClick={()=>openEdit(item)} style={{padding:'5px 10px',background:'#f5f5f5',border:'none',borderRadius:'7px',color:'#555',fontSize:'12px',cursor:'pointer'}}>Editar</button>
              <button onClick={()=>remove(item.id)} style={{padding:'5px 8px',background:'transparent',border:'none',color:'#dc2626',fontSize:'16px',cursor:'pointer'}}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#fff',borderRadius:'16px',padding:'24px',border:'2px solid #e5e5ea'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:700}}>{editing?'Editar':'Nova'} Atividade</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome *"><input placeholder="Ex: Treino A — Peito e Tríceps" value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Tipo"><select value={form.type} onChange={e=>setForm((f:any)=>({...f,type:e.target.value}))} style={sel}>{TIPOS_ATIV.map(t=><option key={t}>{t}</option>)}</select></Fld>
                <Fld label="Frequência"><select value={form.frequency} onChange={e=>setForm((f:any)=>({...f,frequency:e.target.value}))} style={sel}>{FREQ.map(f=><option key={f}>{f}</option>)}</select></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Duração (min)"><input type="number" placeholder="60" value={form.duration_min} onChange={e=>setForm((f:any)=>({...f,duration_min:e.target.value}))} style={inp}/></Fld>
                <Fld label="Horário"><input type="time" value={form.time} onChange={e=>setForm((f:any)=>({...f,time:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              </div>
              <Fld label="Observações"><textarea placeholder="Detalhes..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
              <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
                <input type="checkbox" checked={form.active} onChange={e=>setForm((f:any)=>({...f,active:e.target.checked}))} />
                <span style={{color:'#555',fontSize:'14px',fontWeight:600}}>Ativa</span>
              </label>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MEDIDAS (reutilizada, agora com person)
// ══════════════════════════════════════════════════════════════════════
const EMPTY_MED_BODY = {date:'',weight:'',waist:'',hip:'',chest:'',arm:'',thigh:'',notes:''}

function MedidasTab({person}:{person:string}) {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(EMPTY_MED_BODY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [person])
  async function load() {
    const {data} = await supabase.from('saude_medidas').select('*').eq('user_id',USER_ID).order('date',{ascending:false})
    if (person === 'paloma') setList((data||[]).filter(d => !d.person || d.person === 'paloma'))
    else setList((data||[]).filter(d => d.person === person))
  }

  async function save() {
    if (!form.date) return
    setSaving(true)
    const data = {date:form.date,weight:form.weight?parseFloat(form.weight):null,waist:form.waist?parseFloat(form.waist):null,hip:form.hip?parseFloat(form.hip):null,chest:form.chest?parseFloat(form.chest):null,arm:form.arm?parseFloat(form.arm):null,thigh:form.thigh?parseFloat(form.thigh):null,notes:form.notes||null,person,user_id:USER_ID}
    await supabase.from('saude_medidas').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); setForm(EMPTY_MED_BODY); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir registro?')) return
    await supabase.from('saude_medidas').delete().eq('id',id); load()
  }

  const latest = list[0]

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{color:'#111',fontSize:'20px',fontWeight:800}}>⚖️ Medidas e Peso</h2>
        <button onClick={()=>{setForm({...EMPTY_MED_BODY,date:new Date().toISOString().split('T')[0]});setShowForm(true)}} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>+ Registrar</button>
      </div>

      {latest && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'20px'}}>
          {[
            {label:'Peso',value:latest.weight,unit:'kg',color:'#7c3aed'},
            {label:'Cintura',value:latest.waist,unit:'cm',color:'#16a34a'},
            {label:'Quadril',value:latest.hip,unit:'cm',color:'#ea580c'},
            {label:'Peito',value:latest.chest,unit:'cm',color:'#2563eb'},
          ].map(m => m.value && (
            <div key={m.label} style={{background:'#fff',border:'2px solid #e5e5ea',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
              <p style={{color:'#888',fontSize:'11px',fontWeight:600,marginBottom:'4px'}}>{m.label}</p>
              <p style={{color:m.color,fontSize:'24px',fontWeight:900}}>{m.value}</p>
              <p style={{color:'#bbb',fontSize:'11px'}}>{m.unit}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#bbb',textAlign:'center',padding:'40px',fontSize:'14px'}}>Nenhum registro ainda</p>}
        {list.map(item => (
          <div key={item.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderRadius:'12px',background:'#fff',border:'2px solid #e5e5ea'}}>
            <div style={{flex:1}}>
              <p style={{color:'#555',fontSize:'13px',fontWeight:600}}>{new Date(item.date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}</p>
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'4px'}}>
                {item.weight && <span style={{color:'#7c3aed',fontSize:'14px',fontWeight:700}}>{item.weight} kg</span>}
                {item.waist && <span style={{color:'#555',fontSize:'13px'}}>Cintura: {item.waist}cm</span>}
                {item.hip && <span style={{color:'#555',fontSize:'13px'}}>Quadril: {item.hip}cm</span>}
              </div>
            </div>
            <button onClick={()=>remove(item.id)} style={{padding:'5px 8px',background:'transparent',border:'none',color:'#dc2626',fontSize:'16px',cursor:'pointer'}}>✕</button>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'480px',background:'#fff',borderRadius:'16px',padding:'24px',border:'2px solid #e5e5ea'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:700}}>Novo Registro</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Data *"><input type="date" value={form.date} onChange={e=>setForm((f:any)=>({...f,date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Peso (kg)"><input type="number" step="0.1" placeholder="65.5" value={form.weight} onChange={e=>setForm((f:any)=>({...f,weight:e.target.value}))} style={inp}/></Fld>
                <Fld label="Cintura (cm)"><input type="number" step="0.5" value={form.waist} onChange={e=>setForm((f:any)=>({...f,waist:e.target.value}))} style={inp}/></Fld>
                <Fld label="Quadril (cm)"><input type="number" step="0.5" value={form.hip} onChange={e=>setForm((f:any)=>({...f,hip:e.target.value}))} style={inp}/></Fld>
                <Fld label="Peito (cm)"><input type="number" step="0.5" value={form.chest} onChange={e=>setForm((f:any)=>({...f,chest:e.target.value}))} style={inp}/></Fld>
                <Fld label="Braço (cm)"><input type="number" step="0.5" value={form.arm} onChange={e=>setForm((f:any)=>({...f,arm:e.target.value}))} style={inp}/></Fld>
                <Fld label="Coxa (cm)"><input type="number" step="0.5" value={form.thigh} onChange={e=>setForm((f:any)=>({...f,thigh:e.target.value}))} style={inp}/></Fld>
              </div>
              <Fld label="Observações"><textarea placeholder="Como se sentiu..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.date||saving} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!form.date||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// DIETAS (reutilizada, com person)
// ══════════════════════════════════════════════════════════════════════
const EMPTY_DIETA = {name:'',description:'',start_date:'',status:'Ativa',goal:'',meals:'',notes:''}

function DietasTab({person}:{person:string}) {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_DIETA)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [person])
  async function load() {
    const {data} = await supabase.from('saude_dietas').select('*').eq('user_id',USER_ID).order('created_at',{ascending:false})
    if (person === 'paloma') setList((data||[]).filter(d => !d.person || d.person === 'paloma'))
    else setList((data||[]).filter(d => d.person === person))
  }

  function openNew() { setEditing(null); setForm({...EMPTY_DIETA,start_date:new Date().toISOString().split('T')[0]}); setShowForm(true) }
  function openEdit(item:any) { setEditing(item); setForm({name:item.name,description:item.description||'',start_date:item.start_date||'',status:item.status||'Ativa',goal:item.goal||'',meals:item.meals||'',notes:item.notes||''}); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {name:form.name.trim(),description:form.description||null,start_date:form.start_date||null,status:form.status,goal:form.goal||null,meals:form.meals||null,notes:form.notes||null,person,user_id:USER_ID}
    if (editing) await supabase.from('saude_dietas').update(data).eq('id',editing.id)
    else await supabase.from('saude_dietas').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir dieta?')) return
    await supabase.from('saude_dietas').delete().eq('id',id); load()
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{color:'#111',fontSize:'20px',fontWeight:800}}>🥗 Dietas</h2>
        <button onClick={openNew} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>+ Nova Dieta</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#bbb',textAlign:'center',padding:'40px',fontSize:'14px'}}>Nenhuma dieta cadastrada</p>}
        {list.map(item => (
          <div key={item.id} style={{padding:'16px',borderRadius:'12px',background:'#fff',border:'2px solid #e5e5ea',cursor:'pointer'}} onClick={()=>openEdit(item)}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <p style={{color:'#111',fontSize:'15px',fontWeight:700}}>🥗 {item.name}</p>
                  <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'5px',background:item.status==='Ativa'?'#ecfdf5':'#f5f5f5',color:item.status==='Ativa'?'#16a34a':'#888',fontWeight:600}}>{item.status}</span>
                </div>
                {item.goal && <p style={{color:'#555',fontSize:'13px'}}>🎯 {item.goal}</p>}
              </div>
              <button onClick={e=>{e.stopPropagation();remove(item.id)}} style={{padding:'5px 8px',background:'transparent',border:'none',color:'#dc2626',fontSize:'16px',cursor:'pointer'}}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'520px',background:'#fff',borderRadius:'16px',padding:'24px',border:'2px solid #e5e5ea'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:700}}>{editing?'Editar':'Nova'} Dieta</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome *"><input placeholder="Low Carb, Cetogênica..." value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Status"><select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))} style={sel}><option>Ativa</option><option>Pausada</option><option>Concluída</option></select></Fld>
                <Fld label="Início"><input type="date" value={form.start_date} onChange={e=>setForm((f:any)=>({...f,start_date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              </div>
              <Fld label="Objetivo"><input placeholder="Perder 5kg, ganhar massa..." value={form.goal} onChange={e=>setForm((f:any)=>({...f,goal:e.target.value}))} style={inp}/></Fld>
              <Fld label="Refeições"><textarea placeholder="Café: ...\nAlmoço: ...\nJantar: ..." value={form.meals} onChange={e=>setForm((f:any)=>({...f,meals:e.target.value}))} style={{...inp,resize:'none',height:'80px'}}/></Fld>
              <Fld label="Notas"><textarea value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// TABS PET: Vacinas, Cuidados, Info
// ══════════════════════════════════════════════════════════════════════
function VacinasPetTab({person}:{person:string}) {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({name:'',date:'',next_date:'',vet:'',notes:''})
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [person])
  async function load() {
    const {data} = await supabase.from('saude_vacinas_pet').select('*').eq('user_id',USER_ID).eq('person',person).order('date',{ascending:false})
    setList(data||[])
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const data = {name:form.name.trim(),date:form.date||null,next_date:form.next_date||null,vet:form.vet||null,notes:form.notes||null,person,user_id:USER_ID}
    await supabase.from('saude_vacinas_pet').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); setForm({name:'',date:'',next_date:'',vet:'',notes:''}); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir vacina?')) return
    await supabase.from('saude_vacinas_pet').delete().eq('id',id); load()
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{color:'#111',fontSize:'20px',fontWeight:800}}>💉 Vacinas</h2>
        <button onClick={()=>{setForm({name:'',date:todayStr,next_date:'',vet:'',notes:''});setShowForm(true)}} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>+ Adicionar</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#bbb',textAlign:'center',padding:'40px',fontSize:'14px'}}>Nenhuma vacina registrada</p>}
        {list.map(item => {
          const vencida = item.next_date && item.next_date < todayStr
          return (
            <div key={item.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#fff',border:`2px solid ${vencida?'#dc2626':'#e5e5ea'}`}}>
              <div style={{width:'40px',height:'40px',borderRadius:'10px',background:vencida?'#fef2f2':'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>💉</div>
              <div style={{flex:1}}>
                <p style={{color:'#111',fontSize:'15px',fontWeight:700}}>{item.name}</p>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'2px'}}>
                  {item.date && <span style={{fontSize:'12px',color:'#888'}}>Aplicada: {new Date(item.date+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                  {item.next_date && <span style={{fontSize:'12px',color:vencida?'#dc2626':'#16a34a',fontWeight:600}}>Próxima: {new Date(item.next_date+'T12:00:00').toLocaleDateString('pt-BR')}{vencida?' ⚠️ VENCIDA':''}</span>}
                </div>
                {item.vet && <p style={{color:'#888',fontSize:'12px',marginTop:'2px'}}>🩺 {item.vet}</p>}
              </div>
              <button onClick={()=>remove(item.id)} style={{padding:'5px 8px',background:'transparent',border:'none',color:'#dc2626',fontSize:'16px',cursor:'pointer'}}>✕</button>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'440px',background:'#fff',borderRadius:'16px',padding:'24px',border:'2px solid #e5e5ea'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:700}}>Nova Vacina</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome da vacina *"><input placeholder="V10, Antirrábica, Gripe..." value={form.name} onChange={e=>setForm((f:any)=>({...f,name:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Data aplicação"><input type="date" value={form.date} onChange={e=>setForm((f:any)=>({...f,date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                <Fld label="Próxima dose"><input type="date" value={form.next_date} onChange={e=>setForm((f:any)=>({...f,next_date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              </div>
              <Fld label="Veterinário/Clínica"><input placeholder="Dr. Silva — PetClin" value={form.vet} onChange={e=>setForm((f:any)=>({...f,vet:e.target.value}))} style={inp}/></Fld>
              <Fld label="Notas"><textarea placeholder="Observações..." value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={!form.name.trim()||saving} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!form.name.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CuidadosPetTab({person}:{person:string}) {
  const [list, setList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({type:'Banho',date:'',next_date:'',local:'',valor:'',notes:''})
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [person])
  async function load() {
    const {data} = await supabase.from('saude_cuidados_pet').select('*').eq('user_id',USER_ID).eq('person',person).order('date',{ascending:false})
    setList(data||[])
  }

  async function save() {
    if (!form.type) return
    setSaving(true)
    const data = {type:form.type,date:form.date||null,next_date:form.next_date||null,local:form.local||null,valor:form.valor?parseFloat(form.valor):null,notes:form.notes||null,person,user_id:USER_ID}
    await supabase.from('saude_cuidados_pet').insert({...data,id:crypto.randomUUID()})
    setSaving(false); setShowForm(false); load()
  }

  async function remove(id:string) {
    if (!confirm('Excluir?')) return
    await supabase.from('saude_cuidados_pet').delete().eq('id',id); load()
  }

  const cuidadoIcon: any = {Banho:'🛁',Tosa:'✂️','Banho e Tosa':'🛁✂️',Antipulgas:'🐛',Vermífugo:'💊',Outro:'📋'}

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{color:'#111',fontSize:'20px',fontWeight:800}}>🛁 Cuidados</h2>
        <button onClick={()=>{setForm({type:'Banho',date:new Date().toISOString().split('T')[0],next_date:'',local:'',valor:'',notes:''});setShowForm(true)}} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>+ Registrar</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {list.length===0 && <p style={{color:'#bbb',textAlign:'center',padding:'40px',fontSize:'14px'}}>Nenhum cuidado registrado</p>}
        {list.map(item => (
          <div key={item.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderRadius:'12px',background:'#fff',border:'2px solid #e5e5ea'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'#fef3c7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{cuidadoIcon[item.type]||'📋'}</div>
            <div style={{flex:1}}>
              <p style={{color:'#111',fontSize:'15px',fontWeight:700}}>{item.type}</p>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'2px'}}>
                {item.date && <span style={{fontSize:'12px',color:'#888'}}>📅 {new Date(item.date+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                {item.local && <span style={{fontSize:'12px',color:'#888'}}>📍 {item.local}</span>}
                {item.valor && <span style={{fontSize:'12px',color:'#16a34a',fontWeight:600}}>R$ {item.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
              </div>
            </div>
            <button onClick={()=>remove(item.id)} style={{padding:'5px 8px',background:'transparent',border:'none',color:'#dc2626',fontSize:'16px',cursor:'pointer'}}>✕</button>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'40px 20px',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:'440px',background:'#fff',borderRadius:'16px',padding:'24px',border:'2px solid #e5e5ea'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:700}}>Registrar Cuidado</h2>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Tipo"><select value={form.type} onChange={e=>setForm((f:any)=>({...f,type:e.target.value}))} style={sel}><option>Banho</option><option>Tosa</option><option>Banho e Tosa</option><option>Antipulgas</option><option>Vermífugo</option><option>Outro</option></select></Fld>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Data"><input type="date" value={form.date} onChange={e=>setForm((f:any)=>({...f,date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
                <Fld label="Próxima vez"><input type="date" value={form.next_date} onChange={e=>setForm((f:any)=>({...f,next_date:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <Fld label="Local/Pet Shop"><input placeholder="Pet Love, PetCenter..." value={form.local} onChange={e=>setForm((f:any)=>({...f,local:e.target.value}))} style={inp}/></Fld>
                <Fld label="Valor (R$)"><input type="number" step="0.01" placeholder="80.00" value={form.valor} onChange={e=>setForm((f:any)=>({...f,valor:e.target.value}))} style={inp}/></Fld>
              </div>
              <Fld label="Notas"><textarea value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={save} disabled={saving} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
              <button onClick={()=>setShowForm(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoPetTab({person, membros, setMembros}:{person:string, membros:any[], setMembros:(m:any[])=>void}) {
  const membro = membros.find(m => m.id === person)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({label:'',especie:'Cachorro',raca:'',nascimento:'',peso:'',cor:'',castrado:false,chip:'',notes:''})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (membro) {
      loadPetInfo()
    }
  }, [person])

  async function loadPetInfo() {
    const {data} = await supabase.from('saude_pets').select('*').eq('user_id',USER_ID).eq('pet_id',person).single()
    if (data) {
      setForm({label:data.name||membro?.label||'',especie:data.especie||'Cachorro',raca:data.raca||'',nascimento:data.nascimento||'',peso:data.peso?.toString()||'',cor:data.cor||'',castrado:data.castrado||false,chip:data.chip||'',notes:data.notes||''})
    } else {
      setForm({label:membro?.label||'',especie:membro?.especie||'Cachorro',raca:'',nascimento:'',peso:'',cor:'',castrado:false,chip:'',notes:''})
    }
  }

  async function save() {
    if (!form.label.trim()) return
    setSaving(true)
    const data = {pet_id:person,name:form.label.trim(),especie:form.especie,raca:form.raca||null,nascimento:form.nascimento||null,peso:form.peso?parseFloat(form.peso):null,cor:form.cor||null,castrado:form.castrado,chip:form.chip||null,notes:form.notes||null,user_id:USER_ID}
    // upsert
    const {data:existing} = await supabase.from('saude_pets').select('id').eq('user_id',USER_ID).eq('pet_id',person).single()
    if (existing) await supabase.from('saude_pets').update(data).eq('id',existing.id)
    else await supabase.from('saude_pets').insert({...data,id:crypto.randomUUID()})
    // Atualizar label no membro local
    setMembros(membros.map(m => m.id === person ? {...m, label: form.label.trim(), especie: form.especie, emoji: form.especie==='Gato'?'🐱':form.especie==='Pássaro'?'🐦':'🐕'} : m))
    setSaving(false)
    setEditing(false)
  }

  const especieEmoji: any = {Cachorro:'🐕',Gato:'🐱',Pássaro:'🐦',Coelho:'🐰',Hamster:'🐹',Peixe:'🐠',Tartaruga:'🐢',Outro:'🐾'}

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{color:'#111',fontSize:'20px',fontWeight:800}}>📋 Informações do Pet</h2>
        <button onClick={()=>setEditing(true)} style={{padding:'8px 18px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>Editar</button>
      </div>

      {!editing ? (
        <div style={{background:'#fff',borderRadius:'16px',border:'2px solid #e5e5ea',padding:'24px'}}>
          <div style={{textAlign:'center',marginBottom:'20px'}}>
            <span style={{fontSize:'48px'}}>{especieEmoji[form.especie]||'🐾'}</span>
            <h3 style={{color:'#111',fontSize:'22px',fontWeight:900,marginTop:'8px'}}>{form.label || 'Sem nome'}</h3>
            <p style={{color:'#7c3aed',fontSize:'14px',fontWeight:600}}>{form.especie}{form.raca?` — ${form.raca}`:''}</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            {form.nascimento && <div style={{background:'#faf5ff',borderRadius:'10px',padding:'12px',textAlign:'center'}}><p style={{color:'#888',fontSize:'11px',fontWeight:600}}>NASCIMENTO</p><p style={{color:'#333',fontSize:'14px',fontWeight:700}}>{new Date(form.nascimento+'T12:00:00').toLocaleDateString('pt-BR')}</p></div>}
            {form.peso && <div style={{background:'#ecfdf5',borderRadius:'10px',padding:'12px',textAlign:'center'}}><p style={{color:'#888',fontSize:'11px',fontWeight:600}}>PESO</p><p style={{color:'#333',fontSize:'14px',fontWeight:700}}>{form.peso} kg</p></div>}
            {form.cor && <div style={{background:'#eff6ff',borderRadius:'10px',padding:'12px',textAlign:'center'}}><p style={{color:'#888',fontSize:'11px',fontWeight:600}}>COR</p><p style={{color:'#333',fontSize:'14px',fontWeight:700}}>{form.cor}</p></div>}
            <div style={{background:form.castrado?'#ecfdf5':'#fef2f2',borderRadius:'10px',padding:'12px',textAlign:'center'}}><p style={{color:'#888',fontSize:'11px',fontWeight:600}}>CASTRADO</p><p style={{color:form.castrado?'#16a34a':'#dc2626',fontSize:'14px',fontWeight:700}}>{form.castrado?'Sim':'Não'}</p></div>
            {form.chip && <div style={{background:'#fefce8',borderRadius:'10px',padding:'12px',textAlign:'center'}}><p style={{color:'#888',fontSize:'11px',fontWeight:600}}>MICROCHIP</p><p style={{color:'#333',fontSize:'14px',fontWeight:700}}>{form.chip}</p></div>}
          </div>
          {form.notes && <p style={{color:'#888',fontSize:'13px',marginTop:'16px',padding:'12px',background:'#f8f8f8',borderRadius:'8px'}}>{form.notes}</p>}
        </div>
      ) : (
        <div style={{background:'#fff',borderRadius:'16px',border:'2px solid #e5e5ea',padding:'24px'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <Fld label="Nome do pet *"><input value={form.label} onChange={e=>setForm((f:any)=>({...f,label:e.target.value}))} style={inp}/></Fld>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <Fld label="Espécie"><select value={form.especie} onChange={e=>setForm((f:any)=>({...f,especie:e.target.value}))} style={sel}>{Object.keys(especieEmoji).map(e=><option key={e}>{e}</option>)}</select></Fld>
              <Fld label="Raça"><input placeholder="SRD, Golden, Siamês..." value={form.raca} onChange={e=>setForm((f:any)=>({...f,raca:e.target.value}))} style={inp}/></Fld>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
              <Fld label="Nascimento"><input type="date" value={form.nascimento} onChange={e=>setForm((f:any)=>({...f,nascimento:e.target.value}))} style={{...inp,colorScheme:'light'}}/></Fld>
              <Fld label="Peso (kg)"><input type="number" step="0.1" value={form.peso} onChange={e=>setForm((f:any)=>({...f,peso:e.target.value}))} style={inp}/></Fld>
              <Fld label="Cor"><input placeholder="Caramelo" value={form.cor} onChange={e=>setForm((f:any)=>({...f,cor:e.target.value}))} style={inp}/></Fld>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <Fld label="Microchip"><input placeholder="Nº do chip" value={form.chip} onChange={e=>setForm((f:any)=>({...f,chip:e.target.value}))} style={inp}/></Fld>
              <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'4px'}}>
                <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
                  <input type="checkbox" checked={form.castrado} onChange={e=>setForm((f:any)=>({...f,castrado:e.target.checked}))} />
                  <span style={{color:'#555',fontSize:'14px',fontWeight:600}}>Castrado(a)</span>
                </label>
              </div>
            </div>
            <Fld label="Notas"><textarea value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))} style={{...inp,resize:'none',height:'60px'}}/></Fld>
          </div>
          <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
            <button onClick={save} disabled={!form.label.trim()||saving} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!form.label.trim()||saving?0.4:1}}>{saving?'Salvando...':'Salvar'}</button>
            <button onClick={()=>setEditing(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════
export default function SaudePage() {
  const [membros, setMembros] = useState([...MEMBROS, ...PETS_DEFAULT])
  const [selectedPerson, setSelectedPerson] = useState('paloma')
  const [tab, setTab] = useState('medicos')
  const [showAddPet, setShowAddPet] = useState(false)
  const [newPetName, setNewPetName] = useState('')
  const [newPetEspecie, setNewPetEspecie] = useState('Cachorro')

  // Carregar pets salvos do Supabase
  useEffect(() => {
    loadPets()
  }, [])

  async function loadPets() {
    const {data} = await supabase.from('saude_pets').select('*').eq('user_id',USER_ID)
    if (data && data.length > 0) {
      const especieEmoji: any = {Cachorro:'🐕',Gato:'🐱',Pássaro:'🐦',Coelho:'🐰',Hamster:'🐹',Peixe:'🐠',Tartaruga:'🐢',Outro:'🐾'}
      const pets = data.map(p => ({
        id: p.pet_id,
        label: p.name,
        emoji: especieEmoji[p.especie] || '🐾',
        tipo: 'pet' as const,
        especie: p.especie,
      }))
      setMembros([...MEMBROS, ...pets])
    }
  }

  async function addPet() {
    if (!newPetName.trim()) return
    const petId = `pet_${Date.now()}`
    const especieEmoji: any = {Cachorro:'🐕',Gato:'🐱',Pássaro:'🐦',Coelho:'🐰',Hamster:'🐹',Peixe:'🐠',Tartaruga:'🐢',Outro:'🐾'}
    await supabase.from('saude_pets').insert({id:crypto.randomUUID(),pet_id:petId,name:newPetName.trim(),especie:newPetEspecie,user_id:USER_ID})
    setMembros(prev => [...prev.filter(m=>m.id!=='pet1'||m.label!=='Pet 1'), {id:petId,label:newPetName.trim(),emoji:especieEmoji[newPetEspecie]||'🐾',tipo:'pet',especie:newPetEspecie}])
    setSelectedPerson(petId)
    setTab('info_pet')
    setShowAddPet(false)
    setNewPetName('')
  }

  const currentMembro = membros.find(m => m.id === selectedPerson)
  const isPet = currentMembro?.tipo === 'pet'
  const tabs = isPet ? TABS_PET : TABS_PESSOA

  // Se mudar de pessoa pra pet ou vice-versa, reseta tab
  useEffect(() => {
    const validTabs = isPet ? TABS_PET : TABS_PESSOA
    if (!validTabs.find(t => t.id === tab)) {
      setTab(validTabs[0].id)
    }
  }, [selectedPerson])

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#fafafa'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column',overflowY:'auto'}}>
        {/* Seletor de pessoa/pet */}
        <div style={{background:'#fff',borderBottom:'2px solid #e5e5ea',padding:'16px 24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
            <span style={{fontSize:'13px',color:'#888',fontWeight:700,marginRight:'4px'}}>SAÚDE DE:</span>
            {membros.filter(m => m.id !== 'pet1' || m.label !== 'Pet 1').map(m => (
              <button key={m.id} onClick={()=>setSelectedPerson(m.id)} style={{
                padding:'8px 16px',borderRadius:'10px',border:`2px solid ${selectedPerson===m.id?'#7c3aed':'#e5e5ea'}`,
                background:selectedPerson===m.id?'#7c3aed':'#fff',color:selectedPerson===m.id?'#fff':'#555',
                fontSize:'14px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',transition:'all 0.2s'
              }}>
                <span>{m.emoji}</span> {m.label}
              </button>
            ))}
            <button onClick={()=>setShowAddPet(true)} style={{padding:'8px 16px',borderRadius:'10px',border:'2px dashed #c4b5fd',background:'#faf5ff',color:'#7c3aed',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
              🐾 + Pet
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{background:'#fff',borderBottom:'2px solid #e5e5ea',padding:'0 24px',display:'flex',gap:'2px',alignItems:'center',overflowX:'auto',flexShrink:0}}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'12px 14px',background:'transparent',border:'none',borderBottom:`3px solid ${tab===t.id?'#7c3aed':'transparent'}`,
              color:tab===t.id?'#7c3aed':'#999',fontSize:'14px',cursor:'pointer',fontWeight:tab===t.id?700:500,whiteSpace:'nowrap'
            }}>{t.label}</button>
          ))}
        </div>

        {/* Conteúdo */}
        <div style={{flex:1,padding:'24px',overflowY:'auto'}}>
          <div style={{maxWidth:'900px',margin:'0 auto'}}>
            {/* Pessoa */}
            {!isPet && tab==='medicos' && <MedicosTab person={selectedPerson} isPet={false} />}
            {!isPet && tab==='medicamentos' && <MedicamentosTab person={selectedPerson} isPet={false} />}
            {!isPet && tab==='exames' && <ExamesTab person={selectedPerson} />}
            {!isPet && tab==='plano' && <PlanoTab person={selectedPerson} />}
            {!isPet && tab==='atividades' && <AtividadesTab person={selectedPerson} />}
            {!isPet && tab==='medidas' && <MedidasTab person={selectedPerson} />}
            {!isPet && tab==='dietas' && <DietasTab person={selectedPerson} />}
            {/* Pet */}
            {isPet && tab==='veterinarios' && <MedicosTab person={selectedPerson} isPet={true} />}
            {isPet && tab==='vacinas_pet' && <VacinasPetTab person={selectedPerson} />}
            {isPet && tab==='medicamentos_pet' && <MedicamentosTab person={selectedPerson} isPet={true} />}
            {isPet && tab==='cuidados' && <CuidadosPetTab person={selectedPerson} />}
            {isPet && tab==='info_pet' && <InfoPetTab person={selectedPerson} membros={membros} setMembros={setMembros} />}
          </div>
        </div>
      </div>

      {/* Modal adicionar pet */}
      {showAddPet && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',justifyContent:'center',alignItems:'center'}}>
          <div style={{width:'100%',maxWidth:'400px',background:'#fff',borderRadius:'16px',padding:'24px',border:'2px solid #e5e5ea'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{color:'#111',fontSize:'18px',fontWeight:700}}>🐾 Adicionar Pet</h2>
              <button onClick={()=>setShowAddPet(false)} style={{background:'none',border:'none',color:'#888',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <Fld label="Nome do pet *"><input placeholder="Rex, Mia, Thor..." value={newPetName} onChange={e=>setNewPetName(e.target.value)} style={inp}/></Fld>
              <Fld label="Espécie"><select value={newPetEspecie} onChange={e=>setNewPetEspecie(e.target.value)} style={sel}>
                <option>Cachorro</option><option>Gato</option><option>Pássaro</option><option>Coelho</option><option>Hamster</option><option>Peixe</option><option>Tartaruga</option><option>Outro</option>
              </select></Fld>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'20px'}}>
              <button onClick={addPet} disabled={!newPetName.trim()} style={{flex:1,padding:'11px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:!newPetName.trim()?0.4:1}}>Adicionar</button>
              <button onClick={()=>setShowAddPet(false)} style={{padding:'11px 16px',background:'transparent',border:'2px solid #e5e5ea',borderRadius:'10px',color:'#555',fontSize:'14px',cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

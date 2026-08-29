'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const USER_ID = 'paloma'

const PESSOAS = [
  { id: 'paloma',      label: 'Paloma',      emoji: '👩' },
  { id: 'fabio',       label: 'Fabio',       emoji: '👨' },
  { id: 'arthur',      label: 'Arthur',      emoji: '👦' },
  { id: 'mae',         label: 'Mãe',         emoji: '👩' },
  { id: 'joao',        label: 'João',        emoji: '👤' },
  { id: 'pedro_filho', label: 'Pedro Filho', emoji: '👤' },
  { id: 'outros',      label: 'Outros',      emoji: '📁' },
]

const CATEGORIAS = [
  { id: 'cadastrais',  label: 'Dados Cadastrais',     emoji: '📋', color: '#7c3aed' },
  { id: 'financeiros', label: 'Dados Financeiros',    emoji: '💰', color: '#16a34a' },
  { id: 'redes',       label: 'Redes Sociais',        emoji: '📱', color: '#0ea5e9' },
  { id: 'logins',      label: 'Logins & Plataformas', emoji: '🔐', color: '#d97706' },
  { id: 'veiculos',    label: 'Veículos',              emoji: '🚗', color: '#dc2626' },
  { id: 'enderecos',   label: 'Endereços',             emoji: '📍', color: '#0891b2' },
  { id: 'cnpj',        label: 'CNPJ / Empresas',      emoji: '🏢', color: '#7c3aed' },
  { id: 'enel',        label: 'ENEL / Energia',        emoji: '⚡', color: '#ca8a04' },
  { id: 'cagece',      label: 'CAGECE / Água',         emoji: '💧', color: '#0284c7' },
  { id: 'outros',      label: 'Outros',                emoji: '📌', color: '#6b7280' },
]

// Campos sugeridos por categoria para facilitar o preenchimento
const CAMPOS_SUGERIDOS: any = {
  cadastrais:  ['CPF','RG','Data Nascimento','Título Eleitoral','CNH','PIS','CTPS','SUS','Tipo Sanguíneo','Certidão','C.Cidadão'],
  financeiros: ['Banco','Agência','Conta','Cartão','Validade','CVV','Limite','Vencimento Fatura','Senha','PIX','App Usuário','App Senha'],
  redes:       ['Plataforma','Usuário','E-mail','Senha','Perfil'],
  logins:      ['Plataforma','E-mail/Usuário','Senha','Observação'],
  veiculos:    ['Modelo','Placa','RENAVAM','Chassi','Cor','Ano','Seguro'],
  enderecos:   ['Rua','Número','Bairro','Cidade','CEP','Referência'],
  cnpj:        ['Razão Social','CNPJ','Titular','Situação','Abertura','Atividade'],
  enel:        ['Unidade Consumidora','Titular','CPF Titular','Endereço','Vencimento','Conta Contrato'],
  cagece:      ['Matrícula','Titular','CPF Titular','Endereço','Vencimento'],
  outros:      ['Descrição','Valor','Código','Observação'],
}

const catColor: any = {
  cadastrais:  '#7c3aed',
  financeiros: '#16a34a',
  redes:       '#0ea5e9',
  logins:      '#d97706',
  veiculos:    '#dc2626',
  enderecos:   '#0891b2',
  cnpj:        '#7c3aed',
  enel:        '#ca8a04',
  cagece:      '#0284c7',
  outros:      '#6b7280',
}

const inp: any = {
  width: '100%',
  background:'#fff',
  border:'1px solid #d0d0d8',
  borderRadius: '10px',
  padding: '9px 12px',
  color:'#111',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}

const sel: any = {
  width: '100%',
  background: '#ffffff',
  border:'1px solid #d0d0d8',
  borderRadius: '10px',
  padding: '9px 12px',
  color:'#111',
  fontSize: '13px',
  outline: 'none',
}

// Campo dinâmico: lista de {label, value}
function CamposEditor({ campos, onChange }: { campos: {label:string,value:string}[], onChange: (c:{label:string,value:string}[]) => void }) {
  function update(i: number, key: 'label'|'value', val: string) {
    const novo = [...campos]
    novo[i] = { ...novo[i], [key]: val }
    onChange(novo)
  }
  function add() { onChange([...campos, { label: '', value: '' }]) }
  function remove(i: number) { onChange(campos.filter((_,idx) => idx !== i)) }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
      {campos.map((c, i) => (
        <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1.5fr auto',gap:'6px',alignItems:'center'}}>
          <input placeholder="Campo (ex: CPF)" value={c.label} onChange={e => update(i,'label',e.target.value)} style={{...inp,fontSize:'15px',padding:'7px 10px'}} />
          <input placeholder="Valor" value={c.value} onChange={e => update(i,'value',e.target.value)} style={{...inp,fontSize:'15px',padding:'7px 10px'}} />
          <button onClick={() => remove(i)} style={{padding:'7px 9px',background:'#ffe0e0',border:'none',borderRadius:'8px',color:'#e05252',cursor:'pointer',fontSize:'15px'}}>✕</button>
        </div>
      ))}
      <button onClick={add} style={{padding:'7px',background:'#fff',border:'1px dashed rgba(255,255,255,0.15)',borderRadius:'8px',color:'#333',cursor:'pointer',fontSize:'15px'}}>+ Adicionar campo</button>
    </div>
  )
}

export default function DadosPage() {
  const [pessoa, setPessoa] = useState('paloma')
  const [categoria, setCategoria] = useState('cadastrais')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [search, setSearch] = useState('')

  // Form state
  const [titulo, setTitulo] = useState('')
  const [campos, setCampos] = useState<{label:string,value:string}[]>([{label:'',value:''}])
  const [notas, setNotas] = useState('')

  useEffect(() => { load() }, [pessoa, categoria]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('dados_pessoais')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('pessoa', pessoa)
      .eq('categoria', categoria)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setTitulo('')
    // Pré-preenche com campos sugeridos da categoria
    const sugeridos = CAMPOS_SUGERIDOS[categoria] || []
    setCampos(sugeridos.length > 0
      ? sugeridos.map((label: string) => ({ label, value: '' }))
      : [{ label: '', value: '' }]
    )
    setNotas('')
    setShowForm(true)
  }

  function openEdit(item: any) {
    setEditing(item)
    setTitulo(item.titulo)
    setCampos(item.campos && item.campos.length > 0 ? item.campos : [{ label: '', value: '' }])
    setNotas(item.notas || '')
    setShowForm(true)
  }

  async function save() {
    if (!titulo.trim()) return
    setSaving(true)
    const camposValidos = campos.filter(c => c.label.trim() || c.value.trim())
    const data = {
      titulo: titulo.trim(),
      campos: camposValidos,
      notas: notas || null,
      pessoa,
      categoria,
      user_id: USER_ID,
    }
    if (editing) {
      await supabase.from('dados_pessoais').update(data).eq('id', editing.id)
    } else {
      await supabase.from('dados_pessoais').insert({ ...data, id: crypto.randomUUID() })
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Apagar este registro?')) return
    await supabase.from('dados_pessoais').delete().eq('id', id)
    load()
  }

  const filtered = items.filter(item =>
    item.titulo.toLowerCase().includes(search.toLowerCase()) ||
    (item.campos || []).some((c: any) => c.value?.toLowerCase().includes(search.toLowerCase()))
  )

  const cc = catColor[categoria] || '#7c3aed'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f7', fontFamily: 'system-ui,sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* ── Cabeçalho ── */}
        <div style={{ padding: '28px 32px 0', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          <h1 style={{ color:'#111', fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>🗂️ Dados Pessoais</h1>
          <p style={{ color:'#444', fontSize: '13px', marginBottom: '24px' }}>Informações organizadas por pessoa e categoria</p>

          {/* Tabs pessoas */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {PESSOAS.map(p => (
              <button key={p.id} onClick={() => { setPessoa(p.id); setSearch('') }} style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: `1px solid ${pessoa === p.id ? cc : '#e8e8ee'}`,
                background: pessoa === p.id ? `${cc}22` : '#f8f8fa',
                color: pessoa === p.id ? '#fff' : '#888',
                fontSize: '13px',
                fontWeight: pessoa === p.id ? 700 : 400,
                cursor: 'pointer',
              }}>
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          {/* Tabs categorias */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom:'1px solid #d0d0d8', paddingBottom: '0' }}>
            {CATEGORIAS.map(cat => (
              <button key={cat.id} onClick={() => setCategoria(cat.id)} style={{
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${categoria === cat.id ? cat.color : 'transparent'}`,
                color: categoria === cat.id ? '#fff' : '#999',
                fontSize: '13px',
                fontWeight: categoria === cat.id ? 600 : 400,
                cursor: 'pointer',
                marginBottom: '-1px',
              }}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Conteúdo ── */}
        <div style={{ flex: 1, padding: '24px 32px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>

          {/* Barra de ações */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              placeholder={`Buscar em ${CATEGORIAS.find(c=>c.id===categoria)?.label}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, background:'#fff', border:'1px solid #d0d0d8', borderRadius: '10px', padding: '9px 14px', color:'#111', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={openNew} style={{ padding: '9px 20px', background: cc, border: 'none', borderRadius: '10px', color:'#111', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              + Adicionar
            </button>
          </div>

          {/* Lista */}
          {loading ? (
            <p style={{ color:'#444', textAlign: 'center', padding: '40px' }}>Carregando...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>📋</p>
              <p style={{ color:'#444', fontSize: '14px' }}>Nenhum registro ainda</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginTop: '4px' }}>Clique em &quot;+ Adicionar&quot; para começar</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(item => {
                const expanded = expandedId === item.id
                return (
                  <div key={item.id} style={{ borderRadius: '14px', background:'#fff', border: `1px solid ${expanded ? cc + '44' : 'rgba(255,255,255,0.07)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    {/* Header do card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer' }} onClick={() => setExpandedId(expanded ? null : item.id)}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${cc}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                        {CATEGORIAS.find(c => c.id === categoria)?.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color:'#111', fontSize: '14px', fontWeight: 600 }}>{item.titulo}</p>
                        {/* Preview dos primeiros campos */}
                        {!expanded && item.campos && item.campos.length > 0 && (
                          <div style={{ display: 'flex', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
                            {item.campos.slice(0, 3).map((c: any, i: number) => (
                              <span key={i} style={{ color:'#444', fontSize: '11px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.25)' }}>{c.label}: </span>{c.value}
                              </span>
                            ))}
                            {item.campos.length > 3 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>+{item.campos.length - 3} mais</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); openEdit(item) }} style={{ padding: '5px 10px', background:'#fff', border: 'none', borderRadius: '7px', color:'#333', fontSize: '11px', cursor: 'pointer' }}>✎</button>
                        <button onClick={e => { e.stopPropagation(); remove(item.id) }} style={{ padding: '5px 8px', background: '#fff0f0', border: 'none', borderRadius: '7px', color: '#e05252', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* Campos expandidos */}
                    {expanded && (
                      <div style={{ borderTop:'1px solid #d0d0d8', padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
                        {item.campos && item.campos.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', marginBottom: item.notas ? '12px' : 0 }}>
                            {item.campos.map((c: any, i: number) => (
                              <div key={i} style={{ background:'#fff', borderRadius: '10px', padding: '12px' }}>
                                <p style={{ color:'#444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{c.label}</p>
                                <p style={{ color:'#111', fontSize: '14px', fontWeight: 500, wordBreak: 'break-all' }}>{c.value}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {item.notas && (
                          <div style={{ background:'#fff', borderRadius: '10px', padding: '12px' }}>
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', marginBottom: '4px' }}>NOTAS</p>
                            <p style={{ color:'#444', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{item.notas}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Formulário ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 50, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '560px', background: '#ffffff', borderRadius: '16px', padding: '24px', border:'1px solid #d0d0d8', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color:'#111', fontSize: '16px', fontWeight: 600 }}>{editing ? 'Editar' : 'Novo registro'}</h2>
                <p style={{ color:'#444', fontSize: '12px', marginTop: '2px' }}>
                  {PESSOAS.find(p => p.id === pessoa)?.emoji} {PESSOAS.find(p => p.id === pessoa)?.label} · {CATEGORIAS.find(c => c.id === categoria)?.emoji} {CATEGORIAS.find(c => c.id === categoria)?.label}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color:'#444', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color:'#444', display: 'block', marginBottom: '5px' }}>Título *</label>
                <input
                  autoFocus
                  placeholder={`Ex: ${categoria === 'cadastrais' ? 'Documentos RG/CPF' : categoria === 'financeiros' ? 'Bradesco Corrente' : categoria === 'redes' ? 'Instagram Principal' : categoria === 'logins' ? 'Gmail Principal' : 'Ford Ranger'}`}
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  style={inp}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color:'#444', display: 'block', marginBottom: '8px' }}>Campos</label>
                <CamposEditor campos={campos} onChange={setCampos} />
              </div>

              <div>
                <label style={{ fontSize: '11px', color:'#444', display: 'block', marginBottom: '5px' }}>Observações</label>
                <textarea
                  placeholder="Informações extras, observações..."
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  style={{ ...inp, resize: 'none', height: '70px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={save} disabled={!titulo.trim() || saving} style={{ flex: 1, padding: '11px', background: cc, border: 'none', borderRadius: '10px', color:'#111', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: !titulo.trim() || saving ? 0.4 : 1 }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: '11px 16px', background: 'transparent', border:'1px solid #d0d0d8', borderRadius: '10px', color:'#333', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

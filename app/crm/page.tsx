'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const USER_ID = 'paloma'
const STATUSES = ['Prospecção', 'Contato', 'Negociando', 'Ganho', 'Perdido']
const EMPTY = { name: '', email: '', phone: '', company: '', status: 'Prospecção', value: '', notes: '' }

function Nav() {
  const path = usePathname()
  const links = [{ href: '/agenda', label: 'Agenda' }, { href: '/crm', label: 'CRM' }, { href: '/financeiro', label: 'Financeiro' }]
  return (
    <nav className="flex gap-2 p-4 border-b border-white/10 bg-[#0d0d1a]">
      <span className="text-violet-400 font-black mr-4">NEXORA</span>
      {links.map(l => (
        <Link key={l.href} href={l.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${path === l.href ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>{l.label}</Link>
      ))}
    </nav>
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
    const { data, error } = await supabase.from('leads').select('*').eq('user_id', USER_ID).order('created_at', { ascending: false })
    if (error) console.error(error)
    setLeads(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(EMPTY); setError(''); setShowForm(true) }
  function openEdit(lead: any) { setEditing(lead); setForm({ name: lead.name, email: lead.email || '', phone: lead.phone || '', company: lead.company || '', status: lead.status, value: lead.value?.toString() || '', notes: lead.notes || '' }); setError(''); setShowForm(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    const data = { name: form.name.trim(), email: form.email || null, phone: form.phone || null, company: form.company || null, status: form.status, value: form.value ? parseFloat(form.value) : 0, notes: form.notes || null, user_id: USER_ID }
    const { error } = editing
      ? await supabase.from('leads').update(data).eq('id', editing.id)
      : await supabase.from('leads').insert({ ...data, id: crypto.randomUUID() })
    if (error) { setError(error.message); setSaving(false); return }
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    load()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Nav />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">CRM</h1>
            <p className="text-white/40 text-sm">{leads.length} leads</p>
          </div>
          <button onClick={openNew} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-all">+ Novo Lead</button>
        </div>
        {loading ? <p className="text-white/40 text-center py-10">Carregando...</p> : (
          <div className="space-y-2">
            {leads.length === 0 && <p className="text-white/30 text-center py-10">Nenhum lead ainda!</p>}
            {leads.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 transition-all">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0">{l.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{l.name}</p>
                  <div className="flex gap-2 mt-0.5">
                    {l.company && <span className="text-white/30 text-xs">{l.company}</span>}
                    {l.value > 0 && <span className="text-emerald-400 text-xs">R$ {l.value.toLocaleString('pt-BR')}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${l.status === 'Ganho' ? 'bg-emerald-500/20 text-emerald-400' : l.status === 'Perdido' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/50'}`}>{l.status}</span>
                <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white text-xs transition-all">✎</button>
                <button onClick={() => remove(l.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 text-xs transition-all">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="min-h-full flex items-start justify-center p-4 pt-10">
            <div className="w-full max-w-md bg-[#13131f] rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-white">{editing ? 'Editar Lead' : 'Novo Lead'}</h2>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white">✕</button>
              </div>
              <div className="space-y-3">
                <input placeholder="Nome *" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500" />
                <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500" />
                <input placeholder="Telefone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500" />
                <input placeholder="Empresa" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500" />
                <input placeholder="Valor (R$)" type="number" value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500" />
                <div>
                  <label className="text-xs text-white/30 block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <textarea placeholder="Notas" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500 resize-none h-16" />
                {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button onClick={save} disabled={!form.name.trim() || saving} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all">
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-white/10 text-white/40 hover:text-white rounded-xl text-sm transition-all">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
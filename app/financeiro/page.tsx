'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const USER_ID = 'paloma'
const CATEGORIES = ['alimentação', 'transporte', 'saúde', 'educação', 'lazer', 'moradia', 'trabalho', 'outros']
const EMPTY = { title: '', amount: '', type: 'receita', category: 'outros', date: '', notes: '' }

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

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('transactions').select('*').eq('user_id', USER_ID).order('created_at', { ascending: false })
    if (error) console.error(error)
    setTransactions(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(EMPTY); setError(''); setShowForm(true) }
  function openEdit(t: any) { setEditing(t); setForm({ title: t.title, amount: t.amount.toString(), type: t.type, category: t.category, date: t.date || '', notes: t.notes || '' }); setError(''); setShowForm(true) }

  async function save() {
    if (!form.title.trim() || !form.amount) return
    setSaving(true)
    setError('')
    const data = { title: form.title.trim(), amount: parseFloat(form.amount), type: form.type, category: form.category, date: form.date || null, notes: form.notes || null, user_id: USER_ID }
    const { error } = editing
      ? await supabase.from('transactions').update(data).eq('id', editing.id)
      : await supabase.from('transactions').insert({ ...data, id: crypto.randomUUID() })
    if (error) { setError(error.message); setSaving(false); return }
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    await supabase.from('transactions').delete().eq('id', id)
    load()
  }

  const receitas = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0)
  const despesas = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0)
  const saldo = receitas - despesas

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Nav />
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Financeiro</h1>
            <p className="text-white/40 text-sm">{transactions.length} lançamentos</p>
          </div>
          <button onClick={openNew} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-all">+ Novo Lançamento</button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-emerald-400/60 text-xs mb-1">Receitas</p>
            <p className="text-emerald-400 font-black text-xl">R$ {receitas.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400/60 text-xs mb-1">Despesas</p>
            <p className="text-red-400 font-black text-xl">R$ {despesas.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
          </div>
          <div className={`${saldo >= 0 ? 'bg-violet-500/10 border-violet-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-xl p-4`}>
            <p className="text-white/40 text-xs mb-1">Saldo</p>
            <p className={`${saldo >= 0 ? 'text-violet-400' : 'text-red-400'} font-black text-xl`}>R$ {saldo.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
          </div>
        </div>
        {loading ? <p className="text-white/40 text-center py-10">Carregando...</p> : (
          <div className="space-y-2">
            {transactions.length === 0 && <p className="text-white/30 text-center py-10">Nenhum lançamento ainda!</p>}
            {transactions.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 transition-all">
                <div className={`w-2 h-8 rounded-full flex-shrink-0 ${t.type === 'receita' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.title}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-white/30 text-xs">{t.category}</span>
                    {t.date && <span className="text-white/20 text-xs">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
                <p className={`font-bold text-sm ${t.type === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'receita' ? '+' : '-'} R$ {parseFloat(t.amount).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white text-xs transition-all">✎</button>
                <button onClick={() => remove(t.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 text-xs transition-all">✕</button>
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
                <h2 className="font-bold text-white">{editing ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white">✕</button>
              </div>
              <div className="space-y-3">
                <input placeholder="Título *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500" />
                <input placeholder="Valor *" type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/30 block mb-1">Tipo</label>
                    <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500">
                      <option value="receita">Receita</option>
                      <option value="despesa">Despesa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/30 block mb-1">Categoria</label>
                    <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/30 block mb-1">Data</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500" style={{colorScheme:'dark'}} />
                </div>
                <textarea placeholder="Notas" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500 resize-none h-16" />
                {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button onClick={save} disabled={!form.title.trim() || !form.amount || saving} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all">
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
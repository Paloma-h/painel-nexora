'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const USER_ID = 'paloma'
const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const CATEGORIES = ['geral', 'trabalho', 'saude', 'pessoal', 'financeiro', 'familia']
const EMPTY = { title: '', description: '', date: '', time: '', priority: 'MEDIUM', category: 'geral' }

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

export default function AgendaPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', USER_ID).order('created_at', { ascending: false })
    if (error) console.error(error)
    setTasks(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    setError('')
    const { error } = await supabase.from('tasks').insert({
      id: crypto.randomUUID(),
      title: form.title.trim(),
      description: form.description || null,
      date: form.date || null,
      time: form.time || null,
      priority: form.priority,
      category: form.category,
      status: 'PENDING',
      user_id: USER_ID,
    })
    if (error) { setError(error.message); setSaving(false); return }
    setForm(EMPTY)
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function complete(id: string) {
    await supabase.from('tasks').update({ status: 'DONE' }).eq('id', id)
    load()
  }

  async function remove(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  const pending = tasks.filter(t => t.status !== 'DONE')
  const done = tasks.filter(t => t.status === 'DONE')

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Nav />
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Agenda</h1>
            <p className="text-white/40 text-sm">{pending.length} pendentes · {done.length} concluídas</p>
          </div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-all">+ Nova Tarefa</button>
        </div>

        {loading ? <p className="text-white/40 text-center py-10">Carregando...</p> : (
          <div className="space-y-2">
            {pending.length === 0 && <p className="text-white/30 text-center py-10">Nenhuma tarefa pendente!</p>}
            {pending.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${t.priority === 'CRITICAL' ? 'bg-red-400' : t.priority === 'HIGH' ? 'bg-orange-400' : t.priority === 'MEDIUM' ? 'bg-amber-400' : 'bg-green-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.title}</p>
                  <div className="flex gap-2 mt-0.5">
                    {t.date && <span className="text-white/30 text-xs">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                    <span className="text-white/20 text-xs">{t.category}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50">{t.priority}</span>
                <button onClick={() => complete(t.id)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 text-xs transition-all">✓</button>
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
                <h2 className="font-bold text-white">Nova Tarefa</h2>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white">✕</button>
              </div>
              <div className="space-y-3">
                <input placeholder="Título *" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500" />
                <textarea placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500 resize-none h-16" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/30 block mb-1">Data</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500" style={{colorScheme:'dark'}} />
                  </div>
                  <div>
                    <label className="text-xs text-white/30 block mb-1">Hora</label>
                    <input type="time" value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500" style={{colorScheme:'dark'}} />
                  </div>
                  <div>
                    <label className="text-xs text-white/30 block mb-1">Prioridade</label>
                    <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500">
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/30 block mb-1">Categoria</label>
                    <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button onClick={save} disabled={!form.title.trim() || saving} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all">
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => { setShowForm(false); setError('') }} className="px-4 py-2.5 border border-white/10 text-white/40 hover:text-white rounded-xl text-sm transition-all">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

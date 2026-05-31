'use client'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { CheckCircle2, Circle, Zap, Clock, Brain, Plus, ArrowRight, Pencil, Trash2, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, Priority } from '@/types'

const INITIAL_TASKS: Task[] = [
  { id:'1', title:'Ligar Maria Silva — follow-up mentoria', status:'PENDING', priority:'CRITICAL', priorityScore:95, dueDate:'2025-01-20', xpReward:30, aiGenerated:false, moduleType:'crm' },
  { id:'2', title:'Responder João no WhatsApp', status:'PENDING', priority:'HIGH', priorityScore:82, xpReward:20, aiGenerated:false, moduleType:'crm' },
  { id:'3', title:'Proposta Suplemento X para Carlos', status:'PENDING', priority:'HIGH', priorityScore:75, xpReward:25, aiGenerated:true, moduleType:'crm' },
  { id:'4', title:'Revisar campanha Instagram', status:'PENDING', priority:'MEDIUM', priorityScore:55, xpReward:15, aiGenerated:false, moduleType:'marketing' },
  { id:'5', title:'Atualizar fluxo de caixa', status:'PENDING', priority:'MEDIUM', priorityScore:50, xpReward:15, aiGenerated:false, moduleType:'financial' },
  { id:'6', title:'Estudar — Copywriting Avançado', status:'PENDING', priority:'LOW', priorityScore:30, xpReward:20, aiGenerated:false, moduleType:'study' },
  { id:'7', title:'Treino funcional 30min', status:'PENDING', priority:'LOW', priorityScore:25, xpReward:25, aiGenerated:false, moduleType:'health' },
]

const PRIORITY_ICON: Record<Priority, string> = {
  CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🔵', LOW: '⬜'
}

const MODULE_COLOR: Record<string, string> = {
  crm: 'text-brand-400', marketing: 'text-pink-400',
  financial: 'text-teal-400', study: 'text-blue-400',
  health: 'text-emerald-400', personal: 'text-slate-400',
}

const MODULE_OPTIONS = ['crm','marketing','financial','study','health','personal']

interface EditState {
  id: string
  title: string
  priority: Priority
  moduleType: string
  dueDate: string
  xpReward: number
}

export default function AgendaPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [filter, setFilter] = useState<Priority | 'ALL'>('ALL')
  const { triggerXP, setActiveTask } = useAppStore()

  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM')
  const [newModule, setNewModule] = useState('crm')
  const [newDueDate, setNewDueDate] = useState('')
  const [newXP, setNewXP] = useState(15)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function complete(id: string, xp: number) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: 'DONE' as any } : t))
    triggerXP(xp)
  }

  function addTask() {
    if (!newTitle.trim()) return
    const task: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      status: 'PENDING',
      priority: newPriority,
      priorityScore: newPriority === 'CRITICAL' ? 90 : newPriority === 'HIGH' ? 70 : newPriority === 'MEDIUM' ? 50 : 25,
      dueDate: newDueDate || undefined,
      xpReward: newXP,
      aiGenerated: false,
      moduleType: newModule,
    }
    setTasks(ts => [task, ...ts])
    setNewTitle('')
    setNewPriority('MEDIUM')
    setNewModule('crm')
    setNewDueDate('')
    setNewXP(15)
  }

  function startEdit(task: Task) {
    setEditingId(task.id)
    setEditState({
      id: task.id,
      title: task.title,
      priority: task.priority,
      moduleType: task.moduleType,
      dueDate: task.dueDate ?? '',
      xpReward: task.xpReward,
    })
  }

  function saveEdit() {
    if (!editState || !editState.title.trim()) return
    setTasks(ts => ts.map(t => t.id === editState.id ? {
      ...t,
      title: editState.title.trim(),
      priority: editState.priority,
      moduleType: editState.moduleType,
      dueDate: editState.dueDate || undefined,
      xpReward: editState.xpReward,
    } : t))
    setEditingId(null)
    setEditState(null)
  }

  function deleteTask(id: string) {
    setTasks(ts => ts.filter(t => t.id !== id))
    setDeletingId(null)
  }

  const active = tasks.filter(t => t.status !== 'DONE' && (filter === 'ALL' || t.priority === filter))
  const done = tasks.filter(t => t.status === 'DONE')

  return (
    <AppShell title="Agenda Operacional">
      <div className="grid lg:grid-cols-3 gap-6 max-w-6xl">

        <div className="lg:col-span-2 space-y-4">

          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-brand-900/60 to-brand-800/30 border border-brand-500/20 flex items-center gap-3">
            <Brain className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-300">Motor de Prioridades IA</p>
              <p className="text-xs text-slate-400">3 tarefas críticas detectadas. Lead Maria Silva sem follow-up há 18h.</p>
            </div>
            <button className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 whitespace-nowrap">
              Reorganizar <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>

          <div className="flex gap-2 flex-wrap">
            {(['ALL','CRITICAL','HIGH','MEDIUM','LOW'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                  filter === f ? 'bg-brand-600 border-brand-500 text-white' : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                )}>
                {f === 'ALL' ? 'Todas' : f}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {active.map((task, i) => (
                <motion.div key={task.id} layout
                  initial={{ opacity:0, x:-10 }}
                  animate={{ opacity:1, x:0, transition:{ delay: i*0.05 } }}
                  exit={{ opacity:0, x:20, height:0 }}>

                  {deletingId === task.id ? (
                    <div className="card p-4 flex items-center gap-4 border-red-500/40 bg-red-500/10">
                      <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="flex-1 text-sm text-slate-300">Excluir <strong className="text-white">"{task.title}"</strong>?</p>
                      <button onClick={() => deleteTask(task.id)}
                        className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-all">
                        Excluir
                      </button>
                      <button onClick={() => setDeletingId(null)}
                        className="text-xs border border-white/10 hover:bg-white/5 text-slate-400 px-3 py-1.5 rounded-lg transition-all">
                        Cancelar
                      </button>
                    </div>

                  ) : editingId === task.id && editState ? (
                    <div className="card p-4 space-y-3 border-brand-500/30 bg-brand-900/10">
                      <input
                        className="input w-full text-sm"
                        value={editState.title}
                        onChange={e => setEditState(s => s ? { ...s, title: e.target.value } : s)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit()
                          if (e.key === 'Escape') { setEditingId(null); setEditState(null) }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2 flex-wrap">
                        <select className="input text-xs flex-1" value={editState.priority}
                          onChange={e => setEditState(s => s ? { ...s, priority: e.target.value as Priority } : s)}>
                          <option value="CRITICAL">🔴 Critical</option>
                          <option value="HIGH">🟠 High</option>
                          <option value="MEDIUM">🔵 Medium</option>
                          <option value="LOW">⬜ Low</option>
                        </select>
                        <select className="input text-xs flex-1" value={editState.moduleType}
                          onChange={e => setEditState(s => s ? { ...s, moduleType: e.target.value } : s)}>
                          {MODULE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <input type="date" className="input text-xs flex-1" value={editState.dueDate}
                          onChange={e => setEditState(s => s ? { ...s, dueDate: e.target.value } : s)} />
                        <input type="number" className="input text-xs w-20" min={5} max={100} step={5}
                          value={editState.xpReward}
                          onChange={e => setEditState(s => s ? { ...s, xpReward: Number(e.target.value) } : s)}
                          title="XP" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setEditingId(null); setEditState(null) }}
                          className="text-xs border border-white/10 hover:bg-white/5 text-slate-400 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                          <X className="w-3 h-3" /> Cancelar
                        </button>
                        <button onClick={saveEdit}
                          className="text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                          <Check className="w-3 h-3" /> Salvar
                        </button>
                      </div>
                    </div>

                  ) : (
                    <div className={cn('card p-4 flex items-center gap-4 group',
                      task.priority === 'CRITICAL' && 'border-red-500/20 bg-red-500/5')}>
                      <button onClick={() => complete(task.id, task.xpReward)}
                        className="text-slate-600 hover:text-emerald-400 transition-colors flex-shrink-0">
                        <Circle className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span>{PRIORITY_ICON[task.priority]}</span>
                          <p className="text-sm text-white font-medium truncate">{task.title}</p>
                          {task.aiGenerated && (
                            <span className="text-xs bg-brand-600/20 text-brand-400 px-1.5 py-0.5 rounded-md flex-shrink-0">IA</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn('text-xs font-medium', MODULE_COLOR[task.moduleType] ?? 'text-slate-500')}>
                            {task.moduleType}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setActiveTask(task)}
                          className="text-xs bg-brand-600/20 hover:bg-brand-600 text-brand-400 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Focar
                        </button>
                        <button onClick={() => startEdit(task)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingId(task.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-brand-400 font-medium flex items-center gap-1 flex-shrink-0">
                        <Zap className="w-3 h-3" /> {task.xpReward}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {active.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm">Todas as tarefas concluídas! 🎉</p>
              </div>
            )}
          </div>

          {done.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Concluídas hoje ({done.length})</p>
              {done.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 opacity-40 group">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-slate-400 line-through flex-1">{t.title}</span>
                  <button onClick={() => deleteTask(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Hoje</h3>
            <div className="space-y-3">
              {[
                ['Pendentes', active.length, 'text-amber-400'],
                ['Concluídas', done.length, 'text-emerald-400'],
                ['XP Disponível', `${active.reduce((s,t) => s+t.xpReward, 0)} XP`, 'text-brand-400'],
              ].map(([l,v,c]) => (
                <div key={String(l)} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{l}</span>
                  <span className={cn('text-sm font-bold', c as string)}>{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-400 rounded-full"
                animate={{ width: `${done.length/(tasks.length||1)*100}%` }}
                transition={{ duration:1, ease:'easeOut' }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">{Math.round(done.length/(tasks.length||1)*100)}% concluído</p>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Adicionar Tarefa</h3>
            <div className="space-y-2">
              <input className="input w-full" placeholder="Título da tarefa..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()} />
              <select className="input w-full" value={newPriority}
                onChange={e => setNewPriority(e.target.value as Priority)}>
                <option value="CRITICAL">🔴 Crítica</option>
                <option value="HIGH">🟠 Alta</option>
                <option value="MEDIUM">🔵 Média</option>
                <option value="LOW">⬜ Baixa</option>
              </select>
              <select className="input w-full" value={newModule}
                onChange={e => setNewModule(e.target.value)}>
                {MODULE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="date" className="input flex-1 text-xs" value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)} />
                <input type="number" className="input w-20 text-xs" min={5} max={100} step={5}
                  value={newXP} onChange={e => setNewXP(Number(e.target.value))} title="XP" />
              </div>
              <button onClick={addTask}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </div>

          <div className="card p-5 border-brand-500/20 bg-brand-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-medium text-brand-300">Sugestão da IA</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Com base no seu histórico, o melhor horário para follow-up com Maria Silva é entre{' '}
              <strong className="text-white">14h-16h</strong>. Taxa de resposta 78% nesse período.
            </p>
            <button className="mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Criar tarefa agendada →
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

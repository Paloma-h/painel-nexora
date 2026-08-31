'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou senha incorretos'); setLoading(false); return }
    router.push('/agenda')
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-violet-400 mb-2">NEXORA</h1>
          <p className="text-gray-400 text-sm">Seu painel pessoal</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="seu@email.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm outline-none focus:border-violet-500"
            />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={!email || !password || loading}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
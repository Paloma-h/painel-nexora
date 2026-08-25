'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const USER_ID = 'paloma'

const FILMES = [
  { name: 'Sede de Matar', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'Era Uma Vez', genre: 'Drama', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'Rei Arthur', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'Gladiador', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'Miss Bala', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'Pablo Escobar', genre: 'Drama', type: 'Série', notes: 'Assistido em 2021' },
  { name: 'O Poço', genre: 'Suspense', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'O Passageiro', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'Onze Homens e 1 Segredo', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'Doze Homens e Outro Segredo', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'Treze Homens e Um Novo Segredo', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'Direção Explosiva', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'O Milagre da Cela 7', genre: 'Drama', type: 'Filme', notes: 'Assistido em 2021' },
  { name: '3 Dias Para Matar', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'O Atirador', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'O Contador', genre: 'Ação', type: 'Filme', notes: 'Assistido em 2021' },
  { name: 'Vikings', genre: 'Drama', type: 'Série', notes: 'Assistido em 2022' },
]

const LIVROS = [
  { name: 'O Poder da Ação', genre: 'Desenvolvimento Pessoal', notes: 'Lido em 2022' },
  { name: 'Mulheres, Comidas e Deus', genre: 'Desenvolvimento Pessoal', notes: 'Lido em 2022' },
]

export default function SeedPage() {
  const [status, setStatus] = useState('Clique no botão para inserir os dados')
  const [done, setDone] = useState(false)

  async function seed() {
    setStatus('Inserindo filmes...')
    const now = new Date().toISOString()

    const filmesData = FILMES.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      genre: f.genre,
      type: f.type,
      platform: 'Netflix',
      status: 'Concluído',
      rating: null,
      notes: f.notes,
      user_id: USER_ID,
      created_at: now,
      updated_at: now,
    }))

    const { error: e1 } = await supabase.from('educacao_filmes').insert(filmesData)
    if (e1) {
      setStatus(`Erro nos filmes: ${e1.message}`)
      return
    }
    setStatus(`✅ ${FILMES.length} filmes inseridos! Inserindo livros...`)

    const livrosData = LIVROS.map(l => ({
      id: crypto.randomUUID(),
      name: l.name,
      genre: l.genre,
      type: 'Livro',
      status: 'Concluído',
      rating: null,
      notes: l.notes,
      user_id: USER_ID,
      created_at: now,
      updated_at: now,
    }))

    const { error: e2 } = await supabase.from('educacao_livros').insert(livrosData)
    if (e2) {
      setStatus(`Filmes OK! Erro nos livros: ${e2.message}`)
      return
    }

    setStatus(`✅ Tudo inserido! ${FILMES.length} filmes/séries + ${LIVROS.length} livros. Pode fechar esta página.`)
    setDone(true)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#08080f', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', maxWidth: 500, padding: 40 }}>
        <h1 style={{ color: '#fff', fontSize: 24, marginBottom: 20 }}>📋 Inserir Filmes e Livros</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 30 }}>{status}</p>
        {!done && (
          <button onClick={seed} style={{ padding: '14px 32px', background: '#7c3aed', border: 'none', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            🚀 Inserir {FILMES.length} filmes + {LIVROS.length} livros
          </button>
        )}
        {done && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <a href="/filmes" style={{ padding: '12px 24px', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 10, color: '#c4b5fd', textDecoration: 'none', fontWeight: 600 }}>🎬 Ver Filmes</a>
            <a href="/livros" style={{ padding: '12px 24px', background: 'rgba(76,175,125,0.2)', border: '1px solid rgba(76,175,125,0.4)', borderRadius: 10, color: '#4caf7d', textDecoration: 'none', fontWeight: 600 }}>📚 Ver Livros</a>
          </div>
        )}
      </div>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Esta rota roda só no servidor (nunca no navegador), por isso pode usar a
// chave secreta do Central Gabinete sem risco de vazar ela pro público.
// Ela só LÊ a agenda de lá — nunca cria, edita nem apaga nada.
export async function GET() {
  const url = process.env.CENTRAL_GABINETE_SUPABASE_URL
  const chave = process.env.CENTRAL_GABINETE_SERVICE_ROLE_KEY

  if (!url || !chave) {
    // Ainda não configurado (chave não colada no .env.local) — devolve
    // lista vazia em vez de quebrar a agenda do Nevora.
    return NextResponse.json({ eventos: [] })
  }

  const supabaseGabinete = createClient(url, chave)

  const agora = new Date()
  agora.setDate(agora.getDate() - 1) // inclui ontem, por segurança de fuso horário

  const { data, error } = await supabaseGabinete
    .from('eventos_agenda')
    .select('id, titulo, tipo, data_hora_inicio, data_hora_fim, local, endereco')
    .gte('data_hora_inicio', agora.toISOString())
    .order('data_hora_inicio', { ascending: true })

  if (error) {
    return NextResponse.json({ eventos: [], erro: error.message }, { status: 200 })
  }

  return NextResponse.json({ eventos: data ?? [] })
}

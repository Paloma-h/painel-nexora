import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rota que mantém o Supabase ativo (plano free pausa após 1 semana sem uso)
// Configurar um cron externo (ex: cron-job.org) pra chamar essa URL a cada 3 dias
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { count } = await supabase.from('tasks').select('id', { count: 'exact', head: true })
    return NextResponse.json({ ok: true, tasks: count, timestamp: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

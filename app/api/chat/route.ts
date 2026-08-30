import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const USER_ID = 'paloma'

async function getUserContext() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const [tasks, pendencias, leads, clients, bills] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', USER_ID).neq('type','pendencia').order('date',{ascending:true}).limit(50),
    supabase.from('tasks').select('*').eq('user_id', USER_ID).eq('type','pendencia').neq('status','DONE').order('created_at',{ascending:false}).limit(30),
    supabase.from('leads').select('*').eq('user_id', USER_ID).order('created_at',{ascending:false}).limit(20),
    supabase.from('clients').select('*').eq('user_id', USER_ID).limit(20),
    supabase.from('bills').select('*').eq('user_id', USER_ID).eq('status','pendente').limit(20),
  ])

  const todayTasks = (tasks.data||[]).filter((t:any) => t.date === todayStr && t.status !== 'DONE')
  const overdue = (tasks.data||[]).filter((t:any) => t.date && t.date < todayStr && t.status !== 'DONE')
  const upcoming = (tasks.data||[]).filter((t:any) => t.date && t.date > todayStr && t.status !== 'DONE').slice(0,15)

  return `
DADOS DA PALOMA (hoje: ${todayStr}):

TAREFAS HOJE (${todayTasks.length}):
${todayTasks.map((t:any) => `- ${t.title}${t.time?' as '+t.time:''}${t.priority==='CRITICAL'?' [URGENTE]':''}`).join('\n') || 'Nenhuma'}

ATRASADAS (${overdue.length}):
${overdue.slice(0,10).map((t:any) => `- ${t.title} (${t.date})`).join('\n') || 'Nenhuma'}

PROXIMOS DIAS (${upcoming.length}):
${upcoming.map((t:any) => `- ${t.date}: ${t.title}${t.time?' as '+t.time:''}`).join('\n') || 'Nenhum'}

PENDENCIAS ATIVAS (${(pendencias.data||[]).length}):
${(pendencias.data||[]).slice(0,10).map((p:any) => `- ${p.title} [${p.priority}]`).join('\n') || 'Nenhuma'}

LEADS CRM (${(leads.data||[]).length}):
${(leads.data||[]).slice(0,10).map((l:any) => `- ${l.name}${l.status?' ('+l.status+')':''}${l.product?' - '+l.product:''}`).join('\n') || 'Nenhum'}

CLIENTES (${(clients.data||[]).length}):
${(clients.data||[]).slice(0,10).map((c:any) => `- ${c.name}${c.product?' - '+c.product:''}${c.pots_bought?' ('+c.pots_bought+' potes)':''}`).join('\n') || 'Nenhum'}

CONTAS PENDENTES (${(bills.data||[]).length}):
${(bills.data||[]).map((b:any) => `- ${b.title||'Sem nome'}: R$${b.amount||0} vence ${b.due_date||'sem data'}`).join('\n') || 'Nenhuma'}
`.trim()
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Chave da API Gemini nao configurada. Adicione GEMINI_API_KEY nas variaveis de ambiente do Vercel.' }, { status: 500 })
  }

  const { messages } = await req.json()

  let context = ''
  try {
    context = await getUserContext()
  } catch (e) {
    context = 'Nao foi possivel carregar os dados do banco.'
  }

  const systemPrompt = `Voce e a NORA, assistente pessoal da Paloma dentro do app Nexora.

REGRAS:
- Responda SEMPRE em portugues do Brasil
- Seja direta e objetiva (Paloma tem TDAH)
- Use frases curtas, no maximo 10 palavras por bullet
- Use emojis como ancoras visuais
- Use listas com bullets, nunca paragrafos longos
- Quando falar de tarefas/dados, consulte o contexto abaixo
- Pode ajudar a organizar o dia, priorizar tarefas, gerar textos, mensagens pra clientes
- Se a Paloma pedir algo que precisa de acao no banco de dados, explique o que ela deve fazer no app
- Seja amigavel mas eficiente, tipo uma assistente executiva

CONTEXTO DOS DADOS:
${context}`

  // Build Gemini conversation format
  const geminiContents = [
    { role: 'user', parts: [{ text: systemPrompt + '\n\nResponda a partir de agora como NORA.' }] },
    { role: 'model', parts: [{ text: 'Entendido! Sou a NORA, assistente pessoal da Paloma no Nexora. Estou pronta para ajudar! 🚀' }] },
    ...messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
  ]

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('Gemini error:', err)
      return NextResponse.json({ error: `Erro na API Gemini: ${response.status}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, nao consegui processar.'

    return NextResponse.json({ message: text })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Erro ao conectar com a IA' }, { status: 500 })
  }
}

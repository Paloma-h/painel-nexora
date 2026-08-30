'use client'
import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  '🎯 O que devo focar hoje?',
  '📅 Quais compromissos tenho essa semana?',
  '🔥 Quais pendências são urgentes?',
  '💰 Quanto devo em contas?',
  '💬 Escreve uma mensagem pro cliente',
  '📋 Resume meu dia',
]

export default function IAPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setError('')
    const newMessages: Msg[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.message }])
      }
    } catch (e) {
      setError('Erro de conexão')
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  function formatResponse(text: string) {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <p key={i} style={{padding:'4px 0 4px 12px',borderLeft:'3px solid #7c3aed',marginBottom:'4px',fontSize:'14px',lineHeight:1.5}}>{line.slice(2)}</p>
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} style={{fontWeight:700,fontSize:'15px',marginTop:'8px',marginBottom:'4px',color:'#111'}}>{line.replace(/\*\*/g,'')}</p>
      }
      return <p key={i} style={{fontSize:'14px',lineHeight:1.6,marginBottom:'4px'}}>{line}</p>
    })
  }

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#fafafa'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>

        {/* Header */}
        <div style={{padding:'20px 32px',borderBottom:'1px solid #e8e8ee',background:'#fff'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:'20px'}}>🤖</span>
            </div>
            <div>
              <h1 style={{color:'#111',fontSize:'20px',fontWeight:800}}>NORA</h1>
              <p style={{color:'#888',fontSize:'12px'}}>Sua assistente pessoal Nexora</p>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 32px'}}>
          <div style={{maxWidth:'700px',margin:'0 auto'}}>

            {/* Welcome */}
            {messages.length === 0 && (
              <div style={{textAlign:'center',padding:'40px 0'}}>
                <p style={{fontSize:'40px',marginBottom:'12px'}}>👋</p>
                <h2 style={{color:'#111',fontSize:'22px',fontWeight:800,marginBottom:'8px'}}>Oi, Paloma!</h2>
                <p style={{color:'#888',fontSize:'15px',marginBottom:'28px'}}>Como posso te ajudar?</p>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',maxWidth:'460px',margin:'0 auto'}}>
                  {SUGGESTIONS.map((s,i) => (
                    <button key={i} onClick={() => send(s)} style={{
                      padding:'12px 14px',textAlign:'left',background:'#fff',
                      border:'1px solid #e5e5ea',borderRadius:'10px',fontSize:'13px',
                      color:'#333',cursor:'pointer',fontWeight:500,
                      transition:'all 0.15s',
                    }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor='#7c3aed')}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor='#e5e5ea')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((m, i) => (
              <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:'12px'}}>
                <div style={{
                  maxWidth:'85%',
                  padding:'12px 16px',
                  borderRadius:m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',
                  background:m.role==='user'?'#7c3aed':'#fff',
                  color:m.role==='user'?'#fff':'#111',
                  border:m.role==='user'?'none':'1px solid #e8e8ee',
                  fontSize:'14px',
                  lineHeight:1.6,
                  boxShadow:m.role==='assistant'?'0 1px 4px rgba(0,0,0,0.04)':'none',
                }}>
                  {m.role === 'assistant' ? formatResponse(m.content) : m.content}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div style={{display:'flex',justifyContent:'flex-start',marginBottom:'12px'}}>
                <div style={{padding:'14px 20px',borderRadius:'16px 16px 16px 4px',background:'#fff',border:'1px solid #e8e8ee'}}>
                  <div style={{display:'flex',gap:'6px'}}>
                    <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#7c3aed',animation:'pulse 1s infinite'}}>.</span>
                    <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#7c3aed',animation:'pulse 1s infinite 0.2s'}}>.</span>
                    <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#7c3aed',animation:'pulse 1s infinite 0.4s'}}>.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{padding:'12px 16px',borderRadius:'10px',background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:'13px',marginBottom:'12px'}}>
                ⚠️ {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{padding:'16px 32px',borderTop:'1px solid #e8e8ee',background:'#fff'}}>
          <div style={{maxWidth:'700px',margin:'0 auto',display:'flex',gap:'8px'}}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Pergunte qualquer coisa..."
              style={{
                flex:1,padding:'12px 16px',borderRadius:'12px',
                border:'2px solid #e5e5ea',fontSize:'15px',color:'#111',
                outline:'none',background:'#fff',
              }}
              onFocus={e=>(e.currentTarget.style.borderColor='#7c3aed')}
              onBlur={e=>(e.currentTarget.style.borderColor='#e5e5ea')}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                padding:'12px 20px',borderRadius:'12px',
                background:input.trim()?'#7c3aed':'#e5e5ea',
                border:'none',color:'#fff',fontSize:'15px',
                fontWeight:700,cursor:input.trim()?'pointer':'default',
              }}
            >
              Enviar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

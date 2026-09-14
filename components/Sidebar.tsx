'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Calendar, Zap, Users, DollarSign,
  FolderOpen, Heart, BookOpen, LogOut, Shield, Tv, ShoppingCart, Bot, BarChart3,
} from 'lucide-react'

const USER_ID = 'paloma'

const NAV_MAIN = [
  { href: '/dashboard',     label: 'Dashboard',      Icon: LayoutDashboard, emoji: '🏠' },
  { href: '/agenda',        label: 'Agenda',          Icon: Calendar,        emoji: '📅' },
  { href: '/pendencias',    label: 'Pendências',      Icon: Zap,             emoji: '⚡' },
  { href: '/crm',           label: 'CRM',             Icon: Users,           emoji: '👥' },
  { href: '/financeiro',    label: 'Financeiro',      Icon: DollarSign,      emoji: '💰' },
  { href: '/produtividade', label: 'Produtividade',   Icon: BarChart3,       emoji: '📊' },
  { href: '/ia',            label: 'NORA IA',         Icon: Bot,             emoji: '🤖' },
]

const NAV_PERSONAL = [
  { href: '/dados',     label: 'Dados Pessoais', Icon: Shield,       emoji: '🔐' },
  { href: '/projetos',  label: 'Projetos',       Icon: FolderOpen,   emoji: '📁' },
  { href: '/saude',     label: 'Saúde',          Icon: Heart,        emoji: '❤️' },
  { href: '/educacao',  label: 'Educação',       Icon: BookOpen,     emoji: '🎓' },
  { href: '/livros',    label: 'Livros',         Icon: BookOpen,     emoji: '📚' },
  { href: '/filmes',    label: 'Filmes',         Icon: Tv,           emoji: '🎬' },
  { href: '/desejos',   label: 'Desejos',        Icon: ShoppingCart, emoji: '🛒' },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [stats, setStats] = useState({ hoje: 0, pendencias: 0, atrasadas: 0 })

  useEffect(() => {
    async function loadStats() {
      try {
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
        const [t, p] = await Promise.all([
          supabase.from('tasks').select('id,date,status').eq('user_id', USER_ID).neq('type','pendencia').neq('status','DONE'),
          supabase.from('tasks').select('id,date,status').eq('user_id', USER_ID).eq('type','pendencia').neq('status','DONE'),
        ])
        const tasks = t.data || []
        setStats({
          hoje: tasks.filter((x:any) => x.date === todayStr).length,
          pendencias: (p.data || []).length,
          atrasadas: tasks.filter((x:any) => x.date && x.date < todayStr).length,
        })
      } catch {}
    }
    loadStats()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function NavItem({ href, label, emoji }: { href: string; label: string; Icon: any; emoji: string }) {
    const active = path === href
    return (
      <Link href={href} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 14px', borderRadius: '10px', fontSize: '14px',
        fontWeight: active ? 800 : 600,
        color: active ? '#ffffff' : '#334155',
        background: active ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'transparent',
        textDecoration: 'none', marginBottom: '2px',
        transition: 'all 0.15s ease',
        boxShadow: active ? '0 3px 12px rgba(124,58,237,0.35)' : 'none',
        borderLeft: active ? '3px solid #7c3aed' : '3px solid transparent',
        letterSpacing: '0.01em',
      }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f1f0ff'; e.currentTarget.style.borderLeftColor = '#a78bfa' }}}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent' }}}
      >
        <span style={{ fontSize: '16px', width: '22px', textAlign: 'center', flexShrink: 0 }}>{emoji}</span>
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <aside style={{
      width: '240px', background: '#ffffff',
      borderRight: '2px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
      minHeight: '100vh', position: 'sticky',
      top: 0, height: '100vh', overflow: 'hidden',
    }}>
      {/* ━━━ LOGO ━━━ */}
      <div style={{
        padding: '16px 14px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        borderBottom: '2px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, backdropFilter: 'blur(4px)',
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="7" cy="7" r="2" fill="white"/>
            </svg>
          </div>
          <div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '18px', letterSpacing: '1.5px' }}>NEXORA</span>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 600, margin: 0 }}>Painel Pessoal</p>
          </div>
        </div>
      </div>

      {/* ━━━ NAV ━━━ */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7c3aed', padding: '8px 10px 4px', margin: 0 }}>
          ▾ Principal
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_MAIN.map(item => <NavItem key={item.href} {...item} />)}
        </div>

        <div style={{ height: '2px', background: '#e2e8f0', margin: '10px 8px' }} />

        <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7c3aed', padding: '4px 10px 4px', margin: 0 }}>
          ▾ Pessoal
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_PERSONAL.map(item => <NavItem key={item.href} {...item} />)}
        </div>
      </nav>

      {/* ━━━ PERFIL INTERATIVO ━━━ */}
      <div style={{ borderTop: '2px solid #e2e8f0', padding: '8px' }}>
        <div
          onClick={() => setProfileOpen(!profileOpen)}
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            borderRadius: '12px', padding: '12px', color: '#fff',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 800, backdropFilter: 'blur(4px)',
            }}>PA</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, lineHeight: 1.2 }}>Paloma</p>
              <p style={{ margin: 0, fontSize: '10px', opacity: 0.8, fontWeight: 600 }}>👑 Administradora</p>
            </div>
            <span style={{
              fontSize: '12px', transition: 'transform 0.2s',
              transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              opacity: 0.6,
            }}>▲</span>
          </div>

          {/* Mini stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '10px' }}>
            {[
              { n: stats.hoje, l: 'Hoje' },
              { n: stats.pendencias, l: 'Pendênc.' },
              { n: stats.atrasadas, l: 'Atrasadas' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
                padding: '5px 4px', textAlign: 'center', backdropFilter: 'blur(4px)',
              }}>
                <span style={{ fontSize: '15px', fontWeight: 800, display: 'block', lineHeight: 1.2 }}>{s.n}</span>
                <span style={{ fontSize: '8px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expandido */}
        {profileOpen && (
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
            padding: '8px', marginTop: '6px',
          }}>
            <button onClick={logout} style={{
              width: '100%', padding: '8px', borderRadius: '8px',
              background: '#fff', border: '1px solid #fca5a5',
              color: '#dc2626', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
            }}>
              <LogOut size={14} /> Sair
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

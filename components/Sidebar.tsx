'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Calendar,
  Zap,
  Users,
  DollarSign,
  FolderOpen,
  Heart,
  BookOpen,
  LogOut,
  Shield,Tv,
  ShoppingCart,
} from 'lucide-react'

const NAV_MAIN = [
  { href: '/dashboard',  label: 'Dashboard',       Icon: LayoutDashboard },
  { href: '/agenda',     label: 'Agenda',           Icon: Calendar        },
  { href: '/pendencias', label: 'Pendências',       Icon: Zap             },
  { href: '/crm',        label: 'CRM',              Icon: Users           },
  { href: '/financeiro', label: 'Financeiro',       Icon: DollarSign      },
  { href: '/dados',      label: 'Dados Pessoais',   Icon: Shield          },
]

const NAV_PERSONAL = [
  { href: '/projetos',   label: 'Projetos',    Icon: FolderOpen   },
  { href: '/saude',      label: 'Saúde',       Icon: Heart        },
  { href: '/educacao',   label: 'Educação',    Icon: BookOpen     },
  { href: '/livros',     label: 'Livros',      Icon: BookOpen     },
  { href: '/filmes',     label: 'Filmes',      Icon: Tv           },
  { href: '/desejos',    label: 'Desejos',     Icon: ShoppingCart },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email)
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : 'P'
  const displayName = 'Paloma'

  function NavItem({ href, label, Icon }: { href: string; label: string; Icon: any }) {
    const active = path === href
    return (
      <Link href={href} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 12px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        color: active ? '#ffffff' : 'rgba(255,255,255,0.4)',
        background: active ? '#7c3aed' : 'transparent',
        textDecoration: 'none',
        marginBottom: '3px',
        transition: 'all 0.15s ease',
        boxShadow: active ? '0 0 0 1px #9333ea, 0 4px 24px rgba(124,58,237,0.7)' : 'none',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}>
        <Icon
          size={16}
          strokeWidth={active ? 2 : 1.75}
          style={{ color: active ? '#fff' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}
        />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <aside style={{
      width: '210px',
      background: '#0f0f18',
      borderRight: '1px solid rgba(255,255,255,0.055)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      flexShrink: 0,
      minHeight: '100vh',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'hidden',
    }}>

      {/* ── Logo ────────────────────────────── */}
      <div style={{ padding: '4px 8px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <div style={{
            width: '28px', height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 16px rgba(139,92,246,0.55)',
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="7" cy="7" r="2" fill="white"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '16px', letterSpacing: '1.5px' }}>NEXORA</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '10px', letterSpacing: '0.5px', paddingLeft: '36px' }}>Personal OS</p>
      </div>

      {/* ── Nav principal ───────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_MAIN.map(item => <NavItem key={item.href} {...item} />)}
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.055)', margin: '12px 4px' }} />
        <p style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.14)', padding: '0 8px', marginBottom: '6px' }}>Pessoal</p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_PERSONAL.map(item => <NavItem key={item.href} {...item} />)}
        </div>
      </nav>

      {/* ── Perfil + Logout ──────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px', marginTop: '8px' }}>
        {/* Avatar + nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', marginBottom: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>Premium</p>
          </div>
        </div>

        {/* Botão sair */}
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: '8px 10px', borderRadius: '8px',
          background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.2)', fontSize: '12px', cursor: 'pointer',
          transition: 'color 0.15s',
        }}>
          <LogOut size={14} strokeWidth={1.75} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}

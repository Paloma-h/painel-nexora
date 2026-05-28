'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
} from 'lucide-react'

const NAV_MAIN = [
  { href: '/dashboard',  label: 'Dashboard',  Icon: LayoutDashboard },
  { href: '/agenda',     label: 'Agenda',      Icon: Calendar        },
  { href: '/pendencias', label: 'Pendências',  Icon: Zap             },
  { href: '/crm',        label: 'CRM',         Icon: Users           },
  { href: '/financeiro', label: 'Financeiro',  Icon: DollarSign      },
]

const NAV_PERSONAL = [
  { href: '/projetos',   label: 'Projetos',    Icon: FolderOpen  },
  { href: '/saude',      label: 'Saúde',       Icon: Heart       },
  { href: '/educacao',   label: 'Educação',    Icon: BookOpen    },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function NavItem({ href, label, Icon }: { href: string; label: string; Icon: any }) {
    const active = path === href
    return (
      <Link
        href={href}
        className={`nav-item ${active ? 'active' : ''}`}
      >
        <Icon size={16} strokeWidth={1.75} className="nav-icon" />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <aside style={{
      width: '200px',
      background: 'linear-gradient(180deg, #0d0d1c 0%, #0a0a14 100%)',
      borderRight: '1px solid rgba(255,255,255,0.055)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      flexShrink: 0,
      minHeight: '100vh',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>

      {/* ── Logo ────────────────────────────── */}
      <div style={{ padding: '4px 12px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          {/* Ícone geométrico */}
          <div style={{
            width: '26px', height: '26px',
            borderRadius: '7px',
            background: 'linear-gradient(135deg, #7c6ff7 0%, #5b50d6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(124,111,247,0.4)',
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="7" cy="7" r="2" fill="white"/>
            </svg>
          </div>
          <span style={{
            color: '#fff',
            fontWeight: 800,
            fontSize: '16px',
            letterSpacing: '1.5px',
          }}>NEXORA</span>
        </div>
        <p style={{
          color: 'rgba(255,255,255,0.18)',
          fontSize: '10px',
          letterSpacing: '0.5px',
          paddingLeft: '34px',
        }}>Personal OS</p>
      </div>

      {/* ── Nav principal ───────────────────── */}
      <nav style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_MAIN.map(item => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        {/* Divisor com label */}
        <div className="nav-divider" />
        <p className="nav-section-label">Pessoal</p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_PERSONAL.map(item => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* ── Logout ──────────────────────────── */}
      <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.055)' }}>
        <button onClick={logout} className="nav-item" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <LogOut size={15} strokeWidth={1.75} className="nav-icon" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}

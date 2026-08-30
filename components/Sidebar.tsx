'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Calendar, Zap, Users, DollarSign,
  FolderOpen, Heart, BookOpen, LogOut, Shield, Tv, ShoppingCart,
} from 'lucide-react'

const NAV_MAIN = [
  { href: '/dashboard',  label: 'Dashboard',     Icon: LayoutDashboard },
  { href: '/agenda',     label: 'Agenda',         Icon: Calendar        },
  { href: '/pendencias', label: 'Pendências',     Icon: Zap             },
  { href: '/crm',        label: 'CRM',            Icon: Users           },
  { href: '/financeiro', label: 'Financeiro',     Icon: DollarSign      },
]

const NAV_PERSONAL = [
  { href: '/dados',     label: 'Dados Pessoais', Icon: Shield     },
  { href: '/projetos',  label: 'Projetos',  Icon: FolderOpen   },
  { href: '/saude',     label: 'Saúde',     Icon: Heart        },
  { href: '/educacao',  label: 'Educação',  Icon: BookOpen     },
  { href: '/livros',    label: 'Livros',    Icon: BookOpen     },
  { href: '/filmes',    label: 'Filmes',    Icon: Tv           },
  { href: '/desejos',   label: 'Desejos',   Icon: ShoppingCart },
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
      <Link href={href} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '7px 12px', borderRadius: '8px', fontSize: '14px',
        fontWeight: active ? 800 : 600,
        color: active ? '#ffffff' : '#222',
        background: active ? '#7c3aed' : 'transparent',
        textDecoration: 'none', marginBottom: '1px',
        transition: 'all 0.15s ease',
        boxShadow: active ? '0 3px 12px rgba(124,58,237,0.35)' : 'none',
        border: active ? 'none' : '1px solid transparent',
      }}>
        <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? '#fff' : '#7c3aed', flexShrink: 0 }} />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <aside style={{
      width: '200px', background: '#ffffff',
      borderRight: '1px solid #e5e5ea',
      display: 'flex', flexDirection: 'column',
      padding: '12px 10px', flexShrink: 0,
      minHeight: '100vh', position: 'sticky',
      top: 0, height: '100vh', overflow: 'hidden',
    }}>
      <div style={{ padding: '2px 6px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 0 12px rgba(139,92,246,0.35)',
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="7" cy="7" r="2" fill="white"/>
            </svg>
          </div>
          <span style={{ color: '#1a1a2e', fontWeight: 800, fontSize: '16px', letterSpacing: '1.5px' }}>NEXORA</span>
        </div>
{/* subtítulo removido */}
      </div>

      <nav style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_MAIN.map(item => <NavItem key={item.href} {...item} />)}
        </div>
        <div style={{ height: '1px', background: '#e5e5ea', margin: '8px 4px' }} />
        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#aaa', padding: '0 8px', marginBottom: '4px' }}>Pessoal</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_PERSONAL.map(item => <NavItem key={item.href} {...item} />)}
        </div>
      </nav>

      <div style={{ borderTop: '1px solid #e5e5ea', paddingTop: '8px', marginTop: '4px' }}>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: '7px 10px', borderRadius: '8px',
          background: 'transparent', border: 'none',
          color: '#999', fontSize: '13px', cursor: 'pointer',
        }}>
          <LogOut size={15} strokeWidth={1.75} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}

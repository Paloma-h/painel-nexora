import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Meu Painel', description: 'Agenda, CRM e Financeiro' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#f5f5f7] text-white antialiased">{children}</body>
    </html>
  )
}

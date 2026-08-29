import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Meu Painel', description: 'Agenda, CRM e Financeiro' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#f5f5f7] text-[#1a1a2e] antialiased" style={{fontFamily:"'Nunito', system-ui, sans-serif"}}>{children}</body>
    </html>
  )
}

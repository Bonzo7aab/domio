import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '../components/ui/sonner'
import AuthProvider from '../contexts/AuthContext'
import { HeaderWrapper } from '../components/HeaderWrapper'
import { LayoutProvider } from '../components/ConditionalFooter'
import { GlobalCommandPaletteClient } from '../components/GlobalCommandPaletteClient'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Domio - Platforma dla Zarządców i Wykonawców',
  description: 'Platforma łącząca zarządców nieruchomości z wykwalifikowanymi wykonawcami',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: '/',
    siteName: 'Domio',
    title: 'Domio - Platforma dla Zarządców i Wykonawców',
    description: 'Platforma łącząca zarządców nieruchomości z wykwalifikowanymi wykonawcami',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Note: Next.js 15 enables React.StrictMode by default in development
// This causes useEffect to run twice and components to render twice
// This is NORMAL and helps catch bugs. It does NOT happen in production.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <AuthProvider>
          <LayoutProvider>
            <HeaderWrapper />
            <main className="min-h-[calc(100vh-10rem)]">
              {children}
            </main>
            <Toaster />
            <GlobalCommandPaletteClient />
          </LayoutProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

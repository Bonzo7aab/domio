import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Toaster } from '../components/ui/sonner'
import AuthProvider from '../contexts/AuthContext'
import { Header } from '../components/Header'
import { LayoutProvider } from '../components/ConditionalFooter'
import { FilterProvider } from '../contexts/FilterContext'
import { GlobalCommandPalette } from '../components/GlobalCommandPalette'
import { MobileMenuDock } from '../components/MobileMenuDock'
import { ServiceWorkerRegistration } from '../components/ServiceWorkerRegistration'
import { CookieConsentBanner } from '../components/CookieConsentBanner'

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
        <ServiceWorkerRegistration />
        <AuthProvider>
          <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Ładowanie...</p>
              </div>
            </div>
          }>
            <FilterProvider>
              <LayoutProvider>
                <Header />
                <main className="min-h-[calc(100vh-10rem)] pb-20 lg:pb-0">
                  {children}
                </main>
                <MobileMenuDock />
                <CookieConsentBanner />
                <Toaster />
                <GlobalCommandPalette />
              </LayoutProvider>
            </FilterProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  )
}

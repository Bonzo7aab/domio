'use client'

import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { X, Cookie } from 'lucide-react'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'cookie-consent'

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    // Only check in browser environment
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (!consent) {
        setShowBanner(true)
      }
    }
  }, [])

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
      setShowBanner(false)
    }
  }

  const handleDecline = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'declined')
      setShowBanner(false)
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2 md:p-3 pointer-events-none">
      <Card className="max-w-4xl mx-auto shadow-lg border-2 pointer-events-auto gap-1">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Cookie className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <CardTitle className="text-base">Pliki cookies</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Ta strona wykorzystuje pliki cookies
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={handleDecline}
              aria-label="Zamknij"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <p className="text-xs text-slate-600 leading-snug">
            Używamy plików cookies, aby zapewnić prawidłowe działanie platformy, 
            zapamiętać Twoje preferencje oraz analizować ruch na stronie. 
            Niektóre pliki cookies są niezbędne do działania platformy, inne wymagają Twojej zgody. 
            Więcej informacji znajdziesz w naszej{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline font-medium">
              Polityce prywatności
            </Link>.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            onClick={handleAccept}
            size="sm"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            Akceptuję wszystkie
          </Button>
          <Button
            onClick={handleDecline}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            Odrzuć nieistotne
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


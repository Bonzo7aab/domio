'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '../components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Coś poszło nie tak</h1>
      <p className="max-w-md text-muted-foreground">
        Wystąpił nieoczekiwany błąd. Spróbuj ponownie lub wróć na stronę główną.
      </p>
      <div className="flex gap-3">
        <Button type="button" onClick={() => reset()}>
          Spróbuj ponownie
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/">Strona główna</Link>
        </Button>
      </div>
    </div>
  )
}

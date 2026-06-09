'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle } from 'lucide-react'
import { createClient } from '../../../lib/supabase/client'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Alert, AlertDescription } from '../../../components/ui/alert'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków')
      return
    }
    if (password !== confirm) {
      setError('Hasła nie są identyczne')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Sesja wygasła lub link jest nieprawidłowy. Poproś o nowy link resetujący.')
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      await supabase.auth.signOut({ scope: 'local' })
      setTimeout(() => router.push('/logowanie'), 2000)
    } catch {
      setError('Wystąpił błąd podczas ustawiania hasła')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <CardTitle>Hasło zostało zmienione</CardTitle>
            <CardDescription>Za chwilę przekierujemy Cię na stronę logowania.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/logowanie">Przejdź do logowania</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Ustaw nowe hasło</CardTitle>
          </div>
          <CardDescription>Wpisz nowe hasło do konta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="new-pw">Nowe hasło</Label>
              <Input
                id="new-pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Potwierdź hasło</Label>
              <Input
                id="confirm-pw"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Zapisywanie…' : 'Zapisz hasło'}
            </Button>
            <Button variant="link" asChild className="w-full">
              <Link href="/logowanie">Powrót do logowania</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, MapPin, MessageSquare, BadgeCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { loginAction } from '../lib/auth/actions';
import { useUserProfile } from '../contexts/AuthContext';
import { sanitizeRedirectPath } from '../lib/auth/redirectPath';
import {
  AuthFormPanel,
  AuthPageLayout,
  authFieldClassName,
} from './auth/AuthPageLayout';

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useUserProfile();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(searchParams?.get('error') ?? null);
  const [message, setMessage] = useState<string | null>(searchParams?.get('message') ?? null);

  const redirectTo = sanitizeRedirectPath(searchParams?.get('redirectTo'), '/');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);

      if ('error' in result) {
        setError(result.error);
      } else {
        await refreshSession();
        router.refresh();
        const target = result.redirectTo || redirectTo;
        setTimeout(() => {
          router.push(target);
        }, 100);
      }
    });
  };

  return (
    <AuthPageLayout
      testId="login-page"
      title="Zaloguj się"
      subtitle="Wróć do zleceń i wiadomości na swoim koncie."
      side={{
        heading: 'Platforma dla zarządców i wykonawców',
        body: 'Przeglądaj zlecenia na mapie, składaj oferty i zarządzaj współpracą w jednym miejscu.',
        features: [
          {
            icon: MapPin,
            title: 'Zlecenia i przetargi w Warszawie',
            description: 'Filtruj po dzielnicy, kategorii i budżecie na mapie.',
          },
          {
            icon: MessageSquare,
            title: 'Bezpieczna komunikacja',
            description: 'Wiadomości i oferty w jednym panelu konta.',
          },
          {
            icon: BadgeCheck,
            title: 'Profil i weryfikacja wykonawców',
            description: 'Dokumenty i uprawnienia — przejrzysty status weryfikacji.',
          },
        ],
      }}
      footer={
        <>
          Nie masz konta?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Zarejestruj się
          </Link>
        </>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="mb-4 border-emerald-500/30 bg-emerald-500/5">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <AuthFormPanel>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Adres email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="twoj@email.pl"
                className={`pl-10 ${authFieldClassName}`}
                required
                disabled={isPending}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Hasło</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                Zapomniałeś hasła?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className={`pl-10 ${authFieldClassName}`}
                required
                disabled={isPending}
                autoComplete="current-password"
              />
            </div>
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo} />

          <Button type="submit" className="h-11 w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logowanie...
              </>
            ) : (
              <>
                Zaloguj się
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </AuthFormPanel>
    </AuthPageLayout>
  );
}

export default LoginPage;

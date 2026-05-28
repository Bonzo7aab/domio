import Link from 'next/link';
import type { ReactElement } from 'react';
import { Button } from '../components/ui/button';

/** App Router 404 boundary — avoid redirect() here (triggers Turbopack dev perf.measure bug). */
export default function NotFound(): ReactElement {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Nie znaleziono strony</h1>
      <p className="mt-2 text-muted-foreground max-w-md">
        Adres może być nieprawidłowy lub strona została przeniesiona.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Wróć na stronę główną</Link>
      </Button>
    </main>
  );
}

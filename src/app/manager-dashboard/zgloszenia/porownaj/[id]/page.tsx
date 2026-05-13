import { Suspense } from 'react';
import { Card, CardContent } from '../../../../../components/ui/card';
import { ManagerPorownajPageClient } from './ManagerPorownajPageClient';

function CompareFallback(): React.ReactElement {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Card>
        <CardContent className="pt-6 flex items-center justify-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          Ładowanie…
        </CardContent>
      </Card>
    </div>
  );
}

export default function PorownajOfertyPage(): React.ReactElement {
  return (
    <Suspense fallback={<CompareFallback />}>
      <ManagerPorownajPageClient />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../ui/utils';
import type { ManagerReviewListItem } from '../../lib/database/manager-reviews';

interface ReviewReceived {
  id: string;
  reviewerName: string;
  reviewerType: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

interface ManagerRatingsOcenaContentProps {
  written: ManagerReviewListItem[];
  received: ReviewReceived[];
}

export function ManagerRatingsOcenaContent({
  written,
  received,
}: ManagerRatingsOcenaContentProps): React.ReactElement {
  const [sub, setSub] = useState<'wystaw' | 'otrzymane'>('wystaw');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ocena Zgłoszeń</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Opinie wystawione przez Ciebie oraz oceny Twojej organizacji.
        </p>
      </div>

      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setSub('wystaw')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            sub === 'wystaw'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          Wystawione
        </button>
        <button
          type="button"
          onClick={() => setSub('otrzymane')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            sub === 'otrzymane'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          Otrzymane
        </button>
      </div>

      {sub === 'wystaw' ? (
        <div className="space-y-3">
          {written.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Brak wystawionych opinii.
              </CardContent>
            </Card>
          ) : (
            written.map((w) => (
              <Card key={w.id}>
                <CardContent className="py-4 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{w.counterpartyName}</span>
                    <span className="text-amber-600 font-semibold">★ {w.rating.toFixed(1)}</span>
                  </div>
                  {w.title && <p className="text-sm font-medium">{w.title}</p>}
                  {w.comment && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{w.comment}</p>}
                  {w.imageUrls && w.imageUrls.length > 0 && (
                    <p className="text-xs text-muted-foreground">{w.imageUrls.length} zdjęć w opinii</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(w.createdAt).toLocaleDateString('pl-PL')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {received.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Brak otrzymanych ocen.
              </CardContent>
            </Card>
          ) : (
            received.map((r) => (
              <Card key={r.id}>
                <CardContent className="py-4 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{r.reviewerName}</span>
                    <span className="text-amber-600 font-semibold">★ {r.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.reviewerType === 'manager' ? 'Zarządca' : 'Wykonawca'}
                  </p>
                  {r.title && <p className="text-sm font-medium">{r.title}</p>}
                  {r.comment && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('pl-PL')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

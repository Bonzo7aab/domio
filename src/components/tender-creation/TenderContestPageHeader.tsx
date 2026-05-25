'use client';

import React from 'react';
import { ArrowLeft, Gavel } from 'lucide-react';
import { Badge } from '../ui/badge';

interface TenderContestPageHeaderProps {
  onBack: () => void;
  backLabel?: string;
  title?: string;
  subtitle?: string;
}

export function TenderContestPageHeader({
  onBack,
  backLabel = 'Moje zgłoszenia',
  title = 'Nowy konkurs ofert',
  subtitle = 'Uzupełnij zakres, terminy składania ofert i wymagania formalne. Zapisz jako szkic lub opublikuj od razu.',
}: TenderContestPageHeaderProps): React.ReactElement {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-5">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {backLabel}
          </button>

          <div className="flex gap-3 sm:gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12"
                aria-hidden
              >
                <Gavel className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {title}
                  </h1>
                  <Badge variant="outline" className="font-normal text-xs">
                    Formalny konkurs
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
              </div>
            </div>
        </div>
      </div>
    </header>
  );
}

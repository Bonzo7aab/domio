'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import type { ReactElement } from 'react';
import type { ContestInfo } from '../../types/job';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ContestOfferStepOverviewProps {
  description: string;
  category?: string;
  subcategory?: string;
  contestInfo: ContestInfo;
}

export function ContestOfferStepOverview({
  description,
  category,
  subcategory,
  contestInfo,
}: ContestOfferStepOverviewProps): ReactElement {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Opis konkursu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Szczegóły ogłoszenia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {category ? (
            <div>
              <div className="text-xs text-muted-foreground">Kategoria</div>
              <div className="font-medium text-sm">{category}</div>
            </div>
          ) : null}
          {subcategory ? (
            <div>
              <div className="text-xs text-muted-foreground">Podkategoria</div>
              <div className="font-medium text-sm">{subcategory}</div>
            </div>
          ) : null}
          {contestInfo.buildingName ? (
            <div>
              <div className="text-xs text-muted-foreground">Nieruchomość</div>
              <div className="font-medium text-sm">{contestInfo.buildingName}</div>
            </div>
          ) : null}
          {contestInfo.buildingAddress ? (
            <div>
              <div className="text-xs text-muted-foreground">Adres</div>
              <div className="font-medium text-sm">{contestInfo.buildingAddress}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {contestInfo.documents.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dokumentacja konkursu</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {contestInfo.documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {doc.url ? (
                    <Link
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {doc.name}
                    </Link>
                  ) : (
                    <span>{doc.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

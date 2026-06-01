'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AdminUserNotes } from './AdminUserNotes';

interface AdminNote {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
}

interface AdminNotesCollapsibleSectionProps {
  subjectUserId: string;
  notes: AdminNote[];
}

export function AdminNotesCollapsibleSection({
  subjectUserId,
  notes,
}: AdminNotesCollapsibleSectionProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const syncFromHash = (): void => {
      if (window.location.hash === '#admin-notes') {
        setOpen(true);
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  return (
    <Card id="admin-notes" className="scroll-mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="admin-notes-content"
            aria-label={open ? 'Zwiń notatki wewnętrzne' : 'Rozwiń notatki wewnętrzne'}
          >
            {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
          <CardTitle className="text-base">Notatki wewnętrzne</CardTitle>
          {notes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notes.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      {open && (
        <CardContent id="admin-notes-content">
          <AdminUserNotes subjectUserId={subjectUserId} notes={notes} variant="section" />
        </CardContent>
      )}
    </Card>
  );
}

'use client';

import React from 'react';
import { StickyNote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { addAdminNoteAction } from '../../app/admin/actions';

interface AdminNote {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
}

interface AdminUserNotesProps {
  subjectUserId: string;
  notes: AdminNote[];
  /** Full section at page bottom (all notes visible). */
  variant?: 'compact' | 'section';
}

const RECENT_HIGHLIGHT_MS = 8000;

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

function NoteItem({ note, isRecent = false }: { note: AdminNote; isRecent?: boolean }) {
  const recentClasses = isRecent
    ? 'border-amber-400/70 bg-amber-100/80 ring-1 ring-amber-300/60'
    : 'border-amber-200/70 bg-amber-50/80';

  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm transition-colors duration-700 ease-out ${recentClasses}`}
    >
      <p className="mb-1 text-[11px] text-amber-900/70">{formatDate(note.created_at)}</p>
      <p className="whitespace-pre-wrap text-amber-950/90">{note.body}</p>
    </div>
  );
}

export function AdminUserNotes({ subjectUserId, notes, variant = 'compact' }: AdminUserNotesProps) {
  const router = useRouter();
  const [body, setBody] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [recentIds, setRecentIds] = React.useState<Set<string>>(() => new Set());

  const markRecent = React.useCallback((id: string) => {
    setRecentIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setRecentIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, RECENT_HIGHLIGHT_MS);
  }, []);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await addAdminNoteAction(subjectUserId, body);
      if (!res.ok) {
        toast.error(res.error ?? 'Nie zapisano notatki');
        return;
      }
      toast.success('Notatka zapisana');
      setBody('');
      if (res.id) markRecent(res.id);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const sorted = React.useMemo(
    () => [...notes].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [notes]
  );

  if (variant === 'section') {
    return (
      <div className="space-y-4">
        <div className="space-y-2 rounded-md border bg-background p-4">
          <Label htmlFor="adminNoteInput" className="text-sm font-medium">
            Dodaj notatkę wewnętrzną
          </Label>
          <Textarea
            id="adminNoteInput"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Treść notatki widocznej tylko dla administratorów…"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy || body.trim().length === 0}
            onClick={submit}
          >
            Dodaj notatkę
          </Button>
        </div>

        {sorted.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StickyNote className="h-4 w-4" />
            Brak notatek dla tego użytkownika.
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((n) => (
              <NoteItem key={n.id} note={n} isRecent={recentIds.has(n.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Legacy compact variant (collapsed preview) — kept for reuse elsewhere if needed.
  const newest = sorted[0];
  return (
    <div className="space-y-2">
      {newest ? (
        <NoteItem note={newest} isRecent={recentIds.has(newest.id)} />
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StickyNote className="h-3.5 w-3.5" />
          Brak notatek.
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { ChevronDown, StickyNote } from 'lucide-react';
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
}

const RECENT_HIGHLIGHT_MS = 8000;

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

interface NoteItemProps {
  note: AdminNote;
  isRecent?: boolean;
}

/**
 * Single-line slim note row. Uses a soft amber palette by default and a
 * brighter amber tint with a subtle ring when freshly added (fades back
 * after `RECENT_HIGHLIGHT_MS`). The full body is exposed via the row's
 * native tooltip when truncated.
 */
function NoteItem({ note, isRecent = false }: NoteItemProps) {
  const firstLine = note.body.split('\n')[0] ?? note.body;
  const recentClasses = isRecent
    ? 'border-amber-400/70 bg-amber-100/80 ring-1 ring-amber-300/60'
    : 'border-amber-200/70 bg-amber-50/80';
  return (
    <div
      className={`rounded-md border px-2 py-1 text-sm transition-colors duration-700 ease-out ${recentClasses}`}
      title={note.body}
    >
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-[11px] text-amber-900/70">
          {formatDate(note.created_at)}
        </span>
        <span className="truncate text-xs text-amber-950/90">{firstLine}</span>
      </div>
    </div>
  );
}

export function AdminUserNotes({ subjectUserId, notes }: AdminUserNotesProps) {
  const router = useRouter();
  const [body, setBody] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [recentIds, setRecentIds] = React.useState<Set<string>>(() => new Set());
  const timeoutsRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  React.useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      for (const t of timeouts.values()) clearTimeout(t);
      timeouts.clear();
    };
  }, []);

  const markRecent = React.useCallback((id: string) => {
    setRecentIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const existing = timeoutsRef.current.get(id);
    if (existing) clearTimeout(existing);
    const handle = setTimeout(() => {
      setRecentIds(prev => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      timeoutsRef.current.delete(id);
    }, RECENT_HIGHLIGHT_MS);
    timeoutsRef.current.set(id, handle);
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
  const newest = sorted[0];
  const rest = sorted.slice(1);

  const triggerLabel = open
    ? 'Ukryj'
    : rest.length > 0
      ? `Dodaj notatkę / pokaż wcześniejsze (${rest.length})`
      : 'Dodaj notatkę';

  return (
    <div className="space-y-2">
      {/* Add-note form pinned to the top when the section is expanded. */}
      {open && (
        <div className="space-y-2 rounded-md border bg-background p-3">
          <Label
            htmlFor="adminNoteInput"
            className="text-xs uppercase tracking-wide text-muted-foreground"
          >
            Dodaj notatkę wewnętrzną
          </Label>
          <Textarea
            id="adminNoteInput"
            value={body}
            onChange={e => setBody(e.target.value)}
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
      )}

      {newest ? (
        <NoteItem note={newest} isRecent={recentIds.has(newest.id)} />
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StickyNote className="h-3.5 w-3.5" />
          Brak notatek.
        </div>
      )}

      {open && rest.length > 0 && (
        <div className="space-y-2">
          {rest.map(n => (
            <NoteItem key={n.id} note={n} isRecent={recentIds.has(n.id)} />
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        className="h-7 w-full justify-center gap-1 text-xs"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
        {triggerLabel}
      </Button>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquarePlus, Pencil, Send } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import {
  addContestQuestionComment,
  fetchContestQuestionsForManager,
  formatPostgrestError,
  updateContestQuestionComment,
  type ContestQuestionComment,
  type ContestQuestionManagerRow,
} from '../../lib/database/questions';
import { useUserProfile } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';

interface ManagerContestQuestionsPanelProps {
  contestId: string;
  onQuestionsChange?: (pendingCount: number) => void;
}

function formatManagerTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function ManagerCommentsBlock({
  comments,
  currentUserId,
  onUpdated,
}: {
  comments: ContestQuestionComment[];
  currentUserId: string | undefined;
  onUpdated: () => Promise<void>;
}): React.ReactElement {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  if (comments.length === 0) return <></>;

  const startEdit = (comment: ContestQuestionComment): void => {
    setEditingId(comment.id);
    setEditDraft(comment.body);
  };

  const saveEdit = async (commentId: string): Promise<void> => {
    const text = editDraft.trim();
    if (!text) {
      toast.error('Wpisz treść odpowiedzi');
      return;
    }
    setIsSavingEdit(true);
    const supabase = createClient();
    const result = await updateContestQuestionComment(supabase, commentId, text);
    setIsSavingEdit(false);
    if (!result.success) {
      const message =
        result.error instanceof Error
          ? result.error.message
          : formatPostgrestError(result.error as Parameters<typeof formatPostgrestError>[0]);
      toast.error('Nie udało się zapisać zmian', { description: message });
      return;
    }
    toast.success('Odpowiedź została zaktualizowana');
    setEditingId(null);
    setEditDraft('');
    await onUpdated();
  };

  return (
    <div className="border-t border-border pt-3 space-y-3">
      <p className="text-xs font-medium text-primary">
        {comments.length === 1 ? 'Odpowiedź organizatora' : 'Odpowiedzi organizatora'}
      </p>
      {comments.map((comment, index) => {
        const canEdit =
          Boolean(currentUserId) &&
          comment.authorId === currentUserId &&
          !comment.id.startsWith('legacy-');
        const isEditing = editingId === comment.id;

        return (
          <div
            key={comment.id}
            className={index > 0 ? 'border-t border-border/60 pt-3' : undefined}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs text-muted-foreground">
                {comment.authorDisplayName ?? 'Organizator'} —{' '}
                {formatManagerTimestamp(comment.createdAt)}
              </p>
              {canEdit && !isEditing ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs shrink-0"
                  onClick={() => startEdit(comment)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edytuj
                </Button>
              ) : null}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  rows={3}
                  className="resize-none bg-background"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!editDraft.trim() || isSavingEdit}
                    onClick={() => void saveEdit(comment.id)}
                  >
                    Zapisz
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSavingEdit}
                    onClick={() => {
                      setEditingId(null);
                      setEditDraft('');
                    }}
                  >
                    Anuluj
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ManagerContestQuestionsPanel({
  contestId,
  onQuestionsChange,
}: ManagerContestQuestionsPanelProps): React.ReactElement {
  const { user } = useUserProfile();
  const [rows, setRows] = useState<ContestQuestionManagerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composingQuestionId, setComposingQuestionId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const supabase = createClient();
    const { data, error } = await fetchContestQuestionsForManager(supabase, contestId);
    if (error) {
      const message = formatPostgrestError(error);
      setLoadError(message);
      setRows([]);
      toast.error('Nie udało się wczytać pytań', { description: message });
    } else {
      setRows(data);
      onQuestionsChange?.(data.filter((r) => !r.answeredAt).length);
    }
    setLoading(false);
  }, [contestId, onQuestionsChange]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- load manager Q&A on mount / contest change */
    void loadQuestions();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loadQuestions]);

  const pending = rows.filter((r) => !r.answeredAt);
  const published = rows.filter((r) => r.answeredAt);

  const handleStartComment = (questionId: string) => {
    setComposingQuestionId(questionId);
    setCommentDrafts((prev) => ({ ...prev, [questionId]: prev[questionId] ?? '' }));
  };

  const handleCancelComment = () => {
    setComposingQuestionId(null);
  };

  const handleSubmitComment = async (questionId: string) => {
    const text = commentDrafts[questionId]?.trim() ?? '';
    if (!text) {
      toast.error('Wpisz treść komentarza');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const result = await addContestQuestionComment(supabase, questionId, text);
    setIsSubmitting(false);

    if (!result.success) {
      const message =
        result.error instanceof Error
          ? result.error.message
          : formatPostgrestError(result.error as Parameters<typeof formatPostgrestError>[0]);
      toast.error('Nie udało się dodać komentarza', { description: message });
      return;
    }

    const wasFirst = rows.find((r) => r.id === questionId && !r.answeredAt);
    toast.success(
      wasFirst
        ? 'Odpowiedź opublikowana — widoczna dla wszystkich wykonawców'
        : 'Komentarz został dodany',
    );
    setComposingQuestionId(null);
    setCommentDrafts((prev) => ({ ...prev, [questionId]: '' }));
    await loadQuestions();
  };

  const renderComposer = (row: ContestQuestionManagerRow, isPending: boolean) => {
    const isComposing = composingQuestionId === row.id;
    if (isComposing) {
      return (
        <div className="space-y-3 border-t border-amber-300/40 pt-3">
          <div className="space-y-2">
            <Label htmlFor={`manager-comment-${row.id}`}>
              {isPending ? 'Twoja odpowiedź' : 'Dodaj komentarz'}
            </Label>
            <Textarea
              id={`manager-comment-${row.id}`}
              value={commentDrafts[row.id] ?? ''}
              onChange={(e) =>
                setCommentDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
              }
              rows={4}
              className="resize-none bg-background"
              placeholder={
                isPending
                  ? 'Treść odpowiedzi widoczna publicznie dla wszystkich wykonawców…'
                  : 'Kolejny komentarz do tego pytania…'
              }
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Komentarz będzie widoczny publicznie dla wszystkich wykonawców.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void handleSubmitComment(row.id)}
              disabled={!(commentDrafts[row.id]?.trim()) || isSubmitting}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Wyślij
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelComment} disabled={isSubmitting}>
              Anuluj
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Button
        size="sm"
        variant={isPending ? 'default' : 'outline'}
        className="gap-1.5"
        onClick={() => handleStartComment(row.id)}
        disabled={composingQuestionId !== null && composingQuestionId !== row.id}
      >
        {isPending ? (
          'Odpowiedz'
        ) : (
          <>
            <MessageSquarePlus className="h-4 w-4" />
            Dodaj komentarz
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-6 min-h-[200px]">
      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Ładowanie pytań...</p>
      ) : (
        <>
          {pending.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                Oczekujące na odpowiedź
                <Badge variant="secondary">{pending.length}</Badge>
              </h4>
              {pending.map((row) => (
                <article
                  key={row.id}
                  className="rounded-lg border border-amber-300/50 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-3"
                >
                  <div className="text-sm">
                    <span className="font-medium">
                      {row.askerDisplayName}
                      {row.companyName ? ` z firmy ${row.companyName}` : ''}
                    </span>
                    <span className="text-muted-foreground"> pyta: </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{row.question}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatManagerTimestamp(row.createdAt)}
                  </p>
                  {renderComposer(row, true)}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Brak oczekujących pytań.</p>
          )}

          {published.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Opublikowane</h4>
              {published.map((row) => (
                <article
                  key={row.id}
                  className="rounded-lg border border-border bg-muted/20 p-4 space-y-3"
                >
                  <p className="text-sm">
                    <span className="font-medium">
                      {row.askerDisplayName}
                      {row.companyName ? ` (${row.companyName})` : ''}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}
                      — {formatManagerTimestamp(row.createdAt)}
                    </span>
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{row.question}</p>
                  <ManagerCommentsBlock
                    comments={row.comments}
                    currentUserId={user?.id}
                    onUpdated={loadQuestions}
                  />
                  {renderComposer(row, false)}
                </article>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

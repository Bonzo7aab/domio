'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquarePlus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import {
  addContestQuestionComment,
  fetchContestQuestionsForManager,
  formatPostgrestError,
  type ContestQuestionManagerRow,
} from '../../lib/database/questions';
import { ContestQuestionCommentsList } from '../contest-questions/ContestQuestionCommentsList';
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

export function ManagerContestQuestionsPanel({
  contestId,
  onQuestionsChange,
}: ManagerContestQuestionsPanelProps): React.ReactElement {
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
                  <ContestQuestionCommentsList comments={row.comments} variant="manager" />
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

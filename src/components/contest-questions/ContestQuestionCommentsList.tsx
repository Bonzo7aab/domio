'use client';

import type { ContestQuestionComment } from '../../lib/database/questions';

function formatCommentTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

interface ContestQuestionCommentsListProps {
  comments: ContestQuestionComment[];
  variant: 'contractor' | 'manager';
}

export function ContestQuestionCommentsList({
  comments,
  variant,
}: ContestQuestionCommentsListProps): React.ReactElement | null {
  if (comments.length === 0) return null;

  return (
    <div className="border-t border-border pt-3 space-y-3">
      <p className="text-xs font-medium text-primary">
        {comments.length === 1 ? 'Odpowiedź organizatora' : 'Odpowiedzi organizatora'}
      </p>
      {comments.map((comment, index) => (
        <div
          key={comment.id}
          className={index > 0 ? 'border-t border-border/60 pt-3' : undefined}
        >
          {variant === 'manager' && comment.authorDisplayName ? (
            <p className="text-xs text-muted-foreground mb-1">
              {comment.authorDisplayName} — {formatCommentTimestamp(comment.createdAt)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mb-1">
              Organizator ({formatCommentTimestamp(comment.createdAt)})
            </p>
          )}
          <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
        </div>
      ))}
    </div>
  );
}

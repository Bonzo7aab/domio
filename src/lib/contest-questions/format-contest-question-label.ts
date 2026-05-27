/**
 * OPD-70: Anonymous contractor-facing label for contest Q&A.
 */
export function formatContractorQuestionLabel(createdAtIso: string): string {
  const date = new Date(createdAtIso);
  if (Number.isNaN(date.getTime())) {
    return 'Pytanie od wykonawcy';
  }
  const formatted = new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return `Pytanie od wykonawcy (${formatted})`;
}

export function isContestQuestionsDeadlinePassed(
  submissionDeadlineIso: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!submissionDeadlineIso) return false;
  const deadline = new Date(submissionDeadlineIso);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() < now.getTime();
}

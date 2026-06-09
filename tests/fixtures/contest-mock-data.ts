export interface ContestMockData {
  title: string;
  description: string;
  submissionDeadline: Date;
  evaluationDeadline: Date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function buildContestMockData(): ContestMockData {
  const submissionDeadline = addDays(new Date(), 14);
  submissionDeadline.setHours(12, 0, 0, 0);

  const evaluationDeadline = addDays(submissionDeadline, 7);

  return {
    title: `E2E Konkurs Playwright ${Date.now()}`,
    description:
      'Zakres prac obejmuje remont klatki schodowej: naprawę posadzek, malowanie ścian oraz wymianę oświetlenia. Wykonawca zapewnia materiały zgodnie ze specyfikacją.',
    submissionDeadline,
    evaluationDeadline,
  };
}

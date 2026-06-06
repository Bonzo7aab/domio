import type { Job } from '../types/job';

export function formatContestLocation(
  location: Job['location'],
): string {
  if (typeof location === 'string') {
    return location;
  }
  if (location && typeof location === 'object' && 'city' in location) {
    if (location.sublocality_level_1) {
      return `${location.city || 'Unknown'}, ${location.sublocality_level_1}`;
    }
    return location.city || 'Unknown';
  }
  return 'Unknown';
}

export function formatContestSubmissionDeadline(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function resolveContestStatus(job: Partial<Job>): string {
  if (job.status) {
    return job.status;
  }

  const phase = job.tenderInfo?.currentPhase?.toLowerCase() ?? '';
  if (phase.includes('ocena') || phase.includes('evaluation')) {
    return 'evaluation';
  }
  if (phase.includes('rozstrzyg') || phase.includes('awarded')) {
    return 'awarded';
  }
  if (phase.includes('anulo') || phase.includes('cancel')) {
    return 'cancelled';
  }
  return 'active';
}

export function getContestSubmissionDeadline(job: Partial<Job>): string | null {
  return (
    job.contestInfo?.submissionDeadline
    ?? job.tenderInfo?.submissionDeadline
    ?? job.deadline
    ?? null
  );
}

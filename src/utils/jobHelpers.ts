import type { Job } from '../types/job';

/**
 * Check if a job is expired based on its deadline
 * @param job - Job object with optional deadline field
 * @returns True if job has a deadline and it's in the past (before today)
 */
export function isJobExpired(job: Job): boolean {
  // If no deadline, job is not expired
  if (!job.deadline) {
    return false;
  }

  try {
    // Parse deadline string to Date
    const deadlineDate = new Date(job.deadline);
    
    // Check if date is valid
    if (isNaN(deadlineDate.getTime())) {
      return false;
    }

    // Get today's date at midnight (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get deadline date at midnight (start of day)
    const deadlineAtMidnight = new Date(deadlineDate);
    deadlineAtMidnight.setHours(0, 0, 0, 0);

    // Job is expired if deadline is before today
    return deadlineAtMidnight < today;
  } catch (error) {
    // If parsing fails, treat as not expired
    console.error('Error parsing job deadline:', error);
    return false;
  }
}


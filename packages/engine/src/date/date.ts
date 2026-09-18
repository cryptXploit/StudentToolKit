/**
 * Calculates the exact number of days remaining from today to a target date.
 * Strips out time components to ensure deterministic day counts.
 */
export function calculateDaysRemaining(targetDateMs: number): number {
  const now = new Date();
  const target = new Date(targetDateMs);
  
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

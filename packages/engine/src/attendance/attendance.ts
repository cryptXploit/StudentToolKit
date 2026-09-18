import { z } from 'zod';

export const AttendanceSchema = z.object({
  attended: z.number().nonnegative(),
  total: z.number().positive(),
  targetPercentage: z.number().min(1).max(100),
});

export type AttendanceInput = z.infer<typeof AttendanceSchema>;

export interface AttendanceResult {
  currentPercentage: number;
  safeMisses: number;
  requiredClasses: number; // Number of consecutive classes to attend to reach target. -1 if impossible.
}

/**
 * Calculates current attendance, safe absences, and required consecutive classes.
 */
export function calculateAttendanceStatus(input: AttendanceInput): AttendanceResult {
  const parsed = AttendanceSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid attendance input: ${parsed.error.message}`);
  }

  const { attended, total, targetPercentage } = parsed.data;
  if (attended > total) {
    throw new Error('Attended classes cannot exceed total classes.');
  }

  const targetRatio = targetPercentage / 100;
  
  // Current percentage (rounded to 2 decimals)
  const currentPercentage = Math.round(((attended / total) * 100 + Number.EPSILON) * 100) / 100;

  // Safe Misses: How many more classes can we miss and still maintain >= targetRatio?
  // attended / (total + M) >= targetRatio  =>  M <= (attended / targetRatio) - total
  let safeMisses = 0;
  if (currentPercentage >= targetPercentage) {
     const maxTotalForTarget = Math.floor(attended / targetRatio);
     safeMisses = Math.max(0, maxTotalForTarget - total);
  }

  // Required Classes: How many consecutive classes must be attended to reach targetRatio?
  // (attended + R) / (total + R) >= targetRatio
  // R >= (targetRatio * total - attended) / (1 - targetRatio)
  let requiredClasses = 0;
  if (currentPercentage < targetPercentage) {
    if (targetPercentage === 100) {
      requiredClasses = -1; // Impossible to reach 100% if even 1 class is missed
    } else {
      const r = (targetRatio * total - attended) / (1 - targetRatio);
      requiredClasses = Math.max(0, Math.ceil(r));
    }
  }

  return {
    currentPercentage,
    safeMisses,
    requiredClasses,
  };
}

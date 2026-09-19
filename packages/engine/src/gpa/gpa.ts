import { z } from 'zod';

export const CourseRecordSchema = z.object({
  credits: z.number().positive(),
  gradePoint: z.number().min(0).max(4.0),
});

export type CourseRecord = z.infer<typeof CourseRecordSchema>;

/**
 * Calculates the GPA for a given set of courses.
 * @param courses Array of completed courses with credits and grade points.
 * @returns The calculated GPA rounded to 2 decimal places, or 0.00 if no credits.
 */
export function calculateSemesterGPA(courses: CourseRecord[]): number {
  if (!courses || courses.length === 0) return 0.00;

  let totalCredits = 0;
  let totalGradePoints = 0;

  for (const course of courses) {
    const parsed = CourseRecordSchema.safeParse(course);
    if (!parsed.success) {
      throw new Error(`Invalid course record: ${parsed.error.message}`);
    }
    totalCredits += course.credits;
    totalGradePoints += (course.credits * course.gradePoint);
  }

  if (totalCredits === 0) return 0.00;

  // Round to exactly 2 decimal places safely avoiding JS floating point quirks
  const gpa = totalGradePoints / totalCredits;
  return Math.round((gpa + Number.EPSILON) * 100) / 100;
}

export const SemesterRecordSchema = z.object({
  credit: z.number().positive(),
  gpa: z.number().min(0),
});

export type SemesterRecord = z.infer<typeof SemesterRecordSchema>;

/**
 * Calculates the Cumulative CGPA for a given set of semesters.
 * @param semesters Array of completed semesters with credits and gpa.
 * @returns The calculated CGPA rounded to 2 decimal places, or 0.00 if no credits.
 */
export function calculateCumulativeCGPA(semesters: SemesterRecord[]): number {
  if (!semesters || semesters.length === 0) return 0.00;

  let totalCredits = 0;
  let totalPoints = 0;

  for (const sem of semesters) {
    const parsed = SemesterRecordSchema.safeParse(sem);
    if (parsed.success) {
      totalCredits += sem.credit;
      totalPoints += (sem.credit * sem.gpa);
    }
  }

  if (totalCredits === 0) return 0.00;

  const cgpa = totalPoints / totalCredits;
  return Math.round((cgpa + Number.EPSILON) * 100) / 100;
}

export const TargetGPASchema = z.object({
  currentCGPA: z.number().min(0).max(5.0),
  currentCredits: z.number().nonnegative(),
  targetCGPA: z.number().min(0).max(5.0),
  remainingCredits: z.number().positive(),
  maxScale: z.number().positive().default(4.0),
});

export type TargetGPAInput = z.infer<typeof TargetGPASchema>;

export interface TargetGPAResult {
  requiredGPA: number;
  isPossible: boolean;
}

/**
 * Calculates the required GPA in remaining credits to achieve a target CGPA.
 */
export function calculateRequiredGPA(input: TargetGPAInput): TargetGPAResult {
  const parsed = TargetGPASchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid target GPA input: ${parsed.error.message}`);
  }

  const { currentCGPA, currentCredits, targetCGPA, remainingCredits, maxScale } = parsed.data;

  const currentPoints = currentCGPA * currentCredits;
  const totalTargetPoints = targetCGPA * (currentCredits + remainingCredits);
  const requiredPoints = totalTargetPoints - currentPoints;
  
  let requiredGPA = requiredPoints / remainingCredits;
  
  // Round to 2 decimal places safely
  requiredGPA = Math.round((requiredGPA + Number.EPSILON) * 100) / 100;
  
  return {
    requiredGPA,
    isPossible: requiredGPA <= maxScale && requiredGPA >= 0
  };
}

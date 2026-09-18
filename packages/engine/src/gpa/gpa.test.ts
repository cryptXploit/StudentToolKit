import { describe, it, expect } from 'vitest';
import { calculateSemesterGPA, calculateRequiredGPA } from './gpa';

describe('GPA Engine - calculateSemesterGPA', () => {
  it('should return 0.00 for empty course list', () => {
    expect(calculateSemesterGPA([])).toBe(0.00);
  });

  it('should correctly calculate a standard semester GPA', () => {
    const courses = [
      { credits: 3, gradePoint: 4.0 }, // A
      { credits: 3, gradePoint: 3.0 }, // B
      { credits: 2, gradePoint: 3.5 }, // A- / B+ equivalent
    ];
    // Total Credits: 8
    // Total Grade Points: (3*4) + (3*3) + (2*3.5) = 12 + 9 + 7 = 28
    // GPA: 28 / 8 = 3.50
    expect(calculateSemesterGPA(courses)).toBe(3.50);
  });

  it('should correctly round floating point calculations to 2 decimal places', () => {
    const courses = [
      { credits: 3, gradePoint: 3.67 }, // A-
      { credits: 3, gradePoint: 3.33 }, // B+
      { credits: 1, gradePoint: 4.00 }, // A
    ];
    // Total Credits: 7
    // Total Points: (3 * 3.67) + (3 * 3.33) + (1 * 4.0) = 11.01 + 9.99 + 4.0 = 25.0
    // GPA: 25.0 / 7 = 3.571428... -> 3.57
    expect(calculateSemesterGPA(courses)).toBe(3.57);
  });

  it('should throw an error for invalid negative credits', () => {
    expect(() => calculateSemesterGPA([{ credits: -3, gradePoint: 4.0 }])).toThrow();
  });
});

describe('GPA Engine - calculateRequiredGPA', () => {
  it('should calculate achievable required GPA', () => {
    const result = calculateRequiredGPA({
      currentCGPA: 3.12,
      currentCredits: 90,
      targetCGPA: 3.30,
      remainingCredits: 30,
      maxScale: 4.0
    });
    expect(result.requiredGPA).toBe(3.84);
    expect(result.isPossible).toBe(true);
  });

  it('should flag mathematically impossible targets', () => {
    const result = calculateRequiredGPA({
      currentCGPA: 2.50,
      currentCredits: 100,
      targetCGPA: 3.50,
      remainingCredits: 20,
      maxScale: 4.0
    });
    expect(result.requiredGPA).toBeGreaterThan(4.0);
    expect(result.isPossible).toBe(false);
  });
});

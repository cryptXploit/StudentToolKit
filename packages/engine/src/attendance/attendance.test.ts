import { describe, it, expect } from 'vitest';
import { calculateAttendanceStatus } from './attendance';

describe('Attendance Engine', () => {
  it('should calculate correctly when user is above target', () => {
    const result = calculateAttendanceStatus({
      attended: 15,
      total: 18,
      targetPercentage: 75
    });
    expect(result.currentPercentage).toBeCloseTo(83.33);
    expect(result.safeMisses).toBe(2); // 15/20 = 75%. (15 attended, out of 18+2=20 total).
    expect(result.requiredClasses).toBe(0);
  });

  it('should calculate correctly when user is below target', () => {
    const result = calculateAttendanceStatus({
      attended: 10,
      total: 15,
      targetPercentage: 75
    });
    // Currently 66.67%. Needs to reach 75%.
    // (10+R)/(15+R) >= 0.75 => 10+R >= 11.25 + 0.75R => 0.25R >= 1.25 => R = 5
    expect(result.currentPercentage).toBeCloseTo(66.67);
    expect(result.safeMisses).toBe(0);
    expect(result.requiredClasses).toBe(5);
  });

  it('should return -1 required classes if target is 100% and user missed a class', () => {
    const result = calculateAttendanceStatus({
      attended: 9,
      total: 10,
      targetPercentage: 100
    });
    expect(result.requiredClasses).toBe(-1);
  });

  it('should throw an error if attended > total', () => {
    expect(() => calculateAttendanceStatus({ attended: 5, total: 4, targetPercentage: 75 })).toThrow();
  });
});

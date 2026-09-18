import { describe, it, expect } from 'vitest';
import { calculateDaysRemaining } from './date';

describe('Date Engine', () => {
  it('should calculate 0 days for today', () => {
    const today = new Date().getTime();
    expect(calculateDaysRemaining(today)).toBe(0);
  });
  
  it('should return a negative number for past dates', () => {
    const yesterday = new Date(Date.now() - 86400000 * 2).getTime();
    expect(calculateDaysRemaining(yesterday)).toBeLessThan(0);
  });
});

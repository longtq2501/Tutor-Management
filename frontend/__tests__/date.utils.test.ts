import { describe, it, expect } from 'vitest';
import {
  generateLastNMonths,
  getCurrentMonth,
  formatMonthDisplay,
  parseMonthValue,
  getPreviousMonths,
} from '@/lib/utils/date';

describe('Date Utils', () => {
  describe('generateLastNMonths', () => {
    it('should generate 12 months by default', () => {
      const months = generateLastNMonths();
      expect(months).toHaveLength(12);
    });

    it('should generate correct number of months', () => {
      const months = generateLastNMonths(6);
      expect(months).toHaveLength(6);
    });

    it('should have correct format for each month', () => {
      const months = generateLastNMonths(1);
      const month = months[0];

      expect(month).toHaveProperty('value');
      expect(month).toHaveProperty('label');
      expect(month.value).toMatch(/^\d{4}-\d{2}$/);
      expect(month.label).toMatch(/^Tháng \d{2}\/\d{4}$/);
    });

    it('should include current month', () => {
      const months = generateLastNMonths(12);
      const currentMonth = getCurrentMonth();

      expect(months.map((m) => m.value)).toContain(currentMonth);
    });

    it('should return months in descending order', () => {
      const months = generateLastNMonths(12);
      const values = months.map((m) => m.value);

      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i] > values[i + 1]).toBe(true);
      }
    });
  });

  describe('getCurrentMonth', () => {
    it('should return YYYY-MM format', () => {
      const month = getCurrentMonth();
      expect(month).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should return current month', () => {
      const month = getCurrentMonth();
      const now = new Date();
      const expectedYear = now.getFullYear();
      const expectedMonth = String(now.getMonth() + 1).padStart(2, '0');

      expect(month).toBe(`${expectedYear}-${expectedMonth}`);
    });
  });

  describe('formatMonthDisplay', () => {
    it('should format YYYY-MM to Vietnamese format', () => {
      const formatted = formatMonthDisplay('2026-02');
      expect(formatted).toBe('Tháng 02/2026');
    });

    it('should handle single digit months', () => {
      const formatted = formatMonthDisplay('2026-01');
      expect(formatted).toBe('Tháng 01/2026');
    });

    it('should handle December', () => {
      const formatted = formatMonthDisplay('2025-12');
      expect(formatted).toBe('Tháng 12/2025');
    });
  });

  describe('parseMonthValue', () => {
    it('should parse YYYY-MM string correctly', () => {
      const { year, month } = parseMonthValue('2026-02');
      expect(year).toBe(2026);
      expect(month).toBe(2);
    });

    it('should handle single digit months', () => {
      const { year, month } = parseMonthValue('2026-01');
      expect(year).toBe(2026);
      expect(month).toBe(1);
    });

    it('should return numbers, not strings', () => {
      const { year, month } = parseMonthValue('2026-05');
      expect(typeof year).toBe('number');
      expect(typeof month).toBe('number');
    });
  });

  describe('getPreviousMonths', () => {
    it('should get previous N months', () => {
      const months = getPreviousMonths('2026-05', 3);
      expect(months).toHaveLength(3);
      expect(months[0]).toBe('2026-05');
      expect(months[1]).toBe('2026-04');
      expect(months[2]).toBe('2026-03');
    });

    it('should handle year boundary', () => {
      const months = getPreviousMonths('2026-02', 3);
      expect(months).toEqual(['2026-02', '2026-01', '2025-12']);
      expect(months).toContain('2025-12');
    });

    it('should return 3 months by default', () => {
      const months = getPreviousMonths('2026-05');
      expect(months).toHaveLength(3);
    });

    it('should handle January correctly', () => {
      const months = getPreviousMonths('2026-01', 2);
      expect(months[1]).toBe('2025-12');
    });
  });
});

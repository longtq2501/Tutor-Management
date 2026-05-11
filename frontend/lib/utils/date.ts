/**
 * Date utility functions for report generation
 * Follows Next.js 15 standards and TypeScript strict mode
 */

/**
 * Generate array of months for the last N months
 * @param months - Number of months to generate (default: 12)
 * @returns Array of { value: "YYYY-MM", label: "Tháng MM/YYYY" }
 */
export function generateLastNMonths(months: number = 12): Array<{ value: string; label: string }> {
  const result: Array<{ value: string; label: string }> = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthStr = String(month).padStart(2, '0');
    const value = `${year}-${monthStr}`;
    const label = `Tháng ${monthStr}/${year}`;

    result.push({ value, label });
  }

  return result;
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Format YYYY-MM to Vietnamese display format
 * @param value - Month string in YYYY-MM format
 * @returns Formatted string "Tháng MM/YYYY"
 */
export function formatMonthDisplay(value: string): string {
  const [year, month] = value.split('-');
  return `Tháng ${month}/${year}`;
}

/**
 * Parse YYYY-MM string to { year, month }
 */
export function parseMonthValue(value: string): { year: number; month: number } {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
}

/**
 * Get previous N months from a given date (including the given date)
 * Example: getPreviousMonths('2026-05', 3) returns ['2026-05', '2026-04', '2026-03']
 */
export function getPreviousMonths(
  fromDate: string, // YYYY-MM format
  count: number = 3,
): string[] {
  const { year, month } = parseMonthValue(fromDate);
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    let newMonth = month - i;
    let newYear = year;

    while (newMonth <= 0) {
      newMonth += 12;
      newYear -= 1;
    }

    const monthStr = String(newMonth).padStart(2, '0');
    result.push(`${newYear}-${monthStr}`);
  }

  return result;
}

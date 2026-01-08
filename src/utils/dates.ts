// ============================================
// DATE UTILITIES
// ============================================
// Helper functions for working with dates.
// These are "pure functions" - same input always
// gives same output, no side effects.
// ============================================

/**
 * Get today's date as a string (YYYY-MM-DD)
 * This format is good for using as object keys
 */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Convert any date to a string (YYYY-MM-DD)
 */
export function dateStr(date: Date | string): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/**
 * Get the start of the week (Monday) for a given date
 * Returns a new Date object set to Monday 00:00:00
 */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

/**
 * Get the start of the month for a given date
 */
export function startOfMonth(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

/**
 * Get the end of the month for a given date
 */
export function endOfMonth(date: Date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get an array of 7 dates for the current week (Mon-Sun)
 */
export function getWeekDays(date: Date = new Date()): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/**
 * Get all cells for a calendar month view
 * Includes padding days from previous/next month
 */
export function getMonthCells(date: Date): (Date | null)[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startWeekday = (monthStart.getDay() + 6) % 7; // Monday = 0
  const totalDays = monthEnd.getDate();

  const cells: (Date | null)[] = [];

  // Padding for days before month starts
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }

  // Days of the month
  for (let d = 1; d <= totalDays; d++) {
    const dat = new Date(monthStart);
    dat.setDate(d);
    cells.push(dat);
  }

  // Padding to complete the last week
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
): string {
  return date.toLocaleDateString(undefined, options);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return dateStr(date1) === dateStr(date2);
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return dateStr(date) === todayStr();
}

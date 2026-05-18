export const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" → Date(midnight UTC). Returns null on invalid format/value. */
export function parseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

/** Date → "YYYY-MM-DD" (UTC date part). */
export function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

/** date-only UTC midnight → Seoul 자정의 UTC instant. */
export function seoulDayStartUtc(d: Date): Date {
  return new Date(d.getTime() - SEOUL_OFFSET_MS);
}

export function seoulHour(d: Date): number {
  return new Date(d.getTime() + SEOUL_OFFSET_MS).getUTCHours();
}

export function seoulHourMinute(d: Date): { hour: number; minute: number } {
  const s = new Date(d.getTime() + SEOUL_OFFSET_MS);
  return { hour: s.getUTCHours(), minute: s.getUTCMinutes() };
}

/** UTC instant → calendar date in Seoul timezone (midnight UTC). */
export function toSeoulDate(d: Date): Date {
  const s = new Date(d.getTime() + SEOUL_OFFSET_MS);
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
}

/** Returns today's date-only Date in Seoul timezone. */
export function todaySeoulDate(): Date {
  const seoul = new Date(Date.now() + SEOUL_OFFSET_MS);
  return new Date(
    Date.UTC(seoul.getUTCFullYear(), seoul.getUTCMonth(), seoul.getUTCDate()),
  );
}

/** Returns the Monday-to-Sunday range of the current Seoul week. */
export function currentSeoulWeekRange(): { weekStart: Date; weekEnd: Date } {
  const seoul = new Date(Date.now() + SEOUL_OFFSET_MS);
  const dow = seoul.getUTCDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const weekStart = new Date(
    Date.UTC(
      seoul.getUTCFullYear(),
      seoul.getUTCMonth(),
      seoul.getUTCDate() - daysFromMonday,
    ),
  );
  return { weekStart, weekEnd: addDays(weekStart, 6) };
}

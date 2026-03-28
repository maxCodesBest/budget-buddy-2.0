/**
 * `weekAnchor` is the **last day** of the note week (UTC calendar).
 * Stored `weekStart` is that day minus 7 days (the first day), so the span is
 * 8 inclusive calendar dates from first through last (e.g. Mar 21–Mar 28).
 * Matches the frontend `lib/week.ts` implementation.
 */
export function weekFirstDayFromLastDayYmd(lastDayYmd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lastDayYmd.trim());
  if (!m) throw new Error('Invalid date');
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) throw new Error('Invalid date');
  const utc = Date.UTC(y, mo - 1, d);
  const firstUtc = utc - 7 * 86400000;
  const dt = new Date(firstUtc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * `weekAnchor` is the **Friday** (last day) of a Saturday–Friday week (UTC calendar).
 * Stored `weekStart` is that Friday minus 6 days (the Saturday that starts the week).
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
  const firstUtc = utc - 6 * 86400000;
  const dt = new Date(firstUtc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Calendar shift in UTC (e.g. -7 to move a stored `weekStart` one week earlier). */
export function shiftYmdByDays(ymd: string, deltaDays: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) throw new Error('Invalid date');
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) throw new Error('Invalid date');
  const utc = Date.UTC(y, mo - 1, d) + deltaDays * 86400000;
  const dt = new Date(utc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

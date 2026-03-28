/** `lastDayYmd` is the last day of the week; returns stored first day (UTC calendar). */
export function weekFirstDayFromLastDayYmd(lastDayYmd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lastDayYmd.trim());
  if (!m) throw new Error("Invalid date");
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) throw new Error("Invalid date");
  const utc = Date.UTC(y, mo - 1, d);
  const firstUtc = utc - 7 * 86400000;
  const dt = new Date(firstUtc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) throw new Error("Invalid date");
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

/** `weekStartYmd` is the first day; range runs through first + 7 days (UTC). */
export function weekRangeLabel(weekStartYmd: string): string {
  const { y, m, d } = parseYmd(weekStartYmd);
  const startMs = Date.UTC(y, m - 1, d);
  const endMs = startMs + 7 * 86400000;
  const end = new Date(endMs);
  const sy = y;
  const sm = m - 1;
  const sd = d;
  const ey = end.getUTCFullYear();
  const em = end.getUTCMonth();
  const ed = end.getUTCDate();
  if (sy === ey && sm === em) {
    return `${MONTHS[sm]} ${sd}–${ed}, ${sy}`;
  }
  if (sy === ey) {
    return `${MONTHS[sm]} ${sd} – ${MONTHS[em]} ${ed}, ${sy}`;
  }
  return `${MONTHS[sm]} ${sd}, ${sy} – ${MONTHS[em]} ${ed}, ${ey}`;
}

export function todayLocalYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

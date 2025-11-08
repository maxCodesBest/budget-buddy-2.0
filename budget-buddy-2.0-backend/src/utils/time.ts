export function parseTtlToSeconds(value?: string): number {
  if (!value) return 900; // default 15m
  const v = String(value).trim().toLowerCase();
  const num = Number(v);
  if (!Number.isNaN(num)) return num; // already seconds
  const match = v.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 900;
  const amount = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      return 900;
  }
}

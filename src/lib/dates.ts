import type { IsoDate } from "../../shared/entry";

export const TIME_ZONE = "Europe/Berlin";

export const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
export const MONTH_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
/** Indexed by JS getUTCDay(): 0 = Sonntag. */
export const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

/** Today's date as seen in Germany, independent of the visitor's device timezone. */
export function todayInGermany(now = new Date()): IsoDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** month is 0-based, day is 1-based. */
export const toIso = (year: number, month: number, day: number): IsoDate => `${year}-${pad2(month + 1)}-${pad2(day)}`;

export function parseIso(date: IsoDate): { year: number; month: number; day: number } {
  const [y, m, d] = date.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

export const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sonntag … 6 = Samstag. All date math runs in UTC so DST never shifts a day. */
export const weekday = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day)).getUTCDay();

/** ISO 8601 week number (weeks start on Monday, week 1 contains the first Thursday). */
export function isoWeek(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(year, month, day));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

const longFormat = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** e.g. "Mo., 26. Oktober 2026" */
export const formatLong = (date: IsoDate) => longFormat.format(new Date(`${date}T00:00:00Z`));

export function formatRange(start: IsoDate, end: IsoDate): string {
  return start === end ? formatLong(start) : `${formatLong(start)} – ${formatLong(end)}`;
}

// Shared between the React app and the Pages Functions API.

/** Calendar dates are plain ISO dates (YYYY-MM-DD) without time or timezone. */
export type IsoDate = string;

export interface Entry {
  id: string;
  name: string;
  color: EntryColorId;
  start: IsoDate; // inclusive
  end: IsoDate; // inclusive
}

export type EntryInput = Omit<Entry, "id">;

/** Preset palette for entries. Ids are stored in the DB, so keep them stable. */
export const ENTRY_COLORS = [
  { id: "terracotta", label: "Terrakotta", hex: "#C2643F", text: "#FFFFFF" },
  { id: "ochre", label: "Ocker", hex: "#D9A441", text: "#3A2A10" },
  { id: "olive", label: "Olive", hex: "#8F9A4A", text: "#FFFFFF" },
  { id: "sage", label: "Salbei", hex: "#6F9A7A", text: "#FFFFFF" },
  { id: "teal", label: "Petrol", hex: "#3E7C80", text: "#FFFFFF" },
  { id: "dusk", label: "Taubenblau", hex: "#5E7FA8", text: "#FFFFFF" },
  { id: "plum", label: "Pflaume", hex: "#8C5A80", text: "#FFFFFF" },
  { id: "rose", label: "Rosé", hex: "#CF7E7A", text: "#FFFFFF" },
] as const;

export type EntryColorId = (typeof ENTRY_COLORS)[number]["id"];

/** One-tap event names offered above the custom name field, each with its own color. */
export const ENTRY_PRESETS = [
  { name: "Gate", color: "dusk" },
  { name: "Nat", color: "plum" },
] as const satisfies readonly { name: string; color: EntryColorId }[];

export const NAME_MAX_LENGTH = 80;
/** Upper bound for a single entry, mostly to keep junk out of the public DB. */
export const MAX_RANGE_DAYS = 366;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function dayCount(start: IsoDate, end: IsoDate): number {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

/** Returns a cleaned entry or a German error message for the UI. */
export function validateEntryInput(raw: unknown): { ok: true; value: EntryInput } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Ungültige Daten." };
  const { name, color, start, end } = raw as Record<string, unknown>;

  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) return { ok: false, error: "Bitte einen Namen eingeben." };
  if (trimmed.length > NAME_MAX_LENGTH) return { ok: false, error: `Der Name darf höchstens ${NAME_MAX_LENGTH} Zeichen lang sein.` };

  if (!ENTRY_COLORS.some((c) => c.id === color)) return { ok: false, error: "Bitte eine Farbe wählen." };
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return { ok: false, error: "Bitte gültige Daten wählen." };
  if (end < start) return { ok: false, error: "Das Enddatum liegt vor dem Startdatum." };
  if (dayCount(start, end) > MAX_RANGE_DAYS) return { ok: false, error: `Ein Eintrag darf höchstens ${MAX_RANGE_DAYS} Tage umfassen.` };

  return { ok: true, value: { name: trimmed, color: color as EntryColorId, start, end } };
}

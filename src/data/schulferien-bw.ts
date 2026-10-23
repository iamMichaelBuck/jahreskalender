import type { IsoDate } from "../../shared/entry";

export interface SchoolHoliday {
  name: string;
  start: IsoDate; // inclusive
  end: IsoDate; // inclusive
}

/**
 * Schulferien Baden-Württemberg.
 *
 * Source: Kultusministerium Baden-Württemberg, "Ferientermine"
 * (https://km.baden-wuerttemberg.de/de/service/ferien), checked 2026-10-23.
 * The 2025/26 dates (except Sommerferien) come from kalenderpedia.de, which mirrors the KM list.
 *
 * Notes:
 * - The KM lists Gründonnerstag 2027 and 2028 as a separate schulfrei day. Together with
 *   Karfreitag and Ostermontag that makes one continuous break, so it is folded into the range.
 * - Reformationstag 2026 (31.10.) is schulfrei and falls on the Saturday after the Herbstferien.
 * - Bewegliche Ferientage and Faschingsferien are set per school and therefore not listed.
 *
 * Update this list when the KM publishes new school years.
 */
export const SCHULFERIEN_BW: SchoolHoliday[] = [
  { name: "Weihnachtsferien", start: "2025-12-22", end: "2026-01-05" },
  { name: "Osterferien", start: "2026-03-30", end: "2026-04-11" },
  { name: "Pfingstferien", start: "2026-05-26", end: "2026-06-05" },
  { name: "Sommerferien", start: "2026-07-30", end: "2026-09-12" },
  { name: "Herbstferien", start: "2026-10-26", end: "2026-10-31" },
  { name: "Weihnachtsferien", start: "2026-12-23", end: "2027-01-09" },
  { name: "Osterferien", start: "2027-03-25", end: "2027-04-03" },
  { name: "Pfingstferien", start: "2027-05-18", end: "2027-05-29" },
  { name: "Sommerferien", start: "2027-07-29", end: "2027-09-11" },
  { name: "Herbstferien", start: "2027-11-02", end: "2027-11-06" },
  { name: "Weihnachtsferien", start: "2027-12-23", end: "2028-01-08" },
  { name: "Osterferien", start: "2028-04-13", end: "2028-04-22" },
  { name: "Pfingstferien", start: "2028-06-06", end: "2028-06-17" },
  { name: "Sommerferien", start: "2028-07-27", end: "2028-09-09" },
  { name: "Herbstferien", start: "2028-10-30", end: "2028-11-03" },
  { name: "Weihnachtsferien", start: "2028-12-23", end: "2029-01-05" },
];

export function holidayOn(date: IsoDate): SchoolHoliday | undefined {
  return SCHULFERIEN_BW.find((h) => h.start <= date && date <= h.end);
}

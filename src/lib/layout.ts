import type { Entry } from "../../shared/entry";
import { daysInMonth, parseIso, toIso } from "./dates";

export interface MonthBar {
  entry: Entry;
  /** 1-based first and last day of the bar inside this month. */
  fromDay: number;
  toDay: number;
  /** True when the entry really starts/ends here (not cut off at the month border). */
  startsHere: boolean;
  endsHere: boolean;
  lane: number;
}

/**
 * Clips entries to one month and assigns each one a lane (side-by-side column)
 * so overlapping entries never cover each other. Greedy interval packing:
 * longest-first within the same start day keeps long bars in stable lanes.
 */
export function layoutMonth(entries: Entry[], year: number, month: number): { bars: MonthBar[]; laneCount: number } {
  const first = toIso(year, month, 1);
  const last = toIso(year, month, daysInMonth(year, month));

  const clipped = entries
    .filter((e) => e.start <= last && e.end >= first)
    .map((entry) => {
      const startsHere = entry.start >= first;
      const endsHere = entry.end <= last;
      return {
        entry,
        startsHere,
        endsHere,
        fromDay: startsHere ? parseIso(entry.start).day : 1,
        toDay: endsHere ? parseIso(entry.end).day : daysInMonth(year, month),
      };
    })
    .sort((a, b) => a.fromDay - b.fromDay || b.toDay - a.toDay || a.entry.id.localeCompare(b.entry.id));

  const laneEnds: number[] = []; // last occupied day per lane
  const bars: MonthBar[] = clipped.map((bar) => {
    let lane = laneEnds.findIndex((end) => end < bar.fromDay);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = bar.toDay;
    return { ...bar, lane };
  });

  return { bars, laneCount: laneEnds.length };
}

import { memo, useMemo, type CSSProperties } from "react";
import { ENTRY_COLORS, type Entry, type IsoDate } from "../../shared/entry";
import { holidayOn } from "../data/schulferien-bw";
import { MONTH_NAMES, WEEKDAY_SHORT, daysInMonth, toIso, weekday } from "../lib/dates";
import { layoutMonth } from "../lib/layout";

const ROWS = 31;
const colorOf = (id: string) => ENTRY_COLORS.find((c) => c.id === id) ?? ENTRY_COLORS[0];

interface Props {
  year: number;
  month: number;
  today: IsoDate;
  entries: Entry[];
  onDayClick: (date: IsoDate) => void;
  onEntryClick: (entry: Entry) => void;
}

export const MonthColumn = memo(function MonthColumn({ year, month, today, entries, onDayClick, onEntryClick }: Props) {
  const length = daysInMonth(year, month);
  const { bars, laneCount } = useMemo(() => layoutMonth(entries, year, month), [entries, year, month]);

  const cells = [];
  for (let day = 1; day <= ROWS; day++) {
    if (day > length) {
      cells.push(<div key={day} className="day day--void" aria-hidden="true" />);
      continue;
    }
    const date = toIso(year, month, day);
    const wd = weekday(year, month, day);
    const holiday = holidayOn(date);
    // Show the holiday name on its first day in this month.
    const holidayLabel = holiday && (holiday.start === date || day === 1) ? holiday.name : null;
    const classes = [
      "day",
      wd === 0 || wd === 6 ? "day--weekend" : "",
      wd === 1 ? "day--monday" : "",
      holiday ? "day--holiday" : "",
      date === today ? "day--today" : "",
    ].join(" ");

    cells.push(
      <button
        key={day}
        type="button"
        className={classes}
        data-date={date}
        onClick={() => onDayClick(date)}
        aria-label={`${day}. ${MONTH_NAMES[month]}${holiday ? `, ${holiday.name}` : ""} – neuer Eintrag`}
      >
        <span className="day__num">{day}</span>
        <span className="day__wd">{WEEKDAY_SHORT[wd]}</span>
        {holidayLabel && <span className="day__holiday">{holidayLabel}</span>}
      </button>,
    );
  }

  return (
    <section className="month" aria-label={`${MONTH_NAMES[month]} ${year}`} data-month={month}>
      <h2 className="month__title">{MONTH_NAMES[month]}</h2>
      <div className="month__body">
        {cells}
        <div className="bars" style={{ "--lanes": Math.max(laneCount, 1) } as CSSProperties}>
          {bars.map((bar) => {
            const color = colorOf(bar.entry.color);
            return (
              <button
                key={bar.entry.id}
                type="button"
                className={`bar${bar.startsHere ? " bar--start" : ""}${bar.endsHere ? " bar--end" : ""}`}
                style={
                  {
                    "--from": bar.fromDay - 1,
                    "--span": bar.toDay - bar.fromDay + 1,
                    "--lane": bar.lane,
                    "--bar-bg": color.hex,
                    "--bar-ink": color.text,
                  } as CSSProperties
                }
                onClick={() => onEntryClick(bar.entry)}
                aria-label={`${bar.entry.name} – Details`}
              >
                <span className="bar__label">{bar.entry.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

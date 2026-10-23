import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { Entry, EntryInput, IsoDate } from "../shared/entry";
import { EntryDetails } from "./components/EntryDetails";
import { EntryForm } from "./components/EntryForm";
import { MonthColumn } from "./components/MonthColumn";
import { Sheet } from "./components/Sheet";
import { YearPicker } from "./components/YearPicker";
import { parseIso, todayInGermany } from "./lib/dates";
import { useDragScroll } from "./lib/useDragScroll";
import { useEntries } from "./lib/useEntries";

const FIRST_YEAR = 2026;
const MIN_LAST_YEAR = 2028;
const MONTHS = Array.from({ length: 12 }, (_, i) => i);
const DAY_ROWS = 31;
const MIN_ROW_HEIGHT = 20;
/** Rows at least this tall have room for the Schulferien label under the day number. */
const ROOMY_ROW_HEIGHT = 30;

type Panel =
  | { kind: "create"; initial: EntryInput }
  | { kind: "view"; entry: Entry }
  | { kind: "edit"; entry: Entry }
  | null;

function useToday(): IsoDate {
  const [today, setToday] = useState(todayInGermany);
  useEffect(() => {
    const id = setInterval(() => setToday(todayInGermany()), 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

export function App() {
  const today = useToday();
  const current = parseIso(today);
  const lastYear = Math.max(MIN_LAST_YEAR, current.year);
  const years = Array.from({ length: lastYear - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

  // All years run as one continuous row of months: Dezember 2026 is followed by Januar 2027.
  const timeline = useMemo(
    () => years.flatMap((year) => MONTHS.map((month) => ({ year, month }))),
    // `years` is derived from `lastYear` alone.
    [lastYear],
  );
  const { entries, loading, error, reload, create, update, remove } = useEntries(`${FIRST_YEAR}-01-01`, `${lastYear}-12-31`);
  const [visibleYear, setVisibleYear] = useState(() => Math.min(Math.max(current.year, FIRST_YEAR), lastYear));
  const [panel, setPanel] = useState<Panel>(null);
  const scroller = useRef<HTMLDivElement>(null);
  useDragScroll(scroller);

  /** Puts the month at the left edge; with `date`, also brings that day into view vertically. */
  const scrollToMonth = useCallback((year: number, month: number, date?: IsoDate, behavior: ScrollBehavior = "auto") => {
    const el = scroller.current;
    const column = el?.querySelector<HTMLElement>(`[data-month="${year}-${month}"]`);
    if (!el || !column) return;
    const cell = date ? column.querySelector<HTMLElement>(`[data-date="${date}"]`) : null;
    // Leave a few days of context above the target day, below the sticky month header.
    const top = cell ? Math.max(0, cell.offsetTop - cell.offsetHeight * 3) : undefined;
    el.scrollTo({ left: column.offsetLeft, top, behavior });
  }, []);

  // Day rows stretch so all 31 days fill the available height on any device.
  // Only below MIN_ROW_HEIGHT (e.g. phones in landscape) does the calendar scroll vertically.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const fit = () => {
      const header = el.querySelector<HTMLElement>(".month__title")?.offsetHeight ?? 0;
      const row = Math.max(MIN_ROW_HEIGHT, (el.clientHeight - header) / DAY_ROWS);
      el.style.setProperty("--row-h", `${row}px`);
      el.classList.toggle("calendar--compact", row < ROOMY_ROW_HEIGHT);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // First load: current month leftmost, today's row in view.
  useLayoutEffect(() => {
    scrollToMonth(current.year, current.month, today);
  }, []);

  // The year picker follows the year of the leftmost visible month.
  const onScroll = useCallback(() => {
    const el = scroller.current;
    const colWidth = el?.querySelector<HTMLElement>(".month")?.offsetWidth;
    if (!el || !colWidth) return;
    const index = Math.min(timeline.length - 1, Math.floor((el.scrollLeft + colWidth / 2) / colWidth));
    setVisibleYear(timeline[index].year);
  }, [timeline]);

  const pickYear = (year: number) => scrollToMonth(year, 0, undefined, "smooth");
  const goToToday = () => scrollToMonth(current.year, current.month, today, "smooth");

  const openCreate = useCallback(
    (date?: IsoDate) => {
      const start = date ?? today;
      setPanel({ kind: "create", initial: { name: "", color: "terracotta", start, end: start } });
    },
    [today],
  );
  const openEntry = useCallback((entry: Entry) => setPanel({ kind: "view", entry }), []);
  const close = () => setPanel(null);

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="topbar__title">
          <CalendarDaysIcon aria-hidden="true" />
          <span>Kalender</span>
        </h1>
        <div className="topbar__controls">
          <YearPicker years={years} value={visibleYear} onChange={pickYear} />
          <button type="button" className="btn btn--ghost btn--small" onClick={goToToday}>
            Heute
          </button>
        </div>
      </header>

      <div className="legend" aria-hidden="true">
        <span className="legend__item">
          <span className="legend__swatch legend__swatch--weekend" />
          Wochenende
        </span>
        <span className="legend__item">
          <span className="legend__swatch legend__swatch--holiday" />
          Schulferien BW
        </span>
        {loading && <span className="legend__status">Lädt …</span>}
      </div>

      {error && (
        <div className="banner" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn--ghost btn--small" onClick={() => void reload()}>
            Erneut laden
          </button>
        </div>
      )}

      <main className="calendar" ref={scroller} onScroll={onScroll} aria-label={`Kalender ${FIRST_YEAR}–${lastYear}`}>
        <div className="calendar__grid" style={{ "--months": timeline.length } as CSSProperties}>
          {timeline.map(({ year, month }) => (
            <MonthColumn
              key={`${year}-${month}`}
              year={year}
              month={month}
              today={today}
              entries={entries}
              onDayClick={openCreate}
              onEntryClick={openEntry}
            />
          ))}
          <div className="year-end">
            <p className="year-end__text">Ende {lastYear}</p>
          </div>
        </div>
      </main>

      <button type="button" className="fab" onClick={() => openCreate()} aria-label="Neuer Eintrag">
        <PlusIcon aria-hidden="true" />
      </button>

      {panel?.kind === "create" && (
        <Sheet title="Neuer Eintrag" onClose={close}>
          <EntryForm
            initial={panel.initial}
            submitLabel="Hinzufügen"
            onCancel={close}
            onSubmit={async (input) => {
              await create(input);
              close();
            }}
          />
        </Sheet>
      )}

      {panel?.kind === "view" && (
        <Sheet title="Eintrag" onClose={close}>
          <EntryDetails
            entry={panel.entry}
            onEdit={() => setPanel({ kind: "edit", entry: panel.entry })}
            onDelete={async () => {
              await remove(panel.entry.id);
              close();
            }}
          />
        </Sheet>
      )}

      {panel?.kind === "edit" && (
        <Sheet title="Eintrag bearbeiten" onClose={close}>
          <EntryForm
            initial={panel.entry}
            submitLabel="Speichern"
            onCancel={() => setPanel({ kind: "view", entry: panel.entry })}
            onSubmit={async (input) => {
              const entry = await update(panel.entry.id, input);
              setPanel({ kind: "view", entry });
            }}
          />
        </Sheet>
      )}
    </div>
  );
}

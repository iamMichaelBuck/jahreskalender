import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRightIcon, CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { Entry, EntryInput, IsoDate } from "../shared/entry";
import { EntryDetails } from "./components/EntryDetails";
import { EntryForm } from "./components/EntryForm";
import { MonthColumn } from "./components/MonthColumn";
import { Sheet } from "./components/Sheet";
import { YearPicker } from "./components/YearPicker";
import { parseIso, todayInGermany } from "./lib/dates";
import { useEntries } from "./lib/useEntries";

const FIRST_YEAR = 2026;
const MIN_LAST_YEAR = 2028;
const MONTHS = Array.from({ length: 12 }, (_, i) => i);

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

  const [year, setYear] = useState(() => Math.min(Math.max(current.year, FIRST_YEAR), lastYear));
  const { entries, loading, error, reload, create, update, remove } = useEntries(year);
  const [panel, setPanel] = useState<Panel>(null);
  const scroller = useRef<HTMLDivElement>(null);

  /** Puts `month` at the left edge; optionally brings `date` into view vertically. */
  const scrollToMonth = useCallback((month: number, date?: IsoDate, behavior: ScrollBehavior = "auto") => {
    const el = scroller.current;
    const column = el?.querySelector<HTMLElement>(`[data-month="${month}"]`);
    if (!el || !column) return;
    let top = 0;
    const cell = date ? column.querySelector<HTMLElement>(`[data-date="${date}"]`) : null;
    if (cell) {
      const rowHeight = cell.offsetHeight;
      // Leave a few days of context above today, below the sticky month header.
      top = Math.max(0, cell.offsetTop - rowHeight * 3);
    }
    el.scrollTo({ left: column.offsetLeft, top, behavior });
  }, []);

  // On first load and on every year switch: current month leftmost (current year) or January.
  // Today's row is also scrolled into view on first load and after "Heute", not on manual year picks.
  const revealTodayIn = useRef<number | null>(current.year);
  useLayoutEffect(() => {
    if (year === current.year) scrollToMonth(current.month, revealTodayIn.current === year ? today : undefined);
    else scrollToMonth(0);
    // Only re-run on year changes, not when `today` ticks over.
  }, [year]);

  const pickYear = (next: number) => {
    revealTodayIn.current = null;
    setYear(next);
  };

  const goToToday = () => {
    revealTodayIn.current = current.year;
    if (year !== current.year) setYear(current.year);
    else scrollToMonth(current.month, today, "smooth");
  };

  const openCreate = useCallback(
    (date?: IsoDate) => {
      const start = date ?? (year === current.year ? today : `${year}-01-01`);
      setPanel({ kind: "create", initial: { name: "", color: "terracotta", start, end: start } });
    },
    [year, current.year, today],
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
          <YearPicker years={years} value={year} onChange={pickYear} />
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

      <main className="calendar" ref={scroller} aria-label={`Kalender ${year}`}>
        <div className="calendar__grid">
          {MONTHS.map((month) => (
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
            <p className="year-end__text">Ende {year}</p>
            {years.includes(year + 1) && (
              <button type="button" className="btn btn--ghost btn--small" onClick={() => pickYear(year + 1)}>
                {year + 1} anzeigen
                <ArrowRightIcon aria-hidden="true" />
              </button>
            )}
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

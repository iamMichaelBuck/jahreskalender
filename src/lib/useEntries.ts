import { useCallback, useEffect, useState } from "react";
import type { Entry, EntryInput, IsoDate } from "../../shared/entry";
import { api } from "./api";

const byStart = (a: Entry, b: Entry) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end);

/** Loads all entries touching [from, to] and keeps them in sync after edits. */
export function useEntries(from: IsoDate, to: IsoDate) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setEntries((await api.listEntries(from, to)).sort(byStart));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    setLoading(true);
    void reload();
    // Everyone shares one calendar, so pick up other visitors' changes when the tab comes back.
    const onVisible = () => document.visibilityState === "visible" && void reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  const create = useCallback(async (input: EntryInput) => {
    const entry = await api.createEntry(input);
    setEntries((list) => [...list, entry].sort(byStart));
    return entry;
  }, []);

  const update = useCallback(async (id: string, input: EntryInput) => {
    const entry = await api.updateEntry(id, input);
    setEntries((list) => list.map((e) => (e.id === id ? entry : e)).sort(byStart));
    return entry;
  }, []);

  const remove = useCallback(async (id: string) => {
    await api.deleteEntry(id);
    setEntries((list) => list.filter((e) => e.id !== id));
  }, []);

  return { entries, loading, error, reload, create, update, remove };
}

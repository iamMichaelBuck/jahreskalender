import type { Entry, EntryInput } from "../../shared/entry";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Verbindung fehlgeschlagen. Bitte erneut versuchen.");
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  listEntries: (from: string, to: string) => request<Entry[]>(`/entries?from=${from}&to=${to}`),
  createEntry: (input: EntryInput) => request<Entry>("/entries", { method: "POST", body: JSON.stringify(input) }),
  updateEntry: (id: string, input: EntryInput) =>
    request<Entry>(`/entries/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteEntry: (id: string) => request<void>(`/entries/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

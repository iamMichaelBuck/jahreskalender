import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { isValidIsoDate, validateEntryInput, type Entry } from "../../shared/entry";

type Bindings = { DB: D1Database };

interface EntryRow {
  id: string;
  name: string;
  color: string;
  start_date: string;
  end_date: string;
}

const toEntry = (row: EntryRow): Entry => ({
  id: row.id,
  name: row.name,
  color: row.color as Entry["color"],
  start: row.start_date,
  end: row.end_date,
});

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

// Entries overlapping [from, to]. The client asks for one calendar year at a time.
app.get("/entries", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
    return c.json({ error: "Parameter 'from' und 'to' (YYYY-MM-DD) sind erforderlich." }, 400);
  }
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, color, start_date, end_date FROM entries WHERE start_date <= ?1 AND end_date >= ?2 ORDER BY start_date, end_date DESC, id",
  )
    .bind(to, from)
    .all<EntryRow>();
  return c.json(results.map(toEntry));
});

app.post("/entries", async (c) => {
  const parsed = validateEntryInput(await c.req.json().catch(() => null));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  const entry: Entry = { id: crypto.randomUUID(), ...parsed.value };
  await c.env.DB.prepare("INSERT INTO entries (id, name, color, start_date, end_date) VALUES (?1, ?2, ?3, ?4, ?5)")
    .bind(entry.id, entry.name, entry.color, entry.start, entry.end)
    .run();
  return c.json(entry, 201);
});

app.put("/entries/:id", async (c) => {
  const parsed = validateEntryInput(await c.req.json().catch(() => null));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  const entry: Entry = { id: c.req.param("id"), ...parsed.value };
  const { meta } = await c.env.DB.prepare(
    "UPDATE entries SET name = ?2, color = ?3, start_date = ?4, end_date = ?5, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?1",
  )
    .bind(entry.id, entry.name, entry.color, entry.start, entry.end)
    .run();
  if (meta.changes === 0) return c.json({ error: "Eintrag nicht gefunden." }, 404);
  return c.json(entry);
});

app.delete("/entries/:id", async (c) => {
  const { meta } = await c.env.DB.prepare("DELETE FROM entries WHERE id = ?1").bind(c.req.param("id")).run();
  if (meta.changes === 0) return c.json({ error: "Eintrag nicht gefunden." }, 404);
  return c.body(null, 204);
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Serverfehler. Bitte später erneut versuchen." }, 500);
});

export const onRequest = handle(app);

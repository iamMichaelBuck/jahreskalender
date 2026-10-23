import { useState, type CSSProperties, type FormEvent } from "react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { ENTRY_COLORS, NAME_MAX_LENGTH, dayCount, validateEntryInput, type EntryColorId, type EntryInput } from "../../shared/entry";
import { addDays } from "../lib/dates";

interface Props {
  initial: EntryInput;
  submitLabel: string;
  onSubmit: (input: EntryInput) => Promise<void>;
  onCancel: () => void;
}

export function EntryForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState<EntryColorId>(initial.color);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const changeStart = (value: string) => {
    // Moving the start past the end shifts the whole range, keeping its length.
    if (value && start && end && value > end) setEnd(addDays(value, dayCount(start, end) - 1));
    setStart(value);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = validateEntryInput({ name, color, start, end });
    if (!parsed.ok) return setError(parsed.error);
    setSaving(true);
    setError(null);
    try {
      await onSubmit(parsed.value);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const days = start && end && end >= start ? dayCount(start, end) : null;

  return (
    <form className="form" onSubmit={submit} noValidate>
      <label className="field">
        <span className="field__label">Name</span>
        <input
          className="input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX_LENGTH}
          placeholder="z. B. Urlaub Gardasee"
          autoComplete="off"
          enterKeyHint="done"
          required
        />
      </label>

      <fieldset className="field">
        <legend className="field__label">Farbe</legend>
        <div className="swatches" role="radiogroup" aria-label="Farbe">
          {ENTRY_COLORS.map((c) => (
            <label key={c.id} className="swatch" style={{ "--swatch": c.hex, "--swatch-ink": c.text } as CSSProperties} title={c.label}>
              <input type="radio" name="color" value={c.id} checked={color === c.id} onChange={() => setColor(c.id)} aria-label={c.label} />
              <CheckIcon className="swatch__check" aria-hidden="true" />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field-row">
        <label className="field">
          <span className="field__label">Von</span>
          <input className="input" type="date" value={start} onChange={(e) => changeStart(e.target.value)} required />
        </label>
        <label className="field">
          <span className="field__label">Bis</span>
          <input className="input" type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} required />
        </label>
      </div>
      <p className="form__hint">{days ? (days === 1 ? "1 Tag" : `${days} Tage`) : " "}</p>

      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Speichern …" : submitLabel}
        </button>
      </div>
    </form>
  );
}

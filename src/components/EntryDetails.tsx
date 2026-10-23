import { useState } from "react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ENTRY_COLORS, dayCount, type Entry } from "../../shared/entry";
import { formatRange } from "../lib/dates";

interface Props {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function EntryDetails({ entry, onEdit, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const color = ENTRY_COLORS.find((c) => c.id === entry.color) ?? ENTRY_COLORS[0];
  const days = dayCount(entry.start, entry.end);

  const remove = async () => {
    setBusy(true);
    try {
      await onDelete();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="details">
      <div className="details__head">
        <span className="details__dot" style={{ background: color.hex }} aria-hidden="true" />
        <p className="details__name">{entry.name}</p>
      </div>
      <p className="details__range">{formatRange(entry.start, entry.end)}</p>
      <p className="details__meta">
        {days === 1 ? "1 Tag" : `${days} Tage`} · {color.label}
      </p>

      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}

      {confirming ? (
        <div className="confirm">
          <p className="confirm__text">Eintrag wirklich löschen?</p>
          <div className="actions">
            <button type="button" className="btn btn--ghost" onClick={() => setConfirming(false)} disabled={busy}>
              Abbrechen
            </button>
            <button type="button" className="btn btn--danger" onClick={remove} disabled={busy}>
              <TrashIcon aria-hidden="true" />
              {busy ? "Löschen …" : "Löschen"}
            </button>
          </div>
        </div>
      ) : (
        <div className="actions">
          <button type="button" className="btn btn--ghost btn--danger-text" onClick={() => setConfirming(true)}>
            <TrashIcon aria-hidden="true" />
            Löschen
          </button>
          <button type="button" className="btn btn--primary" onClick={onEdit}>
            <PencilSquareIcon aria-hidden="true" />
            Bearbeiten
          </button>
        </div>
      )}
    </div>
  );
}

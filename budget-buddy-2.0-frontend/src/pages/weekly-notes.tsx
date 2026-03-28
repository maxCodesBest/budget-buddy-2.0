import { useCallback, useEffect, useId, useState } from "react";
import { http } from "../lib/http";
import {
  weekFirstDayFromLastDayYmd,
  todayLocalYmd,
  weekRangeLabel,
} from "../lib/week";
import "./monthly-table.css";
import "./weekly-notes.css";

type WeeklyNote = {
  id: string;
  weekStart: string;
  highlights: string[];
};

function WeekCard({
  note,
  onReload,
}: {
  note: WeeklyNote;
  onReload: () => Promise<void>;
}) {
  const [lines, setLines] = useState<string[]>(() => [...note.highlights]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLines([...note.highlights]);
  }, [note.id, note.highlights.join("\u0001")]);

  const save = async () => {
    const highlights = lines.map((s) => s.trim()).filter((s) => s.length > 0);
    setSaving(true);
    setErr(null);
    try {
      await http.patch(`/weekly-notes/${note.id}`, { highlights });
      await onReload();
    } catch {
      setErr("Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const addRow = () => setLines((prev) => [...prev, ""]);
  const removeRow = (idx: number) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));
  const setLine = (idx: number, value: string) =>
    setLines((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

  return (
    <section className="category-card weekly-note-card">
      <h3 className="weekly-note-title">{weekRangeLabel(note.weekStart)}</h3>
      {err && <p className="weekly-notes-error">{err}</p>}
      {lines.length === 0 ? (
        <p className="weekly-notes-loading" style={{ margin: 0 }}>
          No highlights yet.
        </p>
      ) : null}
      <ul className="weekly-note-highlights">
        {lines.map((line, idx) => (
          <li key={idx}>
            <input
              type="text"
              className="weekly-note-row-input"
              value={line}
              onChange={(e) => setLine(idx, e.target.value)}
              placeholder="Highlight…"
              maxLength={500}
              aria-label={`Highlight ${idx + 1}`}
            />
            <button
              type="button"
              className="weekly-note-remove-row"
              onClick={() => removeRow(idx)}
              aria-label={`Remove highlight ${idx + 1}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="weekly-note-actions">
        <button type="button" className="btn" onClick={addRow}>
          Add line
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void save()}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
}

function AddWeekModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const titleId = useId();
  const dateFieldId = useId();
  const [anchor, setAnchor] = useState(() => todayLocalYmd());
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAnchor(todayLocalYmd());
      setErr(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  let preview = "";
  try {
    preview = weekRangeLabel(weekFirstDayFromLastDayYmd(anchor));
  } catch {
    preview = "";
  }

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      weekFirstDayFromLastDayYmd(anchor);
    } catch {
      setErr("Pick a valid date.");
      setSubmitting(false);
      return;
    }
    try {
      await http.post("/weekly-notes", { weekAnchor: anchor, highlights: [] });
      onClose();
      await onCreated();
    } catch {
      setErr("Could not add this week. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="weekly-notes-modal-backdrop"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="weekly-notes-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId}>Add week</h3>
        <p className="weekly-notes-modal-preview">
          {preview ? <>Week: {preview}</> : null}
        </p>
        {err && <p className="weekly-notes-error">{err}</p>}
        <div className="control">
          <label htmlFor={dateFieldId}>Last day of this week</label>
          <input
            id={dateFieldId}
            type="date"
            value={anchor}
            onChange={(e) => setAnchor(e.target.value)}
          />
        </div>
        <div className="weekly-notes-modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void submit()}
            disabled={submitting || !anchor}
          >
            {submitting ? "Adding…" : "Add week"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WeeklyNotes() {
  const [notes, setNotes] = useState<WeeklyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const res = await http.get("/weekly-notes");
      const list = (res.data?.value?.notes ?? []) as WeeklyNote[];
      setNotes(list);
    } catch {
      setError("Could not load weekly notes.");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  const reload = useCallback(() => load(false), [load]);

  return (
    <div className="expense-page">
      <header className="page-header">
        <h2>Weekly notes</h2>
      </header>

      {error && <p className="weekly-notes-error">{error}</p>}
      {loading && (
        <p className="weekly-notes-loading">Loading weekly notes…</p>
      )}

      {!loading && (
        <div className="weekly-notes-grid">
          <button
            type="button"
            className="weekly-notes-add-card"
            onClick={() => setAddOpen(true)}
          >
            <span className="weekly-notes-add-icon" aria-hidden>
              +
            </span>
            <span className="weekly-notes-add-hint">
              Add a week and capture highlights
            </span>
          </button>
          {notes.map((note) => (
            <WeekCard key={note.id} note={note} onReload={reload} />
          ))}
        </div>
      )}

      <AddWeekModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={reload}
      />
    </div>
  );
}

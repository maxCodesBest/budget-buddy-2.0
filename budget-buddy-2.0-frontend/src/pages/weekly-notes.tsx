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
  onOpenReader,
}: {
  note: WeeklyNote;
  onReload: () => Promise<void>;
  onOpenReader: () => void;
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
      <button
        type="button"
        className="weekly-note-title-btn"
        onClick={onOpenReader}
        aria-label={`Open full view: ${weekRangeLabel(note.weekStart)}`}
      >
        {weekRangeLabel(note.weekStart)}
      </button>
      {err && <p className="weekly-notes-error">{err}</p>}
      {lines.length === 0 ? (
        <p className="weekly-notes-loading" style={{ margin: 0 }}>
          No highlights yet.
        </p>
      ) : null}
      <ul className="weekly-note-highlights" dir="auto">
        {lines.map((line, idx) => (
          <li key={idx} dir="auto">
            <input
              type="text"
              className="weekly-note-row-input"
              dir="auto"
              value={line}
              onChange={(e) => setLine(idx, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Highlight…"
              maxLength={500}
              aria-label={`Highlight ${idx + 1}`}
            />
            <button
              type="button"
              className="weekly-note-remove-row"
              onClick={(e) => {
                e.stopPropagation();
                removeRow(idx);
              }}
              aria-label={`Remove highlight ${idx + 1}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div
        className="weekly-note-actions"
        onClick={(e) => e.stopPropagation()}
      >
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

function WeeklyNoteReaderModal({
  notes,
  index,
  onClose,
  onChangeIndex,
}: {
  notes: WeeklyNote[];
  index: number;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
}) {
  const titleId = useId();
  const note = notes[index];
  const canGoNewer = index > 0;
  const canGoOlder = index < notes.length - 1;

  const goNewer = () => {
    if (canGoNewer) onChangeIndex(index - 1);
  };
  const goOlder = () => {
    if (canGoOlder) onChangeIndex(index + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        if (index > 0) {
          e.preventDefault();
          onChangeIndex(index - 1);
        }
        return;
      }
      if (e.key === "ArrowRight") {
        if (index < notes.length - 1) {
          e.preventDefault();
          onChangeIndex(index + 1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, notes.length, onClose, onChangeIndex]);

  if (!note) return null;

  const trimmed = note.highlights.map((s) => s.trim()).filter((s) => s.length > 0);

  return (
    <div
      className="weekly-notes-modal-backdrop weekly-notes-reader-backdrop"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="weekly-notes-reader-shell">
        <button
          type="button"
          className="weekly-notes-reader-nav weekly-notes-reader-nav--prev"
          onClick={(e) => {
            e.stopPropagation();
            goNewer();
          }}
          disabled={!canGoNewer}
          aria-label="Newer week"
        >
          ‹
        </button>
        <div
          className="weekly-notes-reader-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="weekly-notes-reader-header">
            <h3 id={titleId} className="weekly-notes-reader-title">
              {weekRangeLabel(note.weekStart)}
            </h3>
            <button
              type="button"
              className="weekly-notes-reader-close"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                className="weekly-notes-reader-close-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="weekly-notes-reader-body">
            {trimmed.length === 0 ? (
              <p className="weekly-notes-loading" style={{ margin: 0 }}>
                No highlights yet.
              </p>
            ) : (
              <ul
                className="weekly-note-highlights weekly-note-highlights-readonly"
                dir="auto"
              >
                {trimmed.map((line, idx) => (
                  <li key={idx} dir="auto">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          type="button"
          className="weekly-notes-reader-nav weekly-notes-reader-nav--next"
          onClick={(e) => {
            e.stopPropagation();
            goOlder();
          }}
          disabled={!canGoOlder}
          aria-label="Older week"
        >
          ›
        </button>
      </div>
    </div>
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
  const [readerIndex, setReaderIndex] = useState<number | null>(null);

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

  useEffect(() => {
    if (readerIndex === null) return;
    if (notes.length === 0) {
      setReaderIndex(null);
      return;
    }
    if (readerIndex >= notes.length) {
      setReaderIndex(notes.length - 1);
    }
  }, [notes, readerIndex]);

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
          {notes.map((note, idx) => (
            <WeekCard
              key={note.id}
              note={note}
              onReload={reload}
              onOpenReader={() => setReaderIndex(idx)}
            />
          ))}
        </div>
      )}

      <AddWeekModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={reload}
      />

      {readerIndex !== null && notes.length > 0 ? (
        <WeeklyNoteReaderModal
          notes={notes}
          index={readerIndex}
          onClose={() => setReaderIndex(null)}
          onChangeIndex={setReaderIndex}
        />
      ) : null}
    </div>
  );
}

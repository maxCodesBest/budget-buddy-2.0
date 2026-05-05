import { useCallback, useEffect, useId, useState } from "react";
import axios from "axios";
import { http } from "../lib/http";
import {
  fridayEndOfJewishWeekContainingYmd,
  weekFirstDayFromLastDayYmd,
  todayLocalYmd,
  weekRangeLabel,
} from "../lib/week";
import "./monthly-table.css";
import "./weekly-notes.css";

/** Paste import: `D.M` is day.month — that calendar day is the week's last day (week anchor). */
const BULK_IMPORT_YEAR = 2026;
const BULK_HEADER_RE = /^(\d{1,2})\.(\d{1,2})\s*-\s*$/;

function stripBidi(s: string): string {
  return s.replace(/[\u200e\u200f]/g, "");
}

function parseDayMonthHeader(line: string): { day: number; month: number } | null {
  const t = stripBidi(line).trim();
  const m = BULK_HEADER_RE.exec(t);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { day, month };
}

function ymdFromDayMonth(day: number, month: number, year: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function isValidUtcCalendarDay(year: number, month: number, day: number): boolean {
  const t = Date.UTC(year, month - 1, day);
  const dt = new Date(t);
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

/**
 * Parses blocks like:
 *   4.1 -
 *   line one
 *   line two
 * Header is day.month for year BULK_IMPORT_YEAR; that date is the last day of the week (not “any day in the week”).
 */
function parseBulkWeeklyPaste(text: string): {
  weekAnchor: string;
  highlights: string[];
}[] {
  const blocks: { weekAnchor: string; highlights: string[] }[] = [];
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const header = parseDayMonthHeader(lines[i]);
    if (!header) {
      i += 1;
      continue;
    }
    i += 1;
    const highlights: string[] = [];
    while (i < lines.length) {
      if (parseDayMonthHeader(lines[i])) break;
      const v = stripBidi(lines[i]).trim();
      if (v.length > 0) highlights.push(v);
      i += 1;
    }
    const ymd = ymdFromDayMonth(header.day, header.month, BULK_IMPORT_YEAR);
    const dateOk = isValidUtcCalendarDay(
      BULK_IMPORT_YEAR,
      header.month,
      header.day,
    );
    if (dateOk && highlights.length > 0) {
      blocks.push({ weekAnchor: ymd, highlights });
    }
  }
  return blocks;
}

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
      <ul className="weekly-note-highlights">
        {lines.map((line, idx) => (
          <li key={idx}>
            <input
              type="text"
              className="weekly-note-row-input"
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
              ×
            </button>
          </div>
          <div className="weekly-notes-reader-body">
            {trimmed.length === 0 ? (
              <p className="weekly-notes-loading" style={{ margin: 0 }}>
                No highlights yet.
              </p>
            ) : (
              <ul className="weekly-note-highlights weekly-note-highlights-readonly">
                {trimmed.map((line, idx) => (
                  <li key={idx}>{line}</li>
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
      try {
        setAnchor(fridayEndOfJewishWeekContainingYmd(todayLocalYmd()));
      } catch {
        setAnchor(todayLocalYmd());
      }
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
      const weekAnchor = fridayEndOfJewishWeekContainingYmd(anchor);
      await http.post("/weekly-notes", { weekAnchor, highlights: [] });
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
          <label htmlFor={dateFieldId}>Any day in the week (Saturday–Friday)</label>
          <input
            id={dateFieldId}
            type="date"
            value={anchor}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              try {
                setAnchor(fridayEndOfJewishWeekContainingYmd(v));
              } catch {
                setAnchor(v);
              }
            }}
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

function BulkPasteImport({ onImported }: { onImported: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<{ weekAnchor: string; highlights: string[] }[] | null>(
    null,
  );
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [shifting, setShifting] = useState(false);
  const [shiftErr, setShiftErr] = useState<string | null>(null);

  const runParse = () => {
    setParseErr(null);
    try {
      const notes = parseBulkWeeklyPaste(raw);
      setParsed(notes);
      if (notes.length === 0) {
        setParseErr(
          `No blocks found. Use a header like "4.1 -" (day.month for year ${BULK_IMPORT_YEAR}), then one highlight per line.`,
        );
      }
    } catch {
      setParseErr("Could not parse.");
      setParsed(null);
    }
  };

  const submitBulk = async () => {
    if (!parsed || parsed.length === 0) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      await http.post("/weekly-notes/bulk", { notes: parsed });
      setRaw("");
      setParsed(null);
      setOpen(false);
      await onImported();
    } catch {
      setSubmitErr("Import failed. Check that you are signed in and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const shiftAllOneWeekEarlier = async () => {
    if (
      !window.confirm(
        "Move every weekly note one week earlier (subtract 7 days from each week’s start)? This is meant as a one-time fix after a bad import.",
      )
    ) {
      return;
    }
    setShifting(true);
    setShiftErr(null);
    try {
      await http.post("/weekly-notes/shift-all-one-week-earlier");
      await onImported();
    } catch (e: unknown) {
      let msg = "Could not shift weeks.";
      if (axios.isAxiosError(e)) {
        const m = e.response?.data?.message;
        if (typeof m === "string") msg = m;
        else if (Array.isArray(m)) msg = m.join(" ");
      }
      setShiftErr(msg);
    } finally {
      setShifting(false);
    }
  };

  return (
    <section className="weekly-notes-bulk-panel">
      <div className="weekly-notes-bulk-toolbar">
        <button
          type="button"
          className="btn weekly-notes-bulk-toggle"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide" : "Show"} bulk paste import ({BULK_IMPORT_YEAR})
        </button>
        <button
          type="button"
          className="btn weekly-notes-bulk-shift"
          disabled={shifting}
          onClick={() => void shiftAllOneWeekEarlier()}
        >
          {shifting ? "Shifting…" : "One-time: shift all notes 1 week earlier"}
        </button>
      </div>
      {shiftErr && <p className="weekly-notes-error">{shiftErr}</p>}
      {open ? (
        <div className="weekly-notes-bulk-body">
          <p className="weekly-notes-bulk-hint">
            Each block: <code>D.M -</code> on its own line — day then month, year {BULK_IMPORT_YEAR}{" "}
            (e.g. <code>1.5 -</code> is 1 May, the <strong>last day</strong> of that week). Then one
            highlight per line. Stored weeks run Saturday–Friday (UTC) from that anchor.
          </p>
          <textarea
            className="weekly-notes-bulk-textarea"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={12}
            placeholder={"4.1 -\nfirst highlight\nsecond highlight"}
            spellCheck={false}
          />
          {parseErr && <p className="weekly-notes-error">{parseErr}</p>}
          {submitErr && <p className="weekly-notes-error">{submitErr}</p>}
          <div className="weekly-notes-bulk-actions">
            <button type="button" className="btn" onClick={() => void runParse()}>
              Parse preview
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!parsed || parsed.length === 0 || submitting}
              onClick={() => void submitBulk()}
            >
              {submitting ? "Importing…" : `Import ${parsed?.length ?? 0} weeks`}
            </button>
          </div>
          {parsed && parsed.length > 0 ? (
            <ul className="weekly-notes-bulk-preview">
              {parsed.map((b, idx) => (
                <li key={`${b.weekAnchor}-${idx}`}>
                  <strong>{weekRangeLabel(weekFirstDayFromLastDayYmd(b.weekAnchor))}</strong>
                  <span className="weekly-notes-bulk-preview-meta"> ({b.highlights.length} lines)</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
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
      {!loading && <BulkPasteImport onImported={reload} />}
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

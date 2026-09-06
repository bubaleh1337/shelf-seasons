"use client";

import { useState } from "react";
import { BookOpen, Check, LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { appCopy } from "@/lib/app-copy";
import type { LibraryBook } from "@/lib/books/types";
import { localDateKey } from "@/lib/reading/dates";
import type { ReadingSession } from "@/lib/reading/types";
import type { Locale } from "@/lib/shelf-seasons";

export function ReadingDialog({ locale, books, timezone, onSaved, compact = false }: { locale: Locale; books: LibraryBook[]; timezone: string; onSaved: (session: ReadingSession) => void; compact?: boolean }) {
  const c = appCopy[locale];
  const preferredBook = books.find((book) => book.status === "reading") ?? books[0];
  const [open, setOpen] = useState(false);
  const [bookId, setBookId] = useState(preferredBook?.id ?? "");
  const [readOn, setReadOn] = useState(localDateKey(timezone));
  const [detailed, setDetailed] = useState(false);
  const [pagesRead, setPagesRead] = useState("");
  const [minutesRead, setMinutesRead] = useState("");
  const [percent, setPercent] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  function reset() {
    setBookId((books.find((book) => book.status === "reading") ?? books[0])?.id ?? "");
    setReadOn(localDateKey(timezone));
    setDetailed(false); setPagesRead(""); setMinutesRead(""); setPercent(""); setNote(""); setError(false);
  }

  function handleOpen(next: boolean) {
    if (next) reset();
    setOpen(next);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!bookId) return;
    setBusy(true); setError(false);
    const input = { bookId, readOn, checkInOnly: !detailed, pagesRead: detailed ? pagesRead : null, minutesRead: detailed ? minutesRead : null, resultingPercent: detailed ? percent : null, note: detailed ? note : null };
    try {
      const response = await fetch("/api/reading", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { sessionId: string; runId: string; bookId: string };
      onSaved({ id: payload.sessionId, runId: payload.runId, bookId: payload.bookId, readOn, checkInOnly: !detailed, pagesRead: pagesRead ? Number(pagesRead) : null, minutesRead: minutesRead ? Number(minutesRead) : null, resultingPercent: percent ? Number(percent) : null, note: note.trim() || null });
      setOpen(false);
    } catch { setError(true); } finally { setBusy(false); }
  }

  return <Dialog open={open} onOpenChange={handleOpen}>
    <DialogTrigger asChild><Button className={compact ? "primary-button mobile-log-button" : "primary-button"} aria-label={c.logReading}>{compact ? <Plus /> : <><BookOpen />{c.logReading}</>}</Button></DialogTrigger>
    <DialogContent className="reading-entry-dialog">
      <DialogHeader><DialogTitle>{c.logTitle}</DialogTitle><DialogDescription>{c.logLead}</DialogDescription></DialogHeader>
      {books.length === 0 ? <div className="reading-no-books"><BookOpen /><p>{c.noBooksToLog}</p></div> : <form className="reading-entry-form" onSubmit={save}>
        <label><span>{c.book}</span><select value={bookId} onChange={(event) => setBookId(event.target.value)}>{books.map((book) => <option value={book.id} key={book.id}>{book.title}{book.authors[0] ? ` — ${book.authors[0]}` : ""}</option>)}</select></label>
        <label><span>{c.date}</span><input type="date" value={readOn} max={localDateKey(timezone)} onChange={(event) => setReadOn(event.target.value)} required /></label>
        <button className="detail-toggle" type="button" onClick={() => setDetailed((value) => !value)}>{detailed ? <Check /> : <Plus />}{detailed ? c.quickCheckIn : c.details}</button>
        {detailed && <div className="reading-details"><label><span>{c.pagesRead}</span><input type="number" min="1" value={pagesRead} onChange={(event) => setPagesRead(event.target.value)} /></label><label><span>{c.minutesRead}</span><input type="number" min="1" value={minutesRead} onChange={(event) => setMinutesRead(event.target.value)} /></label><label><span>{c.percentAfter}</span><input type="number" min="0" max="100" step="0.1" value={percent} onChange={(event) => setPercent(event.target.value)} /></label><label className="reading-note"><span>{c.note}</span><textarea maxLength={1000} rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label></div>}
        {error && <p className="form-error" role="alert">{c.error}</p>}
        <div className="editor-actions"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{c.cancel}</Button><Button className="primary-button" type="submit" disabled={busy || (detailed && !pagesRead && !minutesRead && !percent)}>{busy && <LoaderCircle className="spin" />}{busy ? c.saving : c.saveReading}</Button></div>
      </form>}
    </DialogContent>
  </Dialog>;
}

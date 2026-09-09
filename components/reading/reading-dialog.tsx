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
  const [currentPage, setCurrentPage] = useState("");
  const [minutesRead, setMinutesRead] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  function reset() {
    setBookId((books.find((book) => book.status === "reading") ?? books[0])?.id ?? "");
    setReadOn(localDateKey(timezone));
    setDetailed(false); setCurrentPage(""); setMinutesRead(""); setNote(""); setError(false);
  }

  function handleOpen(next: boolean) {
    if (next) reset();
    setOpen(next);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!bookId) return;
    setBusy(true); setError(false);
    const input = { bookId, readOn, checkInOnly: !detailed, currentPage: detailed ? currentPage : null, minutesRead: detailed ? minutesRead : null, note: detailed ? note : null };
    try {
      const response = await fetch("/api/reading", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { sessionId: string; runId: string; bookId: string; pagesRead: number | null; minutesRead: number | null; resultingPercent: number | null; endingPage: number | null };
      onSaved({ id: payload.sessionId, runId: payload.runId, bookId: payload.bookId, readOn, checkInOnly: !detailed, endingPage: payload.endingPage, pagesRead: payload.pagesRead, minutesRead: payload.minutesRead, resultingPercent: payload.resultingPercent, note: note.trim() || null });
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
        {detailed && <ReadingDetails locale={locale} book={books.find((book) => book.id === bookId)} currentPage={currentPage} setCurrentPage={setCurrentPage} minutesRead={minutesRead} setMinutesRead={setMinutesRead} note={note} setNote={setNote} />}
        {error && <p className="form-error" role="alert">{c.error}</p>}
        <div className="editor-actions"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{c.cancel}</Button><Button className="primary-button" type="submit" disabled={busy || (detailed && !currentPage && !minutesRead)}>{busy && <LoaderCircle className="spin" />}{busy ? c.saving : c.saveReading}</Button></div>
      </form>}
    </DialogContent>
  </Dialog>;
}

function ReadingDetails({ locale, book, currentPage, setCurrentPage, minutesRead, setMinutesRead, note, setNote }: { locale: Locale; book?: LibraryBook; currentPage: string; setCurrentPage: (value: string) => void; minutesRead: string; setMinutesRead: (value: string) => void; note: string; setNote: (value: string) => void }) {
  const c = appCopy[locale];
  const page = Number(currentPage);
  const percent = book?.pageCount && page > 0 ? Math.min(100, Math.round((page / book.pageCount) * 100)) : null;
  return <div className="reading-details">
    <label><span>{c.currentPage}</span><input type="number" min="1" max={book?.pageCount ?? 100000} value={currentPage} onChange={(event) => setCurrentPage(event.target.value)} />{book?.pageCount && <small>{c.currentPageHint.replace("{count}", String(book.pageCount))}</small>}</label>
    <label><span>{c.minutesRead}</span><input type="number" min="1" value={minutesRead} onChange={(event) => setMinutesRead(event.target.value)} /></label>
    {percent !== null && <div className="calculated-reading-progress" aria-live="polite"><span>{c.calculatedProgress}</span><strong>{percent}%</strong><i><b style={{ width: `${percent}%` }} /></i></div>}
    <label className="reading-note"><span>{c.note}</span><textarea maxLength={1000} rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></label>
  </div>;
}

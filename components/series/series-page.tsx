"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Layers3, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { LibraryBookCover } from "@/components/library/book-cover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { appCopy } from "@/lib/app-copy";
import type { LibraryBook } from "@/lib/books/types";
import { moveSeriesEntry, summarizeSeries } from "@/lib/series/progress";
import type { BookSeries, SeriesEntry, SeriesStatus } from "@/lib/series/types";
import type { Locale } from "@/lib/shelf-seasons";
import { cn } from "@/lib/utils";

export function SeriesPage({ locale, books, items, onSaved, onDeleted, onBookSaved }: { locale: Locale; books: LibraryBook[]; items: BookSeries[]; onSaved: (series: BookSeries) => void; onDeleted: (seriesId: string) => void; onBookSaved: (book: LibraryBook) => void }) {
  const c = appCopy[locale];
  return <>
    <header className="page-intro"><div><h1>{c.series}</h1><p>{c.seriesLead}</p></div><SeriesEditor locale={locale} books={books} onSaved={onSaved} /></header>
    {items.length === 0 ? <section className="empty-state real-series-empty"><Layers3 /><h2>{c.emptySeries}</h2><p>{c.emptySeriesLead}</p><SeriesEditor locale={locale} books={books} onSaved={onSaved} /></section> : <div className="real-series-grid">{items.map((series) => <SeriesCard key={series.id} locale={locale} books={books} series={series} onSaved={onSaved} onDeleted={onDeleted} onBookSaved={onBookSaved} />)}</div>}
  </>;
}

function SeriesCard({ locale, books, series, onSaved, onDeleted, onBookSaved }: { locale: Locale; books: LibraryBook[]; series: BookSeries; onSaved: (series: BookSeries) => void; onDeleted: (seriesId: string) => void; onBookSaved: (book: LibraryBook) => void }) {
  const c = appCopy[locale];
  const bookMap = new Map(books.map((book) => [book.id, book]));
  const { completed, total, nextEntry } = summarizeSeries(series.entries, books);
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const nextBook = nextEntry?.bookId ? bookMap.get(nextEntry.bookId) : undefined;
  const entryBooks = series.entries.flatMap((entry) => entry.bookId ? [bookMap.get(entry.bookId)] : []).filter((book): book is LibraryBook => Boolean(book));
  const coverBooks = series.coverBookId ? [bookMap.get(series.coverBookId), ...entryBooks] : entryBooks;
  const covers = coverBooks.filter((book): book is LibraryBook => Boolean(book)).filter((book, index, all) => all.findIndex((candidate) => candidate?.id === book.id) === index).slice(0, 3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function removeSeries() {
    if (!window.confirm(c.deleteSeriesConfirm)) return;
    setBusy(true); setError(false);
    try {
      const response = await fetch(`/api/series/${series.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      onDeleted(series.id);
    } catch { setError(true); } finally { setBusy(false); }
  }

  async function startNext() {
    if (!nextBook) return;
    setBusy(true); setError(false);
    try {
      const response = await fetch(`/api/books/${nextBook.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "reading" }) });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { book: LibraryBook };
      onBookSaved(payload.book);
    } catch { setError(true); } finally { setBusy(false); }
  }

  return <article className="real-series-card">
    <div className="real-series-covers" aria-hidden="true">{covers.length ? covers.map((book, index) => <div key={book.id} style={{ "--stack-index": index } as React.CSSProperties}><LibraryBookCover book={book} /></div>) : <><i /><i /><i /></>}</div>
    <div className="real-series-copy"><span className={`series-status status-${series.status}`}>{c[series.status]}</span><h2>{series.name}</h2>{series.creator && <p>{series.creator}</p>}<div className="series-count"><strong>{completed} / {total}</strong><span>{c.seriesVolumes}</span></div><div className="series-progress-track" aria-label={`${completed} / ${total}`}><i style={{ width: `${percentage}%` }} /></div><div className="series-next"><span>{c.nextVolume}</span><strong>{nextEntry ? (nextBook?.title ?? nextEntry.placeholderTitle) : c.seriesComplete}</strong></div>{error && <p className="form-error" role="alert">{c.error}</p>}<div className="series-card-actions"><SeriesEditor locale={locale} books={books} series={series} onSaved={onSaved} /><Button type="button" variant="ghost" className="delete-book" onClick={removeSeries} disabled={busy}><Trash2 />{c.deleteSeries}</Button>{nextBook && <Button type="button" className="primary-button" onClick={startNext} disabled={busy}><BookOpen />{c.startNext}</Button>}</div></div>
  </article>;
}

function SeriesEditor({ locale, books, series, onSaved }: { locale: Locale; books: LibraryBook[]; series?: BookSeries; onSaved: (series: BookSeries) => void }) {
  const c = appCopy[locale];
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(series?.name ?? "");
  const [creator, setCreator] = useState(series?.creator ?? "");
  const [description, setDescription] = useState(series?.description ?? "");
  const [status, setStatus] = useState<SeriesStatus>(series?.status ?? "planned");
  const [coverBookId, setCoverBookId] = useState(series?.coverBookId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  function reset() {
    setName(series?.name ?? ""); setCreator(series?.creator ?? ""); setDescription(series?.description ?? ""); setStatus(series?.status ?? "planned"); setCoverBookId(series?.coverBookId ?? ""); setError(false);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(false);
    try {
      const response = await fetch(series ? `/api/series/${series.id}` : "/api/series", { method: series ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, creator: creator || null, description: description || null, status, coverBookId: coverBookId || null }) });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { series: BookSeries };
      onSaved(payload.series);
      if (!series) setOpen(false);
    } catch { setError(true); } finally { setBusy(false); }
  }

  return <Dialog open={open} onOpenChange={(next) => { if (next) reset(); setOpen(next); }}><DialogTrigger asChild>{series ? <Button variant="outline"><Pencil />{c.editSeries}</Button> : <Button className="primary-button"><Plus />{c.createSeries}</Button>}</DialogTrigger><DialogContent className="series-editor-dialog"><DialogHeader><DialogTitle>{series ? c.editSeries : c.createSeries}</DialogTitle><DialogDescription>{series ? c.seriesBooksStay : c.emptySeriesLead}</DialogDescription></DialogHeader><form className="series-editor-form" onSubmit={save}><label><span>{c.seriesName}</span><input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} /></label><label><span>{c.seriesCreator}</span><input maxLength={160} value={creator} onChange={(event) => setCreator(event.target.value)} /></label><label><span>{c.seriesStatus}</span><select value={status} onChange={(event) => setStatus(event.target.value as SeriesStatus)}>{(["planned", "in_progress", "completed", "abandoned"] as const).map((value) => <option key={value} value={value}>{c[value]}</option>)}</select></label><label><span>{c.cover}</span><select value={coverBookId} onChange={(event) => setCoverBookId(event.target.value)}><option value="">—</option>{books.map((book) => <option value={book.id} key={book.id}>{book.title}</option>)}</select></label><label className="series-description"><span>{c.seriesDescription}</span><textarea rows={3} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} /></label>{error && <p className="form-error" role="alert">{c.error}</p>}<div className="editor-actions"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{c.cancel}</Button><Button type="submit" className="primary-button" disabled={busy}>{busy && <LoaderCircle className="spin" />}{busy ? c.saving : c.saveSeries}</Button></div></form>{series && <SeriesEntriesEditor locale={locale} books={books} series={series} onSaved={onSaved} />}</DialogContent></Dialog>;
}

function SeriesEntriesEditor({ locale, books, series, onSaved }: { locale: Locale; books: LibraryBook[]; series: BookSeries; onSaved: (series: BookSeries) => void }) {
  const c = appCopy[locale];
  const [kind, setKind] = useState<"book" | "placeholder">("book");
  const [bookId, setBookId] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [position, setPosition] = useState(String(series.entries.length + 1));
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const availableBooks = useMemo(() => books.filter((book) => !series.entries.some((entry) => entry.bookId === book.id)), [books, series.entries]);
  const bookMap = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);

  async function addEntry(event: React.FormEvent) {
    event.preventDefault();
    const selectedBookId = kind === "book" ? (bookId || availableBooks[0]?.id || null) : null;
    if ((kind === "book" && !selectedBookId) || (kind === "placeholder" && !placeholder.trim())) return;
    setBusy(true); setError(false);
    try {
      const response = await fetch(`/api/series/${series.id}/entries`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookId: selectedBookId, placeholderTitle: kind === "placeholder" ? placeholder : null, positionLabel: position }) });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { entry: SeriesEntry };
      onSaved({ ...series, entries: [...series.entries, payload.entry] });
      setBookId(""); setPlaceholder(""); setPosition(String(series.entries.length + 2));
    } catch { setError(true); } finally { setBusy(false); }
  }

  async function reorder(index: number, delta: -1 | 1) {
    const order = moveSeriesEntry(series.entries, index, delta);
    if (order === series.entries) return;
    setBusy(true); setError(false);
    try {
      const response = await fetch(`/api/series/${series.id}/entries`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ entryIds: order.map((entry) => entry.id) }) });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { entries: SeriesEntry[] };
      onSaved({ ...series, entries: payload.entries });
    } catch { setError(true); } finally { setBusy(false); }
  }

  async function updateEntry(entry: SeriesEntry) {
    const positionLabel = (labels[entry.id] ?? entry.positionLabel).trim();
    if (!positionLabel) return;
    setBusy(true); setError(false);
    try {
      const response = await fetch(`/api/series/${series.id}/entries/${entry.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookId: entry.bookId, placeholderTitle: entry.placeholderTitle, positionLabel }) });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { entry: SeriesEntry };
      onSaved({ ...series, entries: series.entries.map((item) => item.id === entry.id ? payload.entry : item) });
    } catch { setError(true); } finally { setBusy(false); }
  }

  async function removeEntry(entryId: string) {
    setBusy(true); setError(false);
    try {
      const response = await fetch(`/api/series/${series.id}/entries/${entryId}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      onSaved({ ...series, entries: series.entries.filter((entry) => entry.id !== entryId) });
    } catch { setError(true); } finally { setBusy(false); }
  }

  return <section className="series-entries-editor"><h3>{c.addSeriesEntry}</h3>{series.entries.length > 0 && <ol className="series-entry-list">{series.entries.map((entry, index) => <li key={entry.id}><span className="entry-order">{index + 1}</span><div className="entry-name"><strong>{entry.bookId ? bookMap.get(entry.bookId)?.title ?? c.book : entry.placeholderTitle}</strong><input aria-label={c.positionLabel} value={labels[entry.id] ?? entry.positionLabel} onChange={(event) => setLabels((current) => ({ ...current, [entry.id]: event.target.value }))} /></div><div className="entry-actions"><button type="button" onClick={() => reorder(index, -1)} disabled={busy || index === 0} aria-label={c.moveUp}><ArrowUp /></button><button type="button" onClick={() => reorder(index, 1)} disabled={busy || index === series.entries.length - 1} aria-label={c.moveDown}><ArrowDown /></button><button type="button" onClick={() => updateEntry(entry)} disabled={busy} aria-label={c.savePosition}><Pencil /></button><button type="button" onClick={() => removeEntry(entry.id)} disabled={busy} aria-label={c.removeVolume}><Trash2 /></button></div></li>)}</ol>}<form className="add-series-entry" onSubmit={addEntry}><div className="entry-kind"><button type="button" className={cn(kind === "book" && "is-active")} onClick={() => setKind("book")}>{c.addBookEntry}</button><button type="button" className={cn(kind === "placeholder" && "is-active")} onClick={() => setKind("placeholder")}>{c.addPlaceholderEntry}</button></div>{kind === "book" ? (availableBooks.length ? <select value={bookId || availableBooks[0]?.id} onChange={(event) => setBookId(event.target.value)}>{availableBooks.map((book) => <option value={book.id} key={book.id}>{book.title} — {book.authors[0] ?? "—"}</option>)}</select> : <p>{c.noAvailableBooks}</p>) : <input required maxLength={300} value={placeholder} onChange={(event) => setPlaceholder(event.target.value)} placeholder={c.placeholderTitle} />}<label><span>{c.positionLabel}</span><input required maxLength={40} value={position} onChange={(event) => setPosition(event.target.value)} /></label>{error && <p className="form-error" role="alert">{c.error}</p>}<Button type="submit" variant="outline" disabled={busy || (kind === "book" && !availableBooks.length)}>{busy ? <LoaderCircle className="spin" /> : <Plus />}{c.addVolume}</Button></form></section>;
}

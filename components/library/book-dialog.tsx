"use client";

import { useState } from "react";
import { LoaderCircle, Plus, Repeat2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LibraryBookCover } from "@/components/library/book-cover";
import { appCopy } from "@/lib/app-copy";
import { searchBooksInBrowser } from "@/lib/books/browser-search";
import { providerLanguageToReadingLanguage, rankAndDedupeResults } from "@/lib/books/search";
import type { BookSearchResult, LibraryBook } from "@/lib/books/types";
import { seasons } from "@/lib/seasons";
import type { Locale } from "@/lib/shelf-seasons";

type Draft = {
  title: string; authors: string; description: string; coverUrl: string; isbn: string;
  publishedYear: string; pageCount: string; format: LibraryBook["format"]; status: LibraryBook["status"];
  readingLanguage: LibraryBook["readingLanguage"]; season: NonNullable<LibraryBook["season"]> | "";
  provider: "manual" | "google_books" | "open_library"; providerId: string; removeCover: boolean;
};

const blank: Draft = { title: "", authors: "", description: "", coverUrl: "", isbn: "", publishedYear: "", pageCount: "", format: "print", status: "want", readingLanguage: "other", season: "", provider: "manual", providerId: "", removeCover: false };

type SaveErrorPayload = { error?: string };

function saveErrorMessage(locale: Locale, status: number, code: string | undefined, fallback: string) {
  const messages = locale === "ru"
    ? {
        rateLimited: "Слишком много попыток сохранения за короткое время. Подожди минуту и попробуй снова.",
        unauthorized: "Сессия входа закончилась. Обнови страницу и войди снова.",
        invalid: "Не удалось проверить данные книги. Проверь поля и попробуй снова.",
        coverTooLarge: "Обложка слишком большая. Выбери JPG, PNG или WebP до 5 МБ.",
        coverFailed: "Не удалось сохранить выбранную обложку. Попробуй другую обложку или сохрани книгу без неё.",
        statusFailed: "Книга сохранилась некорректно: не удалось синхронизировать полку и историю чтения. Попробуй ещё раз.",
        saveFailed: "Не удалось сохранить данные книги. Попробуй ещё раз.",
        unavailable: "Сервис сохранения временно недоступен. Попробуй ещё раз через минуту.",
      }
    : {
        rateLimited: "Too many save attempts in a short time. Wait a minute and try again.",
        unauthorized: "Your sign-in session has expired. Refresh the page and sign in again.",
        invalid: "The book data could not be validated. Check the fields and try again.",
        coverTooLarge: "The cover is too large. Choose a JPG, PNG or WebP file up to 5 MB.",
        coverFailed: "The selected cover could not be saved. Try another cover or save the book without it.",
        statusFailed: "The book could not be fully saved because its shelf and reading history did not synchronize. Please try again.",
        saveFailed: "The book data could not be saved. Please try again.",
        unavailable: "Saving is temporarily unavailable. Please try again in a minute.",
      };

  if (status === 429 || code === "too_many_requests") return messages.rateLimited;
  if (status === 401 || code === "unauthorized") return messages.unauthorized;
  if (status === 503 || code === "rate_limit_unavailable") return messages.unavailable;
  if (code === "invalid_book") return messages.invalid;
  if (code === "cover_too_large") return messages.coverTooLarge;
  if (code === "cover_failed") return messages.coverFailed;
  if (code === "status_sync_failed") return messages.statusFailed;
  if (code === "save_failed") return messages.saveFailed;
  return fallback;
}

function fromBook(book: LibraryBook): Draft {
  return { title: book.title, authors: book.authors.join(", "), description: book.description ?? "", coverUrl: book.defaultCoverUrl ?? "", isbn: book.isbn ?? "", publishedYear: book.publishedYear?.toString() ?? "", pageCount: book.pageCount?.toString() ?? "", format: book.format, status: book.status, readingLanguage: book.readingLanguage, season: book.season ?? "", provider: "manual", providerId: "", removeCover: false };
}

function fromResult(book: BookSearchResult): Draft {
  return { title: book.title, authors: book.authors.join(", "), description: book.description ?? "", coverUrl: book.coverUrl ?? "", isbn: book.isbn ?? "", publishedYear: book.publishedYear?.toString() ?? "", pageCount: book.pageCount?.toString() ?? "", format: "print", status: "want", readingLanguage: providerLanguageToReadingLanguage(book.language), season: "", provider: book.provider, providerId: book.providerId, removeCover: false };
}

export function BookDialog({ locale, book, onSaved, trigger }: { locale: Locale; book?: LibraryBook; onSaved: (book: LibraryBook) => void; trigger?: React.ReactNode }) {
  const c = appCopy[locale];
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(book ? fromBook(book) : blank);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [showForm, setShowForm] = useState(Boolean(book));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [coverFileName, setCoverFileName] = useState("");
  const [rereadBusy, setRereadBusy] = useState(false);
  const [rereadError, setRereadError] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(book ? fromBook(book) : blank);
      setShowForm(Boolean(book));
      setResults([]);
      setQuery("");
      setError(null);
      setSearchError(null);
      setHasSearched(false);
      setCoverFileName("");
      setRereadBusy(false);
      setRereadError(false);
    }
    setOpen(nextOpen);
  }

  async function searchBooks(event: React.FormEvent) {
    event.preventDefault();
    const searchQuery = query.trim();
    if (searchQuery.length < 2) return;
    setBusy(true); setError(null); setSearchError(null); setHasSearched(false);
    try {
      const [applicationSearch, browserSearch] = await Promise.all([
        fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}&locale=${locale}`, {
          signal: AbortSignal.timeout(7_000),
        }).then(async (response) => {
          if (response.ok) return { results: ((await response.json()) as { results: BookSearchResult[] }).results, error: null };
          const payload = await response.json().catch(() => null) as { error?: string } | null;
          return { results: [], error: response.status === 429 || payload?.error === "too_many_requests" ? c.searchRateLimited : c.searchUnavailable };
        }).catch(() => ({ results: [], error: c.searchUnavailable })),
        searchBooksInBrowser(searchQuery, locale).catch(() => []),
      ]);
      const combined = rankAndDedupeResults(searchQuery, locale, [
        ...applicationSearch.results,
        ...browserSearch,
      ]);
      setResults(combined);
      setHasSearched(true);
      if (!combined.length && applicationSearch.error) setSearchError(applicationSearch.error);
    } catch { setSearchError(c.searchUnavailable); setHasSearched(true); } finally { setBusy(false); }
  }

  async function startReread() {
    if (!book || !window.confirm(c.startRereadConfirm.replace("{title}", book.title))) return;
    setRereadBusy(true);
    setRereadError(false);
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "reading" }),
      });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { book: LibraryBook };
      onSaved(payload.book);
      setOpen(false);
    } catch {
      setRereadError(true);
    } finally {
      setRereadBusy(false);
    }
  }

  async function saveBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null);
    try {
      const form = new FormData(event.currentTarget);
      form.set("provider", draft.provider);
      form.set("providerId", draft.providerId);
      form.set("coverUrl", draft.coverUrl);
      form.set("removeCover", String(draft.removeCover));
      form.set("readingLanguage", draft.readingLanguage);
      form.set("season", draft.season);
      const response = await fetch(book ? `/api/books/${book.id}` : "/api/books", { method: book ? "PUT" : "POST", body: form });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as SaveErrorPayload | null;
        setError(saveErrorMessage(locale, response.status, payload?.error, c.error));
        return;
      }
      const payload = (await response.json()) as { book: LibraryBook };
      onSaved(payload.book);
      setOpen(false);
      void fetch("/api/books/repair-covers", { method: "POST" }).catch(() => undefined);
    } catch { setError(c.error); } finally { setBusy(false); }
  }

  const field = (key: keyof Draft, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger ?? <Button className="primary-button"><Plus />{c.addBook}</Button>}</DialogTrigger>
      <DialogContent className="book-editor-dialog">
        <DialogHeader><DialogTitle>{book ? c.editTitle : c.addTitle}</DialogTitle><DialogDescription>{book ? c.libraryLead : c.findBook}</DialogDescription></DialogHeader>
        {!showForm ? <div className="book-search-step">
          <form className="book-search-box" onSubmit={searchBooks}><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.findBook} autoFocus /><Button type="submit" disabled={busy || query.trim().length < 2}>{busy ? c.searching : c.search}</Button></form>
          {searchError && <p className="form-error" role="alert">{searchError}</p>}
          <div className="search-results">
            {results.map((result) => <button type="button" key={`${result.provider}:${result.providerId}`} onClick={() => { setDraft(fromResult(result)); setShowForm(true); }}><LibraryBookCover book={{ ...result, coverUrl: result.coverUrl }} /><span><strong>{result.title}</strong><small>{result.authors.join(", ") || "—"}</small><em>{[result.publishedYear, result.pageCount ? `${result.pageCount} p.` : null].filter(Boolean).join(" · ")}</em></span><span>{c.choose}</span></button>)}
          </div>
          {hasSearched && !results.length && !error && <p className="search-empty" role="status">{c.noSearchResults}</p>}
          <Button type="button" variant="outline" onClick={() => { setDraft(blank); setShowForm(true); }}><Plus />{c.manual}</Button>
        </div> : <form className="book-editor-form" onSubmit={saveBook}>
          {!book && <button className="back-to-search" type="button" onClick={() => setShowForm(false)}><X />{c.cancel}</button>}
          <div className="editor-grid">
            <label className="span-two"><span>{c.title}</span><input name="title" required maxLength={300} value={draft.title} onChange={(event) => field("title", event.target.value)} /></label>
            <label className="span-two"><span>{c.authors}</span><input name="authors" maxLength={1000} value={draft.authors} onChange={(event) => field("authors", event.target.value)} placeholder={c.authorsHint} /></label>
            <label><span>{c.status}</span><select name="status" value={draft.status} onChange={(event) => field("status", event.target.value)}>{(["want", "reading", "read", "paused", "dnf"] as const).filter((value) => !(book?.status === "read" && value === "reading")).map((value) => <option key={value} value={value}>{c[value]}</option>)}</select>{book?.status === "read" && <small className="reread-status-hint">{c.rereadStatusHint}</small>}</label>
            <label><span>{c.format}</span><select name="format" value={draft.format} onChange={(event) => field("format", event.target.value)}>{(["print", "ebook", "audiobook"] as const).map((value) => <option key={value} value={value}>{c[value]}</option>)}</select></label>
            <label><span>{c.readingLanguage}</span><select name="readingLanguage" value={draft.readingLanguage} onChange={(event) => field("readingLanguage", event.target.value)}>{(["ru", "en", "other"] as const).map((value) => <option key={value} value={value}>{c[`language_${value}`]}</option>)}</select></label>
            <label><span>{c.seasonShelf}</span><select name="season" value={draft.season} onChange={(event) => field("season", event.target.value)}><option value="">{c.noSeason}</option>{seasons.map((value) => <option key={value} value={value}>{c[value]}</option>)}</select></label>
            <label><span>{c.year}</span><input name="publishedYear" type="number" min="1000" max="2200" value={draft.publishedYear} onChange={(event) => field("publishedYear", event.target.value)} /></label>
            <label><span>{c.pages}</span><input name="pageCount" type="number" min="1" max="100000" value={draft.pageCount} onChange={(event) => field("pageCount", event.target.value)} /></label>
            <label className="span-two"><span>{c.isbn}</span><input name="isbn" maxLength={32} value={draft.isbn} onChange={(event) => field("isbn", event.target.value)} /></label>
            <label className="span-two"><span>{c.description}</span><textarea name="description" maxLength={5000} rows={3} value={draft.description} onChange={(event) => field("description", event.target.value)} /></label>
            <label className="span-two cover-upload"><span>{c.cover}</span><span className="localized-file-input"><input name="cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCoverFileName(event.target.files?.[0]?.name ?? "")} /><span aria-hidden="true">{c.chooseCover}</span><em>{coverFileName || c.noCoverChosen}</em></span><small>{c.coverHint}</small></label>
            {book?.coverUrl && <label className="remove-cover span-two"><input type="checkbox" checked={draft.removeCover} onChange={(event) => field("removeCover", event.target.checked)} />{c.removeCover}</label>}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {book?.status === "read" && <section className="reread-action" aria-labelledby="reread-action-title">
            <span><Repeat2 aria-hidden="true" /></span>
            <div><strong id="reread-action-title">{c.rereadBook}</strong><p>{c.rereadBookLead}</p></div>
            <Button type="button" variant="outline" onClick={() => void startReread()} disabled={busy || rereadBusy}>{rereadBusy ? <LoaderCircle className="spin" /> : <Repeat2 />}{rereadBusy ? c.startingReread : c.startReread}</Button>
          </section>}
          {rereadError && <p className="form-error" role="alert">{c.rereadStartError}</p>}
          <div className="editor-actions"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{c.cancel}</Button><Button className="primary-button" type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" />}{busy ? c.saving : c.save}</Button></div>
        </form>}
      </DialogContent>
    </Dialog>
  );
}

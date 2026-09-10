"use client";

import { useState } from "react";
import { LoaderCircle, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LibraryBookCover } from "@/components/library/book-cover";
import { appCopy } from "@/lib/app-copy";
import { providerLanguageToReadingLanguage } from "@/lib/books/search";
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
  const [error, setError] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [coverFileName, setCoverFileName] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(book ? fromBook(book) : blank);
      setShowForm(Boolean(book));
      setResults([]);
      setQuery("");
      setError(false);
      setSearchError(null);
      setHasSearched(false);
      setCoverFileName("");
    }
    setOpen(nextOpen);
  }

  async function searchBooks(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setBusy(true); setError(false); setSearchError(null); setHasSearched(false);
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query.trim())}&locale=${locale}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        setSearchError(response.status === 429 || payload?.error === "too_many_requests" ? c.searchRateLimited : c.searchUnavailable);
        return;
      }
      const payload = (await response.json()) as { results: BookSearchResult[] };
      setResults(payload.results);
      setHasSearched(true);
    } catch { setSearchError(c.searchUnavailable); } finally { setBusy(false); }
  }

  async function saveBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(false);
    try {
      const form = new FormData(event.currentTarget);
      form.set("provider", draft.provider);
      form.set("providerId", draft.providerId);
      form.set("coverUrl", draft.coverUrl);
      form.set("removeCover", String(draft.removeCover));
      form.set("readingLanguage", draft.readingLanguage);
      form.set("season", draft.season);
      const response = await fetch(book ? `/api/books/${book.id}` : "/api/books", { method: book ? "PUT" : "POST", body: form });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { book: LibraryBook };
      onSaved(payload.book);
      setOpen(false);
    } catch { setError(true); } finally { setBusy(false); }
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
            <label><span>{c.status}</span><select name="status" value={draft.status} onChange={(event) => field("status", event.target.value)}>{(["want", "reading", "read", "paused", "dnf"] as const).map((value) => <option key={value} value={value}>{c[value]}</option>)}</select></label>
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
          {error && <p className="form-error" role="alert">{c.error}</p>}
          <div className="editor-actions"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{c.cancel}</Button><Button className="primary-button" type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" />}{busy ? c.saving : c.save}</Button></div>
        </form>}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import { BookDialog } from "@/components/library/book-dialog";
import { LibraryBookCover } from "@/components/library/book-cover";
import { SeasonIcon, ShelfOrnaments } from "@/components/seasonal/seasonal-art";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { appCopy } from "@/lib/app-copy";
import type { LibraryBook } from "@/lib/books/types";
import { orderedSeasons, type BookSeason } from "@/lib/seasons";
import type { Locale } from "@/lib/shelf-seasons";

export function SeasonalShelves({ locale, books, currentSeason, onSaved }: { locale: Locale; books: LibraryBook[]; currentSeason: BookSeason; onSaved: (book: LibraryBook) => void }) {
  const c = appCopy[locale];
  const seasonOrder = orderedSeasons(currentSeason);

  return <section className="seasonal-library">
    <div className="seasonal-library-intro"><SeasonIcon season={currentSeason} /><div><h2>{c.seasonalShelves}</h2><p>{c.seasonalLead}</p></div></div>
    {seasonOrder.map((season, index) => {
      const shelfBooks = books.filter((book) => book.season === season);
      const bookCount = formatBookCount(locale, shelfBooks.length, { one: c.bookOne, few: c.bookFew, many: c.bookMany });
      const openLabel = c.openSeasonShelf.replace("{season}", c[season]);
      return <Dialog key={season}>
        <article className="seasonal-shelf" data-shelf-season={season}>
          <header className="seasonal-shelf-heading">
            <span className="seasonal-shelf-icon"><SeasonIcon season={season} /></span>
            <div><h3>{c[season]}</h3><small>{bookCount}</small></div>
            {index === 0 && <span className="current-season-label">{c.currentSeason}</span>}
          </header>
          <DialogTrigger asChild>
            <button className="physical-shelf" type="button" aria-label={openLabel}>
              <span className="shelf-scene">
                <span className="shelf-book-spines" aria-hidden="true">
                  {shelfBooks.length ? shelfBooks.map((book, bookIndex) => <span className={`shelf-book-spine spine-style-${bookIndex % 6}`} key={book.id} title={book.title}><span>{book.title}</span></span>) : <span className="empty-shelf-sign"><BookOpen />{c.emptySeasonShelf}</span>}
                </span>
                <ShelfOrnaments season={season} />
              </span>
              <span className="wooden-shelf-board" aria-hidden="true"><span /></span>
              <span className="shelf-open-hint">{c.viewShelf}<ChevronRight /></span>
            </button>
          </DialogTrigger>
        </article>
        <DialogContent className="season-shelf-dialog">
          <DialogHeader>
            <div className="season-dialog-title"><span><SeasonIcon season={season} /></span><div><DialogTitle>{c[season]}</DialogTitle><DialogDescription>{c.seasonShelfDialogLead.replace("{count}", bookCount)}</DialogDescription></div></div>
          </DialogHeader>
          {shelfBooks.length ? <div className="season-shelf-book-grid">{shelfBooks.map((book) => <article className="season-shelf-book-card" key={book.id}>
            <LibraryBookCover book={book} />
            <div className="book-badges"><span className={`status-text status-${book.status}`}>{c[book.status]}</span><span className="language-badge">{book.readingLanguage === "other" ? "•••" : book.readingLanguage.toLocaleUpperCase()}</span></div>
            <h3>{book.title}</h3><p>{book.authors.join(", ") || "—"}</p>
            <BookDialog locale={locale} book={book} onSaved={onSaved} trigger={<Button size="sm" variant="outline">{c.edit}</Button>} />
          </article>)}</div> : <div className="season-dialog-empty"><BookOpen /><p>{c.seasonalEmpty}</p><BookDialog locale={locale} onSaved={onSaved} /></div>}
        </DialogContent>
      </Dialog>;
    })}
  </section>;
}

function formatBookCount(locale: Locale, count: number, forms: { one: string; few: string; many: string }) {
  if (locale === "en") return `${count} ${count === 1 ? forms.one : forms.many}`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form = mod10 === 1 && mod100 !== 11 ? forms.one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? forms.few : forms.many;
  return `${count} ${form}`;
}

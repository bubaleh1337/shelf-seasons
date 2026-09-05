"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookHeart, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Flame, Languages, Layers3, Library, LogOut, Moon, Search, Settings, Sparkles, Sun, Trash2 } from "lucide-react";
import { BookDialog } from "@/components/library/book-dialog";
import { LibraryBookCover } from "@/components/library/book-cover";
import { ReadingDialog } from "@/components/reading/reading-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { appCopy } from "@/lib/app-copy";
import { selectCurrentBook } from "@/lib/books/current";
import type { LibraryBook, LibraryStatus } from "@/lib/books/types";
import { calculateStreaks, localDateKey } from "@/lib/reading/dates";
import type { ReadingSession } from "@/lib/reading/types";
import type { Locale } from "@/lib/shelf-seasons";
import { cn } from "@/lib/utils";

const nav = [
  { id: "home", icon: BookOpen }, { id: "library", icon: Library }, { id: "calendar", icon: CalendarDays },
  { id: "series", icon: Layers3 }, { id: "recaps", icon: Sparkles }, { id: "settings", icon: Settings },
] as const;

export function ShelfSeasonsApp({ locale, section, readerName, timezone, initialTheme, initialBooks, initialSessions }: { locale: Locale; section: string; readerName?: string; timezone: string; initialTheme: "system" | "light" | "dark"; initialBooks: LibraryBook[]; initialSessions: ReadingSession[] }) {
  const c = appCopy[locale];
  const active = nav.some((item) => item.id === section) ? section : "home";
  const [books, setBooks] = useState(initialBooks);
  const [sessions, setSessions] = useState(initialSessions);
  const [dark, setDark] = useState(initialTheme === "dark");

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark, locale]);

  const toggleTheme = (value: boolean) => { setDark(value); document.documentElement.dataset.theme = value ? "dark" : "light"; };
  const saveBook = (saved: LibraryBook) => setBooks((current) => [saved, ...current.filter((book) => book.id !== saved.id)]);
  const saveSession = (saved: ReadingSession) => {
    setSessions((current) => [saved, ...current.filter((session) => session.id !== saved.id)]);
    setBooks((current) => current.map((book) => book.id === saved.bookId ? { ...book, status: "reading" } : book));
  };
  const displayName = readerName?.trim() || "Shelf Seasons";

  return <div className="shelf-app" lang={locale}>
    <aside className="shelf-sidebar" aria-label={c.personalLibrary}>
      <Brand />
      <nav className="sidebar-nav">{nav.map(({ id, icon: Icon }) => <Link key={id} href={`/${locale}/app${id === "home" ? "" : `/${id}`}`} className={cn("nav-link", active === id && "is-active")} aria-current={active === id ? "page" : undefined}><Icon /><span>{c[id]}</span></Link>)}</nav>
      <ReadingDialog locale={locale} books={books} timezone={timezone} onSaved={saveSession} />
      <BookDialog locale={locale} onSaved={saveBook} />
      <div className="reader-mini"><span className="reader-avatar">{displayName.slice(0, 1).toLocaleUpperCase(locale)}</span><span><strong>{displayName}</strong><small>{c.personalLibrary}</small></span></div>
    </aside>
    <main className="shelf-main">
      <header className="topbar"><div className="mobile-brand"><Brand compact /></div><div className="topbar-actions"><Link className="locale-switch" href={`/${locale === "ru" ? "en" : "ru"}/app${active === "home" ? "" : `/${active}`}`}><Languages />{locale === "ru" ? "EN" : "RU"}</Link><button className="theme-button" type="button" onClick={() => toggleTheme(!dark)} aria-label={c.darkMode}>{dark ? <Sun /> : <Moon />}</button></div></header>
      <div className={cn("page-wrap", active === "library" && "page-wrap-wide")}>
        {active === "home" && <Home locale={locale} name={displayName} books={books} sessions={sessions} timezone={timezone} onBookSaved={saveBook} onSessionSaved={saveSession} />}
        {active === "library" && <PersonalLibrary locale={locale} books={books} setBooks={setBooks} onSaved={saveBook} />}
        {active === "calendar" && <ReadingCalendar locale={locale} books={books} sessions={sessions} timezone={timezone} setSessions={setSessions} onSessionSaved={saveSession} />}
        {active === "series" && <FutureSection title={c.series} lead={c.seriesLead} note={c.comingSoon} />}
        {active === "recaps" && <FutureSection title={c.recaps} lead={c.recapsLead} note={c.comingSoon} />}
        {active === "settings" && <SettingsPage locale={locale} dark={dark} toggleTheme={toggleTheme} timezone={timezone} />}
      </div>
    </main>
    <nav className="mobile-nav" aria-label={c.personalLibrary}>{nav.slice(0, 5).map(({ id, icon: Icon }) => <Link key={id} href={`/${locale}/app${id === "home" ? "" : `/${id}`}`} className={cn("mobile-nav-link", active === id && "is-active")}><Icon /><span>{c[id]}</span></Link>)}</nav>
    <div className="mobile-log-wrap"><ReadingDialog locale={locale} books={books} timezone={timezone} onSaved={saveSession} compact /></div>
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={cn("brand", compact && "brand-compact")}><span className="brand-mark"><BookOpen /></span><span>Shelf Seasons</span></div>;
}

function PageIntro({ title, lead, action }: { title: string; lead: string; action?: React.ReactNode }) {
  return <header className="page-intro"><div><h1>{title}</h1><p>{lead}</p></div>{action}</header>;
}

function Home({ locale, name, books, sessions, timezone, onBookSaved, onSessionSaved }: { locale: Locale; name: string; books: LibraryBook[]; sessions: ReadingSession[]; timezone: string; onBookSaved: (book: LibraryBook) => void; onSessionSaved: (session: ReadingSession) => void }) {
  const c = appCopy[locale];
  const firstName = name === "Shelf Seasons" ? "" : `, ${name.split(" ")[0]}`;
  const today = localDateKey(timezone);
  const streaks = calculateStreaks(sessions.map((session) => session.readOn), today);
  const monthPrefix = today.slice(0, 7);
  const monthDays = new Set(sessions.filter((session) => session.readOn.startsWith(monthPrefix)).map((session) => session.readOn)).size;
  const currentBook = selectCurrentBook(books, sessions);
  return <><PageIntro title={`${c.greeting}${firstName}`} lead={c.homeLead} />
    {books.length === 0 ? <section className="personal-empty-hero"><BookHeart /><h2>{c.emptyHome}</h2><p>{c.emptyHomeLead}</p><BookDialog locale={locale} onSaved={onBookSaved} /></section> : <>
      <section className="reading-home-grid">
        {currentBook ? <article className="reading-now-card"><LibraryBookCover book={currentBook} /><div><p className="eyebrow">{c.reading}</p><h2>{currentBook.title}</h2><p>{currentBook.authors.join(", ") || "—"}</p><ReadingDialog locale={locale} books={books} timezone={timezone} onSaved={onSessionSaved} /></div></article> : <article className="reading-now-card reading-now-empty"><span className="reading-empty-icon"><BookOpen /></span><div><p className="eyebrow">{c.reading}</p><h2>{c.noCurrentBook}</h2><p>{c.noCurrentBookLead}</p><ReadingDialog locale={locale} books={books} timezone={timezone} onSaved={onSessionSaved} /></div></article>}
        <div className="streak-summary"><article><Flame /><strong>{streaks.current}</strong><span>{c.days}</span><small>{c.currentStreak}</small></article><article><Sparkles /><strong>{streaks.longest}</strong><span>{c.days}</span><small>{c.longestStreak}</small></article><article><CalendarDays /><strong>{monthDays}</strong><span>{c.readingDays}</span><small>{c.thisMonth}</small></article></div>
      </section>
      <section className="recent-section"><div className="section-heading"><h2>{c.library}</h2><Link href={`/${locale}/app/library`}>{c.openLibrary}</Link></div><div className="personal-book-grid">{books.slice(0, 5).map((book) => <SimpleBookCard key={book.id} locale={locale} book={book} />)}</div></section>
    </>}
  </>;
}

function PersonalLibrary({ locale, books, setBooks, onSaved }: { locale: Locale; books: LibraryBook[]; setBooks: React.Dispatch<React.SetStateAction<LibraryBook[]>>; onSaved: (book: LibraryBook) => void }) {
  const c = appCopy[locale];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | LibraryStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const filtered = useMemo(() => books.filter((book) => `${book.title} ${book.authors.join(" ")}`.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)) && (filter === "all" || book.status === filter)), [books, filter, locale, query]);

  async function remove(book: LibraryBook) {
    if (!window.confirm(c.deleteConfirm)) return;
    setBusyId(book.id); setError(false);
    try { const response = await fetch(`/api/books/${book.id}`, { method: "DELETE" }); if (!response.ok) throw new Error(); setBooks((current) => current.filter((item) => item.id !== book.id)); }
    catch { setError(true); } finally { setBusyId(null); }
  }

  async function archive(book: LibraryBook) {
    setBusyId(book.id); setError(false);
    const form = new FormData();
    form.set("title", book.title); form.set("authors", book.authors.join(", ")); form.set("description", book.description ?? ""); form.set("coverUrl", book.defaultCoverUrl ?? ""); form.set("isbn", book.isbn ?? ""); form.set("publishedYear", book.publishedYear?.toString() ?? ""); form.set("pageCount", book.pageCount?.toString() ?? ""); form.set("format", book.format); form.set("status", "paused"); form.set("provider", "manual"); form.set("providerId", ""); form.set("removeCover", "false");
    try { const response = await fetch(`/api/books/${book.id}`, { method: "PUT", body: form }); if (!response.ok) throw new Error(); const payload = (await response.json()) as { book: LibraryBook }; onSaved(payload.book); }
    catch { setError(true); } finally { setBusyId(null); }
  }

  return <><PageIntro title={c.library} lead={c.libraryLead} action={<BookDialog locale={locale} onSaved={onSaved} />} />
    <div className="library-tools"><label className="search-field"><Search /><span className="sr-only">{c.searchLibrary}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.searchLibrary} /></label><div className="filter-row">{(["all", "reading", "want", "read", "paused", "dnf"] as const).map((value) => <button type="button" key={value} className={cn("filter-chip", filter === value && "is-active")} onClick={() => setFilter(value)}>{c[value]}</button>)}</div></div>
    <div className="library-count">{filtered.length} {c.books}</div>{error && <p className="form-error" role="alert">{c.error}</p>}
    {filtered.length ? <div className="personal-book-grid">{filtered.map((book) => <article className="personal-book-card" key={book.id}><SimpleBookCard locale={locale} book={book} /><div className="book-card-actions"><BookDialog locale={locale} book={book} onSaved={onSaved} trigger={<Button size="sm" variant="outline">{c.edit}</Button>} /><Button size="sm" variant="ghost" onClick={() => archive(book)} disabled={busyId === book.id}>{c.archive}</Button><Button size="sm" variant="ghost" className="delete-book" onClick={() => remove(book)} disabled={busyId === book.id}>{c.delete}</Button></div></article>)}</div> : <div className="empty-state"><BookHeart /><h2>{books.length ? c.noMatches : c.emptyHome}</h2>{books.length === 0 && <BookDialog locale={locale} onSaved={onSaved} />}</div>}
  </>;
}

function SimpleBookCard({ locale, book }: { locale: Locale; book: LibraryBook }) {
  const c = appCopy[locale];
  return <div className="simple-book-card"><LibraryBookCover book={book} /><span className={`status-text status-${book.status}`}>{c[book.status]}</span><h3>{book.title}</h3><p>{book.authors.join(", ") || "—"}</p></div>;
}

function ReadingCalendar({ locale, books, sessions, timezone, setSessions, onSessionSaved }: { locale: Locale; books: LibraryBook[]; sessions: ReadingSession[]; timezone: string; setSessions: React.Dispatch<React.SetStateAction<ReadingSession[]>>; onSessionSaved: (session: ReadingSession) => void }) {
  const c = appCopy[locale];
  const today = localDateKey(timezone);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [view, setView] = useState<"week" | "month" | "year">("month");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const bookMap = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ReadingSession[]>();
    for (const session of sessions) map.set(session.readOn, [...(map.get(session.readOn) ?? []), session]);
    return map;
  }, [sessions]);
  const monthDate = new Date(`${month}-01T12:00:00Z`);
  const monthTitle = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthDate);
  const monthCount = new Set(sessions.filter((session) => session.readOn.startsWith(month)).map((session) => session.readOn)).size;

  function moveMonth(delta: number) {
    const next = new Date(monthDate);
    next.setUTCMonth(next.getUTCMonth() + delta);
    setMonth(next.toISOString().slice(0, 7));
  }

  async function removeSession(session: ReadingSession) {
    if (!window.confirm(c.removeEntryConfirm)) return;
    setDeleteError(false);
    try {
      const response = await fetch(`/api/reading/${session.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setSessions((current) => current.filter((item) => item.id !== session.id));
    } catch { setDeleteError(true); }
  }

  const selectedSessions = selectedDate ? sessionsByDate.get(selectedDate) ?? [] : [];
  return <><PageIntro title={c.calendar} lead={c.calendarLead} action={<ReadingDialog locale={locale} books={books} timezone={timezone} onSaved={onSessionSaved} />} />
    <div className="real-calendar-toolbar"><div className="month-switcher"><Button variant="ghost" size="icon" onClick={() => moveMonth(-1)} aria-label={c.previousMonth}><ChevronLeft /></Button><h2>{monthTitle}</h2><Button variant="ghost" size="icon" onClick={() => moveMonth(1)} aria-label={c.nextMonth}><ChevronRight /></Button></div><div className="calendar-view-switch">{(["week", "month", "year"] as const).map((value) => <button type="button" key={value} className={view === value ? "is-active" : ""} onClick={() => setView(value)}>{value === "week" ? c.weekView : value === "month" ? c.monthView : c.yearView}</button>)}</div></div>
    <div className="calendar-reading-summary"><CalendarDays /><strong>{monthCount}</strong><span>{c.readingDays}</span></div>
    {view === "month" && <MonthCalendar locale={locale} month={month} today={today} sessionsByDate={sessionsByDate} bookMap={bookMap} onSelect={setSelectedDate} />}
    {view === "week" && <WeekCalendar locale={locale} today={today} sessionsByDate={sessionsByDate} bookMap={bookMap} onSelect={setSelectedDate} />}
    {view === "year" && <YearCalendar locale={locale} year={Number(month.slice(0, 4))} sessions={sessions} />}
    <Dialog open={selectedDate !== null} onOpenChange={(open) => { if (!open) setSelectedDate(null); }}><DialogContent className="reading-day-dialog"><DialogHeader><DialogTitle>{selectedDate ? new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${selectedDate}T12:00:00Z`)) : c.calendar}</DialogTitle><DialogDescription>{selectedSessions.length ? `${selectedSessions.length} ${c.entries}` : c.noReadingDay}</DialogDescription></DialogHeader>{deleteError && <p className="form-error">{c.error}</p>}<div className="day-entry-list">{selectedSessions.map((session) => { const book = bookMap.get(session.bookId); return <article key={session.id}>{book && <LibraryBookCover book={book} />}<div><strong>{book?.title ?? c.book}</strong><p>{session.checkInOnly ? c.quickCheckIn : [session.pagesRead ? `${session.pagesRead} ${c.pagesUnit}` : null, session.minutesRead ? `${session.minutesRead} ${c.minutesUnit}` : null, session.resultingPercent !== null ? `${session.resultingPercent}%` : null].filter(Boolean).join(" · ")}</p>{session.note && <small>{session.note}</small>}</div><button type="button" onClick={() => removeSession(session)} aria-label={c.removeEntry}><Trash2 /></button></article>; })}</div></DialogContent></Dialog>
  </>;
}

function MonthCalendar({ locale, month, today, sessionsByDate, bookMap, onSelect }: { locale: Locale; month: string; today: string; sessionsByDate: Map<string, ReadingSession[]>; bookMap: Map<string, LibraryBook>; onSelect: (date: string) => void }) {
  const first = new Date(`${month}-01T12:00:00Z`);
  const total = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const weekdays = locale === "ru" ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cells = Array.from({ length: Math.ceil((offset + total) / 7) * 7 }, (_, index) => index - offset + 1);
  return <div className="real-month-grid">{weekdays.map((day) => <div className="real-weekday" key={day}>{day}</div>)}{cells.map((day, index) => {
    if (day < 1 || day > total) return <div className="real-day is-empty" key={`empty-${index}`} />;
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const entries = sessionsByDate.get(date) ?? [];
    const covers = [...new Set(entries.map((entry) => entry.bookId))].slice(0, 2).map((id) => bookMap.get(id)).filter((book): book is LibraryBook => Boolean(book));
    return <button type="button" key={date} className={cn("real-day", date === today && "is-today", entries.length > 0 && "has-reading")} onClick={() => onSelect(date)}><span>{day}</span><div className="day-covers">{covers.map((book) => <LibraryBookCover key={book.id} book={book} />)}{entries.length > 2 && <b>+{entries.length - 2}</b>}</div></button>;
  })}</div>;
}

function WeekCalendar({ locale, today, sessionsByDate, bookMap, onSelect }: { locale: Locale; today: string; sessionsByDate: Map<string, ReadingSession[]>; bookMap: Map<string, LibraryBook>; onSelect: (date: string) => void }) {
  const base = new Date(`${today}T12:00:00Z`);
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() - ((base.getUTCDay() + 6) % 7));
  return <div className="real-week-grid">{Array.from({ length: 7 }, (_, index) => { const date = new Date(monday); date.setUTCDate(monday.getUTCDate() + index); const key = date.toISOString().slice(0, 10); const entries = sessionsByDate.get(key) ?? []; const book = entries[0] ? bookMap.get(entries[0].bookId) : undefined; return <button type="button" key={key} className={cn(key === today && "is-today")} onClick={() => onSelect(key)}><span>{new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { weekday: "short", timeZone: "UTC" }).format(date)}</span><strong>{date.getUTCDate()}</strong>{book ? <LibraryBookCover book={book} /> : <i />}</button>; })}</div>;
}

function YearCalendar({ locale, year, sessions }: { locale: Locale; year: number; sessions: ReadingSession[] }) {
  return <div className="real-year-grid">{Array.from({ length: 12 }, (_, month) => { const prefix = `${year}-${String(month + 1).padStart(2, "0")}`; const days = new Set(sessions.filter((session) => session.readOn.startsWith(prefix)).map((session) => session.readOn)).size; return <article key={prefix}><strong>{new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)))}</strong><span>{days}</span></article>; })}</div>;
}

function FutureSection({ title, lead, note }: { title: string; lead: string; note: string }) {
  return <><PageIntro title={title} lead={lead} /><div className="empty-state future-empty"><Sparkles /><h2>{note}</h2></div></>;
}

function SettingsPage({ locale, dark, toggleTheme, timezone }: { locale: Locale; dark: boolean; toggleTheme: (value: boolean) => void; timezone: string }) {
  const c = appCopy[locale];
  return <><PageIntro title={c.settings} lead={c.personalLibrary} /><div className="settings-panel">
    <section><h2>{c.appearance}</h2><div className="setting-row"><span className="setting-icon">{dark ? <Moon /> : <Sun />}</span><div><strong>{c.darkMode}</strong></div><Switch checked={dark} onCheckedChange={toggleTheme} /></div></section>
    <section><h2>{c.language}</h2><div className="setting-row"><span className="setting-icon"><Languages /></span><div><strong>{locale === "ru" ? "Русский" : "English"}</strong></div><div className="language-links"><Link className={locale === "en" ? "is-active" : ""} href="/en/app/settings">EN</Link><Link className={locale === "ru" ? "is-active" : ""} href="/ru/app/settings">RU</Link></div></div></section>
    <section><h2>{c.timezone}</h2><div className="setting-row"><span className="setting-icon"><CalendarDays /></span><div><strong>{timezone}</strong><p>{c.timezoneAuto}</p></div></div></section>
    <section><h2>{c.account}</h2><div className="setting-row"><span className="setting-icon"><LogOut /></span><div><strong>Shelf Seasons</strong><p>{c.signedIn}</p></div><form action="/auth/sign-out" method="post"><input type="hidden" name="locale" value={locale} /><Button variant="outline" type="submit">{c.signOut}</Button></form></div></section>
  </div></>;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookHeart,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Languages,
  Layers3,
  Library,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, books, copy, Locale, statusLabel } from "@/lib/shelf-seasons";
import { cn } from "@/lib/utils";

type Props = {
  locale: Locale;
  section: string;
};

const navItems = [
  { id: "home", icon: BookOpen },
  { id: "library", icon: Library },
  { id: "calendar", icon: CalendarDays },
  { id: "series", icon: Layers3 },
  { id: "recaps", icon: Sparkles },
  { id: "settings", icon: Settings },
] as const;

const weekDays = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
};

export function ShelfSeasonsDemo({ locale, section }: Props) {
  const c = copy[locale];
  const activeSection = navItems.some((item) => item.id === section) ? section : "home";
  const [dark, setDark] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleTheme = (checked: boolean) => {
    setDark(checked);
    document.documentElement.dataset.theme = checked ? "dark" : "light";
  };

  return (
    <div className="shelf-app" lang={locale}>
      <aside className="shelf-sidebar" aria-label={locale === "ru" ? "Основная навигация" : "Primary navigation"}>
        <Brand />
        <nav className="sidebar-nav">
          {navItems.map(({ id, icon: Icon }) => {
            const label = c[id];
            return (
              <Link
                key={id}
                href={`/${locale}/app${id === "home" ? "" : `/${id}`}`}
                className={cn("nav-link", activeSection === id && "is-active")}
                aria-current={activeSection === id ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <LogReadingDialog locale={locale} logged={logged} setLogged={setLogged} triggerClass="sidebar-log" />
        <div className="reader-mini">
          <span className="reader-avatar" aria-hidden="true">К</span>
          <span><strong>Katya</strong><small>{locale === "ru" ? "Личная библиотека" : "Personal library"}</small></span>
        </div>
      </aside>

      <main className="shelf-main">
        <header className="topbar">
          <div className="mobile-brand"><Brand compact /></div>
          <div className="topbar-actions">
            <Link className="locale-switch" href={`/${locale === "ru" ? "en" : "ru"}/app${activeSection === "home" ? "" : `/${activeSection}`}`}>
              <Languages aria-hidden="true" />
              {locale === "ru" ? "EN" : "RU"}
            </Link>
            <button className="theme-button" type="button" onClick={() => toggleTheme(!dark)} aria-label={locale === "ru" ? "Переключить тему" : "Toggle theme"}>
              {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>
          </div>
        </header>

        <div className={cn("page-wrap", activeSection === "library" && "page-wrap-wide")}>
          {activeSection === "home" && <Home locale={locale} logged={logged} setLogged={setLogged} />}
          {activeSection === "library" && <LibraryPage locale={locale} />}
          {activeSection === "calendar" && <CalendarPage locale={locale} />}
          {activeSection === "series" && <SeriesPage locale={locale} />}
          {activeSection === "recaps" && <RecapsPage locale={locale} />}
          {activeSection === "settings" && <SettingsPage locale={locale} dark={dark} toggleTheme={toggleTheme} />}
        </div>
      </main>

      <nav className="mobile-nav" aria-label={locale === "ru" ? "Мобильная навигация" : "Mobile navigation"}>
        {navItems.slice(0, 5).map(({ id, icon: Icon }) => (
          <Link
            key={id}
            href={`/${locale}/app${id === "home" ? "" : `/${id}`}`}
            className={cn("mobile-nav-link", activeSection === id && "is-active")}
            aria-current={activeSection === id ? "page" : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{c[id]}</span>
          </Link>
        ))}
      </nav>

      <div className="mobile-log-wrap">
        <LogReadingDialog locale={locale} logged={logged} setLogged={setLogged} iconOnly />
      </div>
    </div>
  );
}

export function OfflinePage({ locale }: { locale: Locale }) {
  return (
    <main className="offline-page" lang={locale}>
      <Brand />
      <BookOpen aria-hidden="true" />
      <h1>{locale === "ru" ? "Сейчас нет подключения" : "You’re offline"}</h1>
      <p>{locale === "ru" ? "Несохранённые отметки не будут потеряны: мы не отправляли их без подключения. Вернись в приложение, когда интернет появится." : "Unsaved check-ins have not been sent. Return to the app when your connection is restored."}</p>
      <Button asChild className="primary-button"><Link href={`/${locale}/app`}>{locale === "ru" ? "Вернуться в приложение" : "Return to the app"}</Link></Button>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("brand", compact && "brand-compact")}>
      <span className="brand-mark" aria-hidden="true"><BookOpen /></span>
      <span>Shelf Seasons</span>
    </div>
  );
}

function PageIntro({ eyebrow, title, lead, action }: { eyebrow?: string; title: string; lead: string; action?: React.ReactNode }) {
  return (
    <header className="page-intro">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{lead}</p>
      </div>
      {action}
    </header>
  );
}

function Home({ locale, logged, setLogged }: { locale: Locale; logged: boolean; setLogged: (value: boolean) => void }) {
  const c = copy[locale];
  return (
    <>
      <PageIntro title={c.greeting} lead={c.homeLead} />
      {logged && <div className="success-banner" role="status"><Check /> {c.loggedToday}</div>}

      <section className="home-grid" aria-label={locale === "ru" ? "Обзор чтения" : "Reading overview"}>
        <article className="current-card">
          <BookCover book={books[0]} size="hero" locale={locale} />
          <div className="current-copy">
            <p className="eyebrow">{c.currentReading}</p>
            <h2>{books[0].title}</h2>
            <p className="author">{books[0].author}</p>
            <div className="progress-copy"><span>62%</span><span>186 / 300 {c.pages}</span></div>
            <Progress value={62} aria-label="62%" className="book-progress" />
            <div className="current-actions">
              <LogReadingDialog locale={locale} logged={logged} setLogged={setLogged} />
              <Button variant="ghost" className="soft-button">{c.viewBook} <ArrowRight /></Button>
            </div>
          </div>
        </article>

        <div className="stat-column">
          <article className="goal-card">
            <div className="goal-ring" style={{ "--goal": "60%" } as React.CSSProperties}>
              <span><strong>18</strong><small>/ 30</small></span>
            </div>
            <div><p className="eyebrow">{c.annualGoal}</p><h3>{c.goalDetail}</h3><p>{locale === "ru" ? "Ещё 12 книг до цели" : "12 books to your goal"}</p></div>
          </article>
          <article className="streak-card">
            <span className="streak-icon"><Flame aria-hidden="true" /></span>
            <div className="streak-main"><strong>12</strong><span>{c.days}</span><small>{c.currentStreak}</small></div>
            <div className="streak-best"><span>{c.bestStreak}</span><strong>28</strong></div>
          </article>
        </div>
      </section>

      <section className="week-card">
        <div className="section-heading"><div><p className="eyebrow">{c.thisWeek}</p><h2>{c.weekDetail}</h2></div><Link href={`/${locale}/app/calendar`}>{c.calendar}<ArrowRight /></Link></div>
        <div className="week-strip">
          {weekDays[locale].map((day, index) => (
            <div className={cn("week-day", index === 3 && "is-today")} key={day}>
              <span>{day}</span>
              <strong>{31 + index > 31 ? index : 31}</strong>
              {index !== 1 && index !== 5 ? <BookCover book={books[index % 4]} size="tiny" locale={locale} /> : <i />}
            </div>
          ))}
        </div>
      </section>

      <section className="recent-section">
        <div className="section-heading"><h2>{c.recentShelf}</h2><Link href={`/${locale}/app/library`}>{c.seeAll}<ArrowRight /></Link></div>
        <div className="book-row">
          {books.slice(1, 6).map((book) => <BookCard key={book.id} book={book} locale={locale} />)}
        </div>
      </section>
    </>
  );
}

function LibraryPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Book["status"]>("all");
  const filtered = useMemo(() => books.filter((book) => {
    const matchesText = `${book.title} ${book.author}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (filter === "all" || book.status === filter);
  }), [query, filter]);

  return (
    <>
      <PageIntro title={c.library} lead={c.libraryLead} action={<Button className="primary-button"><Plus />{c.addBook}</Button>} />
      <div className="library-tools">
        <label className="search-field"><Search aria-hidden="true" /><span className="sr-only">{c.searchBooks}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.searchBooks} /></label>
        <div className="filter-row" role="group" aria-label={locale === "ru" ? "Фильтр полки" : "Shelf filter"}>
          {(["all", "reading", "want", "read", "paused"] as const).map((id) => (
            <button type="button" key={id} className={cn("filter-chip", filter === id && "is-active")} onClick={() => setFilter(id)}>
              {id === "all" ? c.all : c[id]}
            </button>
          ))}
        </div>
      </div>
      <div className="library-count">{filtered.length} {c.books}</div>
      {filtered.length ? <div className="library-grid">{filtered.map((book) => <BookCard key={book.id} book={book} locale={locale} detailed />)}</div> : <div className="empty-state"><BookHeart /><h2>{c.empty}</h2></div>}
    </>
  );
}

function CalendarPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const markedDays: Record<number, number> = { 1: 0, 2: 0, 4: 1, 5: 1, 7: 3, 8: 0, 9: 2, 11: 4, 12: 4, 14: 1, 15: 0, 16: 0, 18: 3, 20: 2, 21: 0, 23: 4, 24: 1, 26: 0, 28: 3, 29: 3 };
  const days = Array.from({ length: 35 }, (_, index) => index < 1 || index > 30 ? null : index);
  return (
    <>
      <PageIntro title={c.calendar} lead={c.calendarLead} />
      <Tabs defaultValue="month" className="calendar-tabs">
        <div className="calendar-toolbar">
          <div className="month-switcher"><Button variant="ghost" size="icon" aria-label={c.previous}><ChevronLeft /></Button><h2>{c.september}</h2><Button variant="ghost" size="icon" aria-label={c.next}><ChevronRight /></Button></div>
          <TabsList><TabsTrigger value="week">{c.week}</TabsTrigger><TabsTrigger value="month">{c.month}</TabsTrigger><TabsTrigger value="year">{c.year}</TabsTrigger></TabsList>
        </div>
        <div className="calendar-summary"><span><strong>16</strong>{c.readingDays}</span><span><strong>743</strong>{c.minutes}</span><span><strong>512</strong>{c.pages}</span></div>
        <TabsContent value="month">
          <div className="month-grid" role="grid" aria-label={c.september}>
            {weekDays[locale].map((day) => <div className="weekday" key={day} role="columnheader">{day}</div>)}
            {days.map((day, index) => <CalendarCell key={index} day={day} book={day ? books[markedDays[day]] : undefined} locale={locale} today={day === 3} />)}
          </div>
        </TabsContent>
        <TabsContent value="week"><WeekPanel locale={locale} /></TabsContent>
        <TabsContent value="year"><YearPanel locale={locale} /></TabsContent>
      </Tabs>
    </>
  );
}

function CalendarCell({ day, book, locale, today }: { day: number | null; book?: Book; locale: Locale; today?: boolean }) {
  if (!day) return <div className="calendar-cell is-empty" role="gridcell" />;
  return (
    <button type="button" className={cn("calendar-cell", book && "has-reading", today && "is-today")} role="gridcell" aria-label={`${day} ${copy[locale].september}${book ? `, ${book.title}` : ""}`}>
      <span className="day-number">{day}</span>
      {book && <BookCover book={book} size="calendar" locale={locale} />}
      {book && <span className="cell-title">{book.title}</span>}
    </button>
  );
}

function WeekPanel({ locale }: { locale: Locale }) {
  return <div className="week-panel">{weekDays[locale].map((day, index) => <article key={day}><span>{day}</span><strong>{index + 1}</strong>{index % 2 === 0 && <div><BookCover book={books[index]} size="tiny" locale={locale} /><p>{books[index].title}</p></div>}</article>)}</div>;
}

function YearPanel({ locale }: { locale: Locale }) {
  const monthNames = locale === "ru" ? ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return <div className="year-panel">{monthNames.map((month, index) => <article key={month}><strong>{month}</strong><div className="mini-mosaic">{Array.from({ length: 20 }, (_, day) => <i key={day} className={(day + index) % 4 === 0 ? "read-dot" : ""} />)}</div></article>)}</div>;
}

function SeriesPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const series = [
    { title: "The Cartographer’s Rooms", status: c.inProgress, progress: "3 / 5", next: books[2], colors: ["forest", "plum", "gold"] },
    { title: "Northern Archives", status: c.planned, progress: "1 / 4", next: books[5], colors: ["ink", "blue", "clay"] },
  ];
  return (
    <>
      <PageIntro title={c.series} lead={c.seriesLead} action={<Button className="primary-button"><Plus />{locale === "ru" ? "Создать серию" : "Create series"}</Button>} />
      <div className="series-grid">
        {series.map((item, index) => (
          <article className="series-card" key={item.title}>
            <div className="series-stack" aria-hidden="true">{item.colors.map((color, colorIndex) => <i className={`palette-${color}`} style={{ transform: `translateX(${colorIndex * 34}px) rotate(${(colorIndex - 1) * 3}deg)`, zIndex: colorIndex }} key={color} />)}</div>
            <div className="series-copy"><span className="status-pill">{item.status}</span><h2>{item.title}</h2><p>{item.progress} {c.volumes}</p><Progress value={index === 0 ? 60 : 25} className="series-progress" /><div className="next-volume"><span>{c.nextBook}</span><strong>{item.next.title}</strong><ArrowRight /></div></div>
          </article>
        ))}
      </div>
    </>
  );
}

function RecapsPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  return (
    <>
      <PageIntro eyebrow={c.septemberRecap} title={c.quietMonth} lead={c.recapLead} />
      <section className="recap-hero">
        <div className="recap-copy"><Sparkles /><h2>{c.quietMonth}</h2><p>{c.quietMonthDetail}</p><div className="recap-stats"><span><strong>3</strong>{c.completed}</span><span><strong>16</strong>{c.readingDays}</span><span><strong>743</strong>{c.minutes}</span></div></div>
        <div className="recap-covers">{books.slice(3, 6).map((book, index) => <div key={book.id} style={{ transform: `translateX(${index * 72}px) rotate(${(index - 1) * 4}deg)`, zIndex: index }}><BookCover book={book} size="recap" locale={locale} /></div>)}</div>
      </section>
      <section className="favorite-card"><BookCover book={books[3]} size="feature" locale={locale} /><div><p className="eyebrow">{c.favorite}</p><h2>{books[3].title}</h2><p className="author">{books[3].author}</p><p className="quote">“{locale === "ru" ? "Книга, к которой хочется возвращаться в самые тихие вечера." : "A book to return to on the quietest evenings."}”</p></div></section>
    </>
  );
}

function SettingsPage({ locale, dark, toggleTheme }: { locale: Locale; dark: boolean; toggleTheme: (value: boolean) => void }) {
  const c = copy[locale];
  return (
    <>
      <PageIntro title={c.settings} lead={c.settingsLead} />
      <div className="settings-panel">
        <section><h2>{c.appearance}</h2><div className="setting-row"><span className="setting-icon">{dark ? <Moon /> : <Sun />}</span><div><strong>{c.darkMode}</strong><p>{c.darkModeDetail}</p></div><Switch checked={dark} onCheckedChange={toggleTheme} aria-label={c.darkMode} /></div></section>
        <section><h2>{c.language}</h2><div className="setting-row"><span className="setting-icon"><Languages /></span><div><strong>{locale === "ru" ? "Русский" : "English"}</strong><p>{c.languageDetail}</p></div><div className="language-links"><Link className={locale === "en" ? "is-active" : ""} href="/en/app/settings">EN</Link><Link className={locale === "ru" ? "is-active" : ""} href="/ru/app/settings">RU</Link></div></div></section>
        <section><h2>{c.timezone}</h2><div className="setting-row"><span className="setting-icon"><Clock3 /></span><div><strong>Asia/Atyrau</strong><p>UTC+05:00</p></div><Button variant="outline">{locale === "ru" ? "Изменить" : "Change"}</Button></div></section>
        <div className="demo-note"><Sparkles /><div><strong>{c.dataNote}</strong><p>{c.dataNoteDetail}</p></div></div>
      </div>
    </>
  );
}

function BookCard({ book, locale, detailed = false }: { book: Book; locale: Locale; detailed?: boolean }) {
  return (
    <article className={cn("book-card", detailed && "book-card-detailed")}>
      <BookCover book={book} size={detailed ? "grid" : "row"} locale={locale} />
      <div className="book-meta"><span className={`status-text status-${book.status}`}>{statusLabel(locale, book.status)}</span><h3>{book.title}</h3><p>{book.author}</p>{book.progress !== undefined && <div className="mini-progress"><i style={{ width: `${book.progress}%` }} /><span>{book.progress}%</span></div>}</div>
    </article>
  );
}

function BookCover({ book, size, locale }: { book: Book; size: "hero" | "row" | "grid" | "tiny" | "calendar" | "recap" | "feature"; locale: Locale }) {
  const alt = locale === "ru" ? `Обложка книги «${book.title}», автор ${book.author}` : `${book.title} by ${book.author} cover`;
  return (
    <div className={cn("book-cover", `cover-${size}`, `palette-${book.palette}`)} title={`${book.title} — ${book.author}`}>
      {book.artwork ? <Image src={book.artwork} alt={alt} fill sizes="(max-width: 768px) 38vw, 220px" priority={size === "hero"} /> : <><span className="cover-flourish" aria-hidden="true">✦</span><strong>{book.title}</strong><small>{book.author}</small></>}
    </div>
  );
}

function LogReadingDialog({ locale, logged, setLogged, triggerClass, iconOnly = false }: { locale: Locale; logged: boolean; setLogged: (value: boolean) => void; triggerClass?: string; iconOnly?: boolean }) {
  const c = copy[locale];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={cn("primary-button", triggerClass, iconOnly && "mobile-log-button")} aria-label={c.logReading}>
          {logged ? <Check /> : <Plus />}{!iconOnly && c.logReading}
        </Button>
      </DialogTrigger>
      <DialogContent className="reading-dialog">
        <DialogHeader><DialogTitle>{c.modalTitle}</DialogTitle><DialogDescription>{c.modalDescription}</DialogDescription></DialogHeader>
        <div className="dialog-book"><BookCover book={books[0]} size="tiny" locale={locale} /><div><strong>{books[0].title}</strong><span>{books[0].author}</span></div></div>
        <div className="entry-fields"><label>{c.date}<input type="date" defaultValue="2026-09-03" /></label><label>{c.timeRead}<span>{c.optional}</span><input type="number" min="0" placeholder="30" /></label><label>{c.pagesRead}<span>{c.optional}</span><input type="number" min="0" placeholder="24" /></label></div>
        {logged && <div className="dialog-success" role="status"><Check />{c.loggedToday}</div>}
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">{c.cancel}</Button></DialogClose>
          <Button className="primary-button" onClick={() => setLogged(true)}>{logged ? <Check /> : null}{logged ? c.loggedToday : c.saveEntry}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

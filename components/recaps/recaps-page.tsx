"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock3, Image, Languages, Layers3, LoaderCircle, Repeat2, Sparkles, Trophy } from "lucide-react";
import { LibraryBookCover } from "@/components/library/book-cover";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/lib/app-copy";
import { currentPeriodStart, shiftPeriod } from "@/lib/recaps/period";
import type { RecapBookCandidate, RecapCategory, RecapPeriodType, RecapSeriesCandidate, RecapSummary } from "@/lib/recaps/types";
import { localDateKey } from "@/lib/reading/dates";
import type { Locale } from "@/lib/shelf-seasons";
import { cn } from "@/lib/utils";

export function RecapsPage({ locale, timezone }: { locale: Locale; timezone: string }) {
  const c = appCopy[locale];
  const today = useMemo(() => localDateKey(timezone), [timezone]);
  const [periodType, setPeriodType] = useState<RecapPeriodType>("month");
  const [periodStart, setPeriodStart] = useState(() => currentPeriodStart("month", today));
  const [summary, setSummary] = useState<RecapSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const latestStart = currentPeriodStart(periodType, today);

  async function retry() {
    setLoading(true); setError(false);
    try {
      setSummary(await requestSummary(periodType, periodStart));
    } catch {
      setError(true); setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let current = true;
    void requestSummary(periodType, periodStart).then((result) => {
      if (!current) return;
      setSummary(result); setError(false); setLoading(false);
    }).catch(() => {
      if (!current) return;
      setSummary(null); setError(true); setLoading(false);
    });
    return () => { current = false; };
  }, [periodStart, periodType]);

  function chooseType(next: RecapPeriodType) {
    setLoading(true); setError(false);
    setPeriodType(next);
    setPeriodStart(currentPeriodStart(next, today));
  }

  function movePeriod(amount: number) {
    setLoading(true); setError(false);
    setPeriodStart(shiftPeriod(periodType, periodStart, amount));
  }

  function saved(category: RecapCategory, valueId: string | null) {
    setSummary((current) => current ? { ...current, selections: { ...current.selections, [category]: valueId ?? undefined } } : current);
  }

  return <>
    <header className="page-intro recap-intro"><div><h1>{c.recaps}</h1><p>{c.recapsLead}</p></div><div className="recap-type-switch" aria-label={c.recapPeriod}>{(["month", "year"] as const).map((type) => <button type="button" key={type} className={cn(periodType === type && "is-active")} onClick={() => chooseType(type)}>{type === "month" ? c.monthRecap : c.yearRecap}</button>)}</div></header>
    <div className="recap-period-nav"><Button variant="outline" size="icon" onClick={() => movePeriod(-1)} aria-label={c.previousPeriod}><ChevronLeft /></Button><strong>{formatPeriod(locale, periodType, periodStart)}</strong><Button variant="outline" size="icon" disabled={periodStart >= latestStart} onClick={() => movePeriod(1)} aria-label={c.nextPeriod}><ChevronRight /></Button></div>
    {loading && <section className="recap-state" aria-live="polite"><LoaderCircle className="spin" /><p>{c.loadingRecap}</p></section>}
    {!loading && error && <section className="recap-state" role="alert"><Sparkles /><h2>{c.recapUnavailable}</h2><Button type="button" variant="outline" onClick={retry}>{c.tryAgain}</Button></section>}
    {!loading && summary && <RecapContent locale={locale} summary={summary} onSaved={saved} />}
  </>;
}

async function requestSummary(periodType: RecapPeriodType, periodStart: string) {
  const query = new URLSearchParams({ periodType, periodStart });
  const response = await fetch(`/api/recaps?${query}`, { cache: "no-store" });
  if (!response.ok) throw new Error("recap_unavailable");
  const payload = (await response.json()) as { summary: RecapSummary };
  return payload.summary;
}

function RecapContent({ locale, summary, onSaved }: { locale: Locale; summary: RecapSummary; onSaved: (category: RecapCategory, valueId: string | null) => void }) {
  const c = appCopy[locale];
  const hasActivity = summary.completedCount > 0 || summary.readingDays > 0;
  const covers = summary.books.slice(0, 5);
  return <div className="real-recap">
    <section className="recap-hero real-recap-hero"><div className="recap-copy"><Sparkles /><span className="recap-state-badge">{summary.isFinal ? c.finalRecap : c.liveRecap}</span><h2>{hasActivity ? c.recapHeroTitle : c.emptyRecapTitle}</h2><p>{hasActivity ? c.recapHeroLead : c.emptyRecapLead}</p><div className="recap-stats"><span><strong>{summary.completedCount}</strong>{c.completedBooks}</span><span><strong>{summary.readingDays}</strong>{c.readingDays}</span><span><strong>{summary.longestStreak}</strong>{c.bestPeriodStreak}</span></div></div><div className="real-recap-covers" aria-hidden="true">{covers.length ? covers.map((candidate, index) => <div key={candidate.runId} style={{ "--recap-cover": index } as React.CSSProperties}><LibraryBookCover book={candidate.book} /></div>) : <div className="empty-recap-cover"><BookOpen /></div>}</div></section>
    <section className="recap-metrics" aria-label={c.recapStatistics}>
      <Metric icon={BookOpen} value={summary.uniqueBooks} label={c.uniqueBooks} />
      <Metric icon={Repeat2} value={summary.rereads} label={c.rereads} />
      <Metric icon={CalendarDays} value={summary.mostActiveWeekDays} label={c.mostActiveWeek} detail={summary.mostActiveWeekStart ? formatWeek(locale, summary.mostActiveWeekStart) : c.noData} />
      <Metric icon={Clock3} value={summary.pagesRead} label={c.pagesUnit} detail={summary.sessionsWithPages ? c.recordedSessions.replace("{count}", String(summary.sessionsWithPages)) : c.noDetailedSessions} />
      <Metric icon={Clock3} value={summary.minutesRead} label={c.minutesUnit} detail={summary.sessionsWithMinutes ? c.recordedSessions.replace("{count}", String(summary.sessionsWithMinutes)) : c.noDetailedSessions} />
      {summary.goal && <Metric icon={Trophy} value={`${summary.goal.completed} / ${summary.goal.target}`} label={c.yearlyGoal} detail={summary.goal.includeRereads ? c.goalIncludesRereads : c.goalExcludesRereads} />}
    </section>
    <section className="recap-languages" aria-label={c.readingLanguages}><div><Languages /><span><strong>{c.readingLanguages}</strong><small>{summary.completedCount} {c.completedBooks}</small></span></div><dl><div><dt>RU</dt><dd><strong>{summary.languageCounts.ru}</strong>{c.booksInRussian}</dd></div><div><dt>EN</dt><dd><strong>{summary.languageCounts.en}</strong>{c.booksInEnglish}</dd></div><div><dt>•••</dt><dd><strong>{summary.languageCounts.other}</strong>{c.booksInOtherLanguages}</dd></div></dl></section>
    {summary.books.length > 0 && <section className="recap-section"><div className="section-heading"><div><span>{c.completedInPeriod}</span><h2>{c.coverMosaic}</h2></div><strong>{summary.completedCount}</strong></div><div className="recap-book-grid">{summary.books.map((candidate) => <article key={candidate.runId}><LibraryBookCover book={candidate.book} /><span>{candidate.isReread ? c.reread : formatShortDate(locale, candidate.finishedOn)}</span><strong>{candidate.book.title}</strong><small>{candidate.book.authors.join(", ")}</small>{candidate.rating !== null && <small aria-label={c.ratingOptional}>★ {candidate.rating}</small>}</article>)}</div></section>}
    <section className="recap-section"><div className="section-heading"><div><span>{c.yourSelections}</span><h2>{c.rememberThisPeriod}</h2></div></div><p className="recap-section-lead">{c.selectionsLead}</p><div className="recap-selection-grid">
      <BookSelection locale={locale} category="favorite_book" title={c.favoriteBook} icon={Trophy} candidates={summary.books} value={summary.selections.favorite_book} summary={summary} onSaved={onSaved} />
      <BookSelection locale={locale} category="biggest_disappointment" title={c.biggestDisappointment} icon={Repeat2} candidates={summary.books} value={summary.selections.biggest_disappointment} summary={summary} onSaved={onSaved} />
      <BookSelection locale={locale} category="favorite_cover" title={c.favoriteCover} icon={Image} candidates={summary.books} value={summary.selections.favorite_cover} summary={summary} onSaved={onSaved} />
      <SeriesSelection locale={locale} candidates={summary.series} value={summary.selections.favorite_series} summary={summary} onSaved={onSaved} />
    </div></section>
    <p className="recap-privacy"><Sparkles />{c.recapPrivacy}</p>
  </div>;
}

function Metric({ icon: Icon, value, label, detail }: { icon: typeof BookOpen; value: number | string; label: string; detail?: string }) {
  return <article><Icon /><strong>{value}</strong><span>{label}</span>{detail && <small>{detail}</small>}</article>;
}

function BookSelection({ locale, category, title, icon: Icon, candidates, value, summary, onSaved }: { locale: Locale; category: Exclude<RecapCategory, "favorite_series">; title: string; icon: typeof BookOpen; candidates: RecapBookCandidate[]; value?: string; summary: RecapSummary; onSaved: (category: RecapCategory, valueId: string | null) => void }) {
  const c = appCopy[locale];
  const ordered = [...candidates].sort((a, b) => Number(preferred(category, b)) - Number(preferred(category, a)) || b.finishedOn.localeCompare(a.finishedOn));
  return <SelectionCard title={title} icon={Icon} value={value} options={ordered.map((candidate) => ({ id: candidate.runId, label: `${candidate.book.title} — ${candidate.book.authors[0] ?? c.unknownAuthor}` }))} summary={summary} category={category} locale={locale} onSaved={onSaved} />;
}

function SeriesSelection({ locale, candidates, value, summary, onSaved }: { locale: Locale; candidates: RecapSeriesCandidate[]; value?: string; summary: RecapSummary; onSaved: (category: RecapCategory, valueId: string | null) => void }) {
  const c = appCopy[locale];
  return <SelectionCard title={c.favoriteSeries} icon={Layers3} value={value} options={candidates.map((series) => ({ id: series.id, label: `${series.name} · ${series.completedInPeriod}/${series.totalVolumes}` }))} summary={summary} category="favorite_series" locale={locale} onSaved={onSaved} />;
}

function SelectionCard({ title, icon: Icon, value, options, summary, category, locale, onSaved }: { title: string; icon: typeof BookOpen; value?: string; options: { id: string; label: string }[]; summary: RecapSummary; category: RecapCategory; locale: Locale; onSaved: (category: RecapCategory, valueId: string | null) => void }) {
  const c = appCopy[locale];
  const [selected, setSelected] = useState(value ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  async function save() {
    setBusy(true); setError(false); setSaved(false);
    try {
      const response = await fetch("/api/recaps/selections", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ periodType: summary.periodType, periodStart: summary.periodStart, category, valueId: selected || null }) });
      if (!response.ok) throw new Error();
      onSaved(category, selected || null); setSaved(true);
    } catch { setError(true); } finally { setBusy(false); }
  }
  return <article className="recap-selection"><span className="selection-icon"><Icon /></span><h3>{title}</h3>{options.length ? <><select aria-label={title} value={selected} onChange={(event) => { setSelected(event.target.value); setSaved(false); }}><option value="">{c.notSelected}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select><Button type="button" variant="outline" onClick={save} disabled={busy}>{busy && <LoaderCircle className="spin" />}{c.saveSelection}</Button>{saved && <small className="selection-success" role="status">{c.selectionSaved}</small>}{error && <small className="form-error" role="alert">{c.error}</small>}</> : <p>{c.noEligibleChoices}</p>}</article>;
}

function preferred(category: RecapCategory, candidate: RecapBookCandidate) {
  return category === "favorite_book" ? candidate.nomination === "favorite" : category === "biggest_disappointment" ? candidate.nomination === "disappointment" : false;
}

function formatPeriod(locale: Locale, type: RecapPeriodType, start: string) {
  if (type === "year") return start.slice(0, 4);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${start}T12:00:00Z`));
}

function formatShortDate(locale: Locale, date: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function formatWeek(locale: Locale, start: string) {
  const from = new Date(`${start}T12:00:00Z`);
  const to = new Date(from); to.setUTCDate(to.getUTCDate() + 6);
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  return `${formatter.format(from)} — ${formatter.format(to)}`;
}

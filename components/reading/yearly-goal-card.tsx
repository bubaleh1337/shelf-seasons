"use client";

import { useState } from "react";
import { BookCheck, BookOpen, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { LibraryBookCover } from "@/components/library/book-cover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { appCopy } from "@/lib/app-copy";
import type { LibraryBook } from "@/lib/books/types";
import { selectGoalRuns } from "@/lib/reading/goals";
import type { ReadingRun, YearlyGoal } from "@/lib/reading/types";
import type { Locale } from "@/lib/shelf-seasons";

function formatCompletionDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function YearlyGoalCard({ locale, year, goal, runs, books, onSaved, onRunRemoved }: { locale: Locale; year: number; goal: YearlyGoal | null; runs: ReadingRun[]; books: LibraryBook[]; onSaved: (goal: YearlyGoal) => void; onRunRemoved: (runId: string) => void }) {
  const c = appCopy[locale];
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [target, setTarget] = useState(String(goal?.targetBooks ?? 12));
  const [includeRereads, setIncludeRereads] = useState(goal?.includeRereads ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState(false);
  const countedRuns = selectGoalRuns(runs, goal);
  const progress = countedRuns.length;
  const booksById = new Map(books.map((book) => [book.id, book]));
  const percentage = goal ? Math.min(100, Math.round((progress / goal.targetBooks) * 100)) : 0;
  const remaining = goal ? Math.max(0, goal.targetBooks - progress) : 0;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/goals", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ year, targetBooks: Number(target), includeRereads }) });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { goal: YearlyGoal };
      onSaved(payload.goal);
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function removeReread(run: ReadingRun, title: string) {
    if (!window.confirm(c.removeGoalRunConfirm.replace("{title}", title))) return;
    setRemovingId(run.id);
    setRemoveError(false);
    try {
      const response = await fetch(`/api/reading/runs/${run.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      onRunRemoved(run.id);
    } catch {
      setRemoveError(true);
    } finally {
      setRemovingId(null);
    }
  }

  return <article className="real-goal-card">
    <div className="goal-ring" style={{ "--goal": `${percentage}%` } as React.CSSProperties}><span><strong>{progress}</strong>{goal && <small>/{goal.targetBooks}</small>}</span></div>
    <div><p className="eyebrow">{c.yearlyGoal} · {year}</p><h2>{goal ? (remaining ? `${remaining} ${c.booksToGoal}` : c.goalReached) : c.noGoal}</h2><p>{goal ? c.goalProgressLead : c.noGoalLead}</p></div>
    <div className="goal-card-actions">
      {goal && <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogTrigger asChild><Button variant="outline" onClick={() => setRemoveError(false)}><BookOpen />{c.viewGoalReads.replace("{count}", String(progress))}</Button></DialogTrigger>
        <DialogContent className="goal-dialog goal-details-dialog"><DialogHeader><DialogTitle>{c.goalBreakdownTitle}</DialogTitle><DialogDescription>{c.goalBreakdownLead.replace("{year}", String(year))}</DialogDescription></DialogHeader>
          {countedRuns.length ? <div className="goal-run-list">{countedRuns.map((run) => {
            const book = booksById.get(run.bookId);
            const title = book?.title ?? c.missingGoalBook;
            return <article key={run.id}>{book ? <LibraryBookCover book={book} /> : <span className="goal-missing-cover"><BookOpen /></span>}<div><strong>{title}</strong><small>{run.finishedOn ? formatCompletionDate(locale, run.finishedOn) : year}</small></div><div className="goal-run-actions">{run.isReread && <span className="goal-reread-badge">{c.reread}</span>}{run.isReread && <button type="button" onClick={() => void removeReread(run, title)} disabled={removingId !== null} aria-label={c.removeGoalRunLabel.replace("{title}", title)} title={c.removeGoalRun}>{removingId === run.id ? <LoaderCircle className="spin" /> : <Trash2 />}</button>}</div></article>;
          })}</div> : <p className="goal-empty-runs">{c.noGoalReads}</p>}
          {removeError && <p className="form-error" role="alert">{c.goalRunRemoveError}</p>}
          {goal.includeRereads && countedRuns.some((run) => run.isReread) && <p className="goal-reread-hint">{c.goalRereadHint}</p>}
        </DialogContent>
      </Dialog>}
      <Dialog open={open} onOpenChange={(next) => { if (next) { setTarget(String(goal?.targetBooks ?? 12)); setIncludeRereads(goal?.includeRereads ?? true); setError(false); } setOpen(next); }}>
        <DialogTrigger asChild><Button variant="outline"><Pencil />{goal ? c.editGoal : c.setGoal}</Button></DialogTrigger>
        <DialogContent className="goal-dialog"><DialogHeader><DialogTitle>{c.yearlyGoal}</DialogTitle><DialogDescription>{c.goalDialogLead}</DialogDescription></DialogHeader><form className="goal-form" onSubmit={save}><label><span>{c.goalTarget}</span><input type="number" min="1" max="999" required value={target} onChange={(event) => setTarget(event.target.value)} /></label><label className="goal-rereads"><input type="checkbox" checked={includeRereads} onChange={(event) => setIncludeRereads(event.target.checked)} /><span>{c.includeRereads}</span></label>{error && <p className="form-error" role="alert">{c.error}</p>}<div className="editor-actions"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{c.cancel}</Button><Button className="primary-button" type="submit" disabled={busy || !target}>{busy ? <LoaderCircle className="spin" /> : <BookCheck />}{busy ? c.saving : c.saveGoal}</Button></div></form></DialogContent>
      </Dialog>
    </div>
  </article>;
}

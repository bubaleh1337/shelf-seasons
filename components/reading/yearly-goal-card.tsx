"use client";

import { useState } from "react";
import { BookCheck, LoaderCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { appCopy } from "@/lib/app-copy";
import type { YearlyGoal } from "@/lib/reading/types";
import type { Locale } from "@/lib/shelf-seasons";

export function YearlyGoalCard({ locale, year, goal, progress, onSaved }: { locale: Locale; year: number; goal: YearlyGoal | null; progress: number; onSaved: (goal: YearlyGoal) => void }) {
  const c = appCopy[locale];
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(String(goal?.targetBooks ?? 12));
  const [includeRereads, setIncludeRereads] = useState(goal?.includeRereads ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
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

  return <article className="real-goal-card">
    <div className="goal-ring" style={{ "--goal": `${percentage}%` } as React.CSSProperties}><span><strong>{progress}</strong>{goal && <small>/{goal.targetBooks}</small>}</span></div>
    <div><p className="eyebrow">{c.yearlyGoal} · {year}</p><h2>{goal ? (remaining ? `${remaining} ${c.booksToGoal}` : c.goalReached) : c.noGoal}</h2><p>{goal ? c.goalProgressLead : c.noGoalLead}</p></div>
    <Dialog open={open} onOpenChange={(next) => { if (next) { setTarget(String(goal?.targetBooks ?? 12)); setIncludeRereads(goal?.includeRereads ?? true); setError(false); } setOpen(next); }}>
      <DialogTrigger asChild><Button variant="outline"><Pencil />{goal ? c.editGoal : c.setGoal}</Button></DialogTrigger>
      <DialogContent className="goal-dialog"><DialogHeader><DialogTitle>{c.yearlyGoal}</DialogTitle><DialogDescription>{c.goalDialogLead}</DialogDescription></DialogHeader><form className="goal-form" onSubmit={save}><label><span>{c.goalTarget}</span><input type="number" min="1" max="999" required value={target} onChange={(event) => setTarget(event.target.value)} /></label><label className="goal-rereads"><input type="checkbox" checked={includeRereads} onChange={(event) => setIncludeRereads(event.target.checked)} /><span>{c.includeRereads}</span></label>{error && <p className="form-error" role="alert">{c.error}</p>}<div className="editor-actions"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{c.cancel}</Button><Button className="primary-button" type="submit" disabled={busy || !target}>{busy ? <LoaderCircle className="spin" /> : <BookCheck />}{busy ? c.saving : c.saveGoal}</Button></div></form></DialogContent>
    </Dialog>
  </article>;
}

"use client";

import { useState } from "react";
import { Check, Heart, LoaderCircle, Star, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { appCopy } from "@/lib/app-copy";
import type { LibraryBook } from "@/lib/books/types";
import { localDateKey } from "@/lib/reading/dates";
import type { ReadingRun } from "@/lib/reading/types";
import type { Locale } from "@/lib/shelf-seasons";
import { cn } from "@/lib/utils";

type Nomination = "favorite" | "disappointment" | null;

export function FinishBookDialog({ locale, book, timezone, onFinished }: { locale: Locale; book: LibraryBook; timezone: string; onFinished: (run: ReadingRun) => void }) {
  const c = appCopy[locale];
  const today = localDateKey(timezone);
  const [open, setOpen] = useState(false);
  const [finishedOn, setFinishedOn] = useState(today);
  const [rating, setRating] = useState("");
  const [impression, setImpression] = useState("");
  const [nomination, setNomination] = useState<Nomination>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  function reset() {
    setFinishedOn(today);
    setRating("");
    setImpression("");
    setNomination(null);
    setError(false);
  }

  async function finish(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/reading/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookId: book.id, finishedOn, rating: rating || null, impression: impression || null, nomination }),
      });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as { run: ReadingRun };
      onFinished(payload.run);
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return <Dialog open={open} onOpenChange={(next) => { if (next) reset(); setOpen(next); }}>
    <DialogTrigger asChild><Button variant="outline"><Check />{c.finishBook}</Button></DialogTrigger>
    <DialogContent className="finish-book-dialog">
      <DialogHeader><DialogTitle>{c.finishBook}</DialogTitle><DialogDescription>{book.title} · {c.finishLead}</DialogDescription></DialogHeader>
      <form className="finish-book-form" onSubmit={finish}>
        <label><span>{c.completionDate}</span><input type="date" value={finishedOn} max={today} onChange={(event) => setFinishedOn(event.target.value)} required /></label>
        <label><span>{c.ratingOptional}</span><select value={rating} onChange={(event) => setRating(event.target.value)}><option value="">{c.noRating}</option>{Array.from({ length: 10 }, (_, index) => (index + 1) / 2).map((value) => <option value={value} key={value}>{value.toFixed(1)} / 5</option>)}</select></label>
        <label><span>{c.impressionOptional}</span><textarea rows={4} maxLength={2000} value={impression} onChange={(event) => setImpression(event.target.value)} placeholder={c.impressionPlaceholder} /></label>
        <fieldset><legend>{c.nominationOptional}</legend><div className="nomination-options"><button type="button" className={cn(nomination === "favorite" && "is-active")} onClick={() => setNomination(nomination === "favorite" ? null : "favorite")} aria-pressed={nomination === "favorite"}><Heart />{c.favoriteCandidate}</button><button type="button" className={cn(nomination === "disappointment" && "is-active")} onClick={() => setNomination(nomination === "disappointment" ? null : "disappointment")} aria-pressed={nomination === "disappointment"}><ThumbsDown />{c.disappointmentCandidate}</button></div></fieldset>
        {rating && <p className="rating-preview"><Star />{rating} / 5</p>}
        {error && <p className="form-error" role="alert">{c.error}</p>}
        <div className="editor-actions"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>{c.cancel}</Button><Button className="primary-button" type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" />}{busy ? c.saving : c.complete}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

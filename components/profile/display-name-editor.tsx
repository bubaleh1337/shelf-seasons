"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, UserRound } from "lucide-react";
import { appCopy } from "@/lib/app-copy";
import type { Locale } from "@/lib/shelf-seasons";

export function DisplayNameEditor({ locale, displayName, onSaved }: { locale: Locale; displayName: string; onSaved: (name: string) => void }) {
  const c = appCopy[locale];
  const [draft, setDraft] = useState(displayName === "Shelf Seasons" ? "" : displayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(false);
    setSaved(false);
    try {
      const response = await fetch("/api/profile/name", {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      if (!response.ok) throw new Error("name_update_failed");
      const payload = (await response.json()) as { displayName: string };
      onSaved(payload.displayName);
      setSaved(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return <section className="profile-name-section">
    <h2>{c.profileNameHeading}</h2>
    <form className="profile-name-form" onSubmit={(event) => void submit(event)}>
      <label htmlFor="profile-public-name"><UserRound aria-hidden="true" /> {c.profileNameLabel}</label>
      <div className="profile-name-fields">
        <input id="profile-public-name" type="text" maxLength={80} required value={draft} onChange={(event) => { setDraft(event.target.value); setSaved(false); }} autoComplete="nickname" />
        <button type="submit" disabled={busy || !draft.trim() || draft.trim() === displayName}>{busy && <LoaderCircle className="spin" aria-hidden="true" />}{busy ? c.saving : c.profileSaveName}</button>
      </div>
      <p className="club-muted">{c.profileNameHint}</p>
      {error && <p className="form-error" role="alert">{c.profileNameError}</p>}
      {saved && <p className="club-completed" role="status">{c.profileNameSaved}</p>}
    </form>
  </section>;
}

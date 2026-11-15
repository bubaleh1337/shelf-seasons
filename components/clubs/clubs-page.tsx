"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { BookOpen, Check, Copy, LoaderCircle, Plus, UsersRound, ArrowLeft } from "lucide-react";
import { appCopy } from "@/lib/app-copy";
import { BookDialog, type ClubBookPrefill } from "@/components/library/book-dialog";
import type { LibraryBook } from "@/lib/books/types";
import type { Locale } from "@/lib/shelf-seasons";

type Club = { id: string; ownerId: string; name: string; createdAt: string };
type ClubMember = { userId: string; name: string; joinedAt: string };
type ClubRead = { id: string; title: string; authors: string[]; isbn: string | null; publishedYear: number | null; pageCount: number | null; format: LibraryBook["format"]; readingLanguage: LibraryBook["readingLanguage"]; coverUrl: string | null; startedOn: string; targetOn: string | null; status: string; createdAt: string };
type MemberProgress = { readId: string; userId: string; currentPage: number | null; totalPages: number | null; percent: number | null; isComplete: boolean };
type ClubDetail = { club: Club & { inviteToken: string }; myUserId: string; members: ClubMember[]; reads: ClubRead[]; progress: MemberProgress[] };

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: "no-store" });
  if (!response.ok) throw new Error(`request_failed_${response.status}`);
  return response.json() as Promise<T>;
}

const jsonHeaders = { "content-type": "application/json" };

export function ClubsPage({ locale, books, today, onBookSaved }: { locale: Locale; books: LibraryBook[]; today: string; onBookSaved: (book: LibraryBook) => void }) {
  const c = appCopy[locale];
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClubDetail | null>(null);
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [targetOn, setTargetOn] = useState("");
  const [pendingBookId, setPendingBookId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadClubs = useCallback(async () => {
    const response = await requestJson<{ clubs: Club[] }>("/api/clubs");
    setClubs(response.clubs);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const response = await requestJson<ClubDetail>(`/api/clubs/${encodeURIComponent(id)}`);
    setDetail(response);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const invite = url.searchParams.get("invite");
    const id = url.searchParams.get("club");
    let mounted = true;
    void requestJson<{ clubs: Club[] }>("/api/clubs")
      .then((response) => {
        if (mounted) setClubs(response.clubs);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (!mounted) return;
        if (invite && /^[a-f0-9]{32}$/.test(invite)) setToken(invite);
        if (id && /^[a-f0-9-]{36}$/i.test(id)) {
          setSelectedId(id);
          setLoading(true);
        } else {
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let mounted = true;
    void requestJson<ClubDetail>(`/api/clubs/${encodeURIComponent(selectedId)}`)
      .then((response) => {
        if (mounted) setDetail(response);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [selectedId]);

  // Refresh open clubs without requiring a second action after a friend logs reading.
  // Pause polling when the tab is hidden to avoid unnecessary database traffic.
  useEffect(() => {
    if (!selectedId) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadDetail(selectedId).catch(() => setError(true));
      }
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [selectedId, loadDetail]);

  const activeRead = useMemo(() => detail?.reads.find((read) => read.status === "active") ?? null, [detail]);
  const ownProgress = useMemo(() => detail?.progress.find((item) => item.readId === activeRead?.id && item.userId === detail.myUserId), [activeRead, detail]);
  const owner = detail?.club.ownerId === detail?.myUserId;
  const recommendedBook = useMemo(() => {
    if (!activeRead) return null;
    const normalized = (value: string) => value.trim().toLocaleLowerCase();
    const matches = books.filter((book) => activeRead.isbn
      ? Boolean(book.isbn && normalized(book.isbn) === normalized(activeRead.isbn))
      : normalized(book.title) === normalized(activeRead.title)
        && normalized(book.authors.join(",")) === normalized(activeRead.authors.join(",")));
    return matches.length === 1 ? matches[0] : null;
  }, [activeRead, books]);
  const prefill: ClubBookPrefill | null = activeRead ? {
    title: activeRead.title, authors: activeRead.authors, isbn: activeRead.isbn,
    publishedYear: activeRead.publishedYear, pageCount: activeRead.pageCount,
    format: activeRead.format, readingLanguage: activeRead.readingLanguage,
    coverUrl: activeRead.coverUrl,
  } : null;

  function selectClub(id: string | null) {
    setError(false);
    setCopied(false);
    setDetail(null);
    setPendingBookId(null);
    setReplacing(false);
    setLoading(Boolean(id));
    setSelectedId(id);
    window.history.replaceState(null, "", `/${locale}/app/clubs${id ? `?club=${encodeURIComponent(id)}` : ""}`);
  }

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(false);
    try { await action(); } catch { setError(true); } finally { setBusy(false); }
  }

  function createClub(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    void act(async () => {
      const response = await requestJson<{ club: Club }>("/api/clubs", {
        method: "POST", headers: jsonHeaders, body: JSON.stringify({ name: name.trim() }),
      });
      setName("");
      await loadClubs();
      selectClub(response.club.id);
    });
  }

  function joinClub(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void act(async () => {
      const response = await requestJson<{ clubId: string }>("/api/clubs/join", {
        method: "POST", headers: jsonHeaders, body: JSON.stringify({ token: token.trim().toLowerCase() }),
      });
      setToken("");
      await loadClubs();
      selectClub(response.clubId);
    });
  }

  function startRead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || !selectedBook) return;
    void act(async () => {
      const { readId } = await requestJson<{ readId: string }>(`/api/clubs/${detail.club.id}/reads`, {
        method: "POST", headers: jsonHeaders,
        body: JSON.stringify({ bookId: selectedBook, startedOn: today, targetOn: targetOn || null }),
      });
      await requestJson(`/api/clubs/${detail.club.id}/progress`, {
        method: "POST", headers: jsonHeaders,
        body: JSON.stringify({ readId, bookId: selectedBook }),
      });
      setSelectedBook("");
      setTargetOn("");
      await loadDetail(detail.club.id);
    });
  }

  function replaceRead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!owner || !detail || !activeRead || !selectedBook) return;
    const nextBook = books.find((item) => item.id === selectedBook);
    if (!nextBook || !window.confirm(c.clubReplaceConfirm
      .replace("{old}", activeRead.title)
      .replace("{new}", nextBook.title))) return;
    void act(async () => {
      await requestJson<{ readId: string }>(`/api/clubs/${detail.club.id}/reads/${activeRead.id}/replace`, {
        method: "POST", headers: jsonHeaders,
        body: JSON.stringify({ bookId: selectedBook, startedOn: today, targetOn: targetOn || null }),
      });
      setReplacing(false);
      setSelectedBook("");
      setTargetOn("");
      setPendingBookId(null);
      await loadDetail(detail.club.id);
    });
  }

  function finishRead(readId: string) {
    if (!detail || !window.confirm(c.clubFinishConfirm)) return;
    void act(async () => {
      await requestJson(`/api/clubs/${detail.club.id}/reads/${readId}`, { method: "PATCH" });
      await loadDetail(detail.club.id);
    });
  }

  async function linkMyBook(bookId: string) {
    if (!detail || !activeRead) return;
    await requestJson(`/api/clubs/${detail.club.id}/progress`, {
      method: "POST", headers: jsonHeaders,
      body: JSON.stringify({ readId: activeRead.id, bookId }),
    });
    await loadDetail(detail.club.id);
    setPendingBookId(null);
  }

  function connectExistingBook(bookId: string) {
    setPendingBookId(bookId);
    void act(() => linkMyBook(bookId));
  }

  function onClubBookSaved(saved: LibraryBook) {
    // The normal personal book editor already saved this independent edition.
    // A failed link never deletes the book; retry remains available.
    onBookSaved(saved);
    setPendingBookId(saved.id);
    void act(() => linkMyBook(saved.id));
  }

  function unlinkProgress() {
    if (!detail || !activeRead || !window.confirm(c.clubUnlinkConfirm)) return;
    void act(async () => {
      await requestJson(`/api/clubs/${detail.club.id}/progress`, {
        method: "DELETE", headers: jsonHeaders, body: JSON.stringify({ readId: activeRead.id }),
      });
      await loadDetail(detail.club.id);
    });
  }

  function leaveOrDelete() {
    if (!detail || !window.confirm(owner ? c.clubDeleteConfirm : c.clubLeaveConfirm)) return;
    void act(async () => {
      await requestJson(`/api/clubs/${detail.club.id}`, { method: "DELETE" });
      await loadClubs();
      selectClub(null);
    });
  }

  async function copyInvite() {
    if (!detail) return;
    try {
      const link = `${window.location.origin}/${locale}/app/clubs?invite=${detail.club.inviteToken}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch { setError(true); }
  }

  return <section className="clubs-page">
    <div className="clubs-heading">
      {selectedId && <button type="button" className="club-back" onClick={() => selectClub(null)} aria-label={c.clubBack}><ArrowLeft /></button>}
      <div><h1>{selectedId && detail ? detail.club.name : c.clubs}</h1><p>{selectedId ? c.clubLeadDetail : c.clubsLead}</p></div>
    </div>
    {error && <p className="club-error" role="alert">{c.clubError} <button type="button" onClick={() => { setError(false); if (selectedId) void loadDetail(selectedId).catch(() => setError(true)); else void loadClubs().catch(() => setError(true)); }}>{c.tryAgain}</button></p>}
    {loading && <p className="club-muted" role="status"><LoaderCircle className="spin" /> {c.clubLoading}</p>}
    {!selectedId && !loading && <>
      <div className="club-forms">
        <form className="club-panel" onSubmit={createClub}>
          <h2><Plus />{c.clubCreate}</h2>
          <label htmlFor="club-name">{c.clubName}</label>
          <input id="club-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder={c.clubNameHint} />
          <button className="club-primary" type="submit" disabled={busy || !name.trim()}>{c.clubCreateButton}</button>
        </form>
        <form className="club-panel" onSubmit={joinClub}>
          <h2><UsersRound />{c.clubJoin}</h2>
          <label htmlFor="club-token">{c.clubInviteCode}</label>
          <input id="club-token" value={token} onChange={(event) => setToken(event.target.value)} maxLength={32} required placeholder={c.clubInviteHint} />
          <button className="club-primary" type="submit" disabled={busy || !/^[a-f0-9]{32}$/i.test(token.trim())}>{c.clubJoinButton}</button>
        </form>
      </div>
      <h2 className="clubs-subheading">{c.clubMyClubs}</h2>
      {clubs.length ? <div className="club-list">{clubs.map((club) => <button className="club-list-item" key={club.id} type="button" onClick={() => selectClub(club.id)}><UsersRound /><span><strong>{club.name}</strong><small>{c.clubOpen}</small></span></button>)}</div> : <p className="club-muted">{c.clubEmpty}</p>}
    </>}
    {selectedId && detail && !loading && <>
      <div className="club-panel club-invite-panel">
        <div><h2>{c.clubInviteMembers}</h2><p className="club-muted">{c.clubInvitePrivacy}</p></div>
        <div className="club-invite-actions">
          <button className="club-secondary" type="button" onClick={() => void copyInvite()}><Copy /> {copied ? c.clubCopied : c.clubCopyLink}</button>
          <button className="club-secondary club-danger" type="button" disabled={busy} onClick={leaveOrDelete}>{owner ? c.clubDelete : c.clubLeave}</button>
        </div>
      </div>
      <div className="club-read-grid">
        <section className="club-panel club-read-panel">
          <h2><BookOpen /> {c.clubCurrentRead}</h2>
          {activeRead ? <>
            <h3>{activeRead.title}</h3>
            <p className="club-muted">{activeRead.authors.join(", ") || "—"}</p>
            {activeRead.targetOn && <p className="club-muted">{c.clubGoalDate}: {new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${activeRead.targetOn}T12:00:00Z`))}</p>}
            <div className="club-progress-list">{detail.members.map((member) => {
              const progress = detail.progress.find((item) => item.userId === member.userId && item.readId === activeRead.id);
              const percentage = progress ? (progress.percent ?? 0) : 0;
              return <div className="club-progress-person" key={member.userId}>
                <div className="club-progress-label"><strong>{member.name}{member.userId === detail.myUserId ? ` · ${c.clubYou}` : ""}</strong><span>{progress ? `${percentage}%` : c.clubNotLinked}</span></div>
                <div className="club-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} aria-label={`${member.name}: ${percentage}%`}><span style={{ width: `${percentage}%` }} /></div>
                {progress?.currentPage !== null && progress?.currentPage !== undefined && progress?.totalPages && <small className="club-muted">{progress.currentPage} / {progress.totalPages} {c.clubPages}</small>}
                {progress?.isComplete && <small className="club-completed"><Check /> {c.clubComplete}</small>}
              </div>;
            })}</div>
            <div className="club-link-form">
              {ownProgress ? <>
                <p className="club-completed"><Check aria-hidden="true" /> {c.clubLibraryConnected}</p>
                <p className="club-muted">{c.clubLinkHint}</p>
                {recommendedBook && <BookDialog locale={locale} book={recommendedBook} onSaved={onBookSaved}
                  trigger={<button type="button" className="club-secondary">{c.clubEditPersonalEdition}</button>} />}
                <button className="club-secondary" type="button" disabled={busy} onClick={unlinkProgress}>{c.clubUnlink}</button>
              </> : <>
                <h3>{c.clubAddBookQuestion}</h3>
                <p className="club-muted">{c.clubAddBookLead}</p>
                {recommendedBook && <>
                  <p className="club-muted">{c.clubAlreadyHaveBook}</p>
                  <button type="button" className="club-primary" disabled={busy}
                    onClick={() => connectExistingBook(recommendedBook.id)}>{c.clubConnectExisting}</button>
                </>}
                {prefill && <BookDialog locale={locale} prefill={prefill} onSaved={onClubBookSaved}
                  trigger={<button type="button" className="club-secondary">{recommendedBook ? c.clubAddDifferentEdition : c.clubAddBookButton}</button>} />}
                {pendingBookId && <button type="button" className="club-primary" disabled={busy}
                  onClick={() => connectExistingBook(pendingBookId)}>{c.clubRetryConnecting}</button>}
                <p className="club-muted">{c.clubLinkHint}</p>
              </>}
            </div>
            {owner && <div className="club-organizer-actions">
              <div className="club-organizer-manage">
                <button className="club-secondary club-change-action" type="button" disabled={busy}
                aria-expanded={replacing}
                onClick={() => {
                  setReplacing((current) => !current);
                  setSelectedBook("");
                  setTargetOn(activeRead.targetOn ?? "");
                }}>{c.clubReplaceBook}</button>
              {replacing && <form className="club-create-read club-replace-form" onSubmit={replaceRead}>
                <p className="club-muted">{c.clubReplaceHint}</p>
                <label htmlFor="club-replace-book">{c.clubSelectBook}</label>
                <select id="club-replace-book" required value={selectedBook}
                  onChange={(event) => setSelectedBook(event.target.value)}>
                  <option value="">{c.clubChooseBook}</option>
                  {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
                </select>
                <label htmlFor="club-replace-target">{c.clubTargetOptional}</label>
                <input type="date" id="club-replace-target" min={today} value={targetOn}
                  onChange={(event) => setTargetOn(event.target.value)} />
                <button className="club-primary" type="submit" disabled={busy || !selectedBook}>
                  {busy ? c.saving : c.clubConfirmReplace}
                </button>
              </form>}
              </div>
              <div className="club-organizer-complete">
                <p className="club-muted">{c.clubFinishHint}</p>
                <button className="club-secondary club-finish-success" type="button" disabled={busy}
                  onClick={() => finishRead(activeRead.id)}><Check aria-hidden="true" />{c.clubFinishRead}</button>
              </div>
            </div>}
          </> : owner ? <form className="club-create-read" onSubmit={startRead}>
            <p className="club-muted">{c.clubNewReadLead}</p>
            <label htmlFor="club-book">{c.clubSelectBook}</label>
            <select id="club-book" required value={selectedBook} onChange={(event) => setSelectedBook(event.target.value)}><option value="">{c.clubChooseBook}</option>{books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</select>
            <label htmlFor="club-target">{c.clubTargetOptional}</label>
            <input type="date" id="club-target" min={today} value={targetOn} onChange={(event) => setTargetOn(event.target.value)} />
            <button className="club-primary" disabled={busy || !selectedBook} type="submit">{c.clubStartReading}</button>
          </form> : <p className="club-muted">{c.clubWaiting}</p>}
        </section>
        <aside className="club-panel club-side-panel">
          <h2><UsersRound />{c.clubMembers} · {detail.members.length}</h2>
          <ul className="club-member-list">{detail.members.map((member) => <li key={member.userId}>{member.name}{member.userId === detail.club.ownerId && <small>{c.clubOwner}</small>}</li>)}</ul>
          <h2>{c.clubPastReads}</h2>
          {detail.reads.filter((read) => read.status !== "active").length ? <ul className="club-history-list">{detail.reads.filter((read) => read.status !== "active").map((read) => <li key={read.id}>{read.title}{read.status === "replaced" && <small> · {c.clubReplaced}</small>}</li>)}</ul> : <p className="club-muted">{c.clubNoPastReads}</p>}
        </aside>
      </div>
    </>}
  </section>;
}

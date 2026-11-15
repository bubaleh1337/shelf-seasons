import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

const readSchema = z.object({
  bookId: z.string().uuid(),
  startedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).refine((value) => !value.targetOn || value.targetOn >= value.startedOn);

type Context = { params: Promise<{ clubId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { clubId } = await params;
  if (!z.string().uuid().safeParse(clubId).success) return NextResponse.json({ error: "invalid_club" }, { status: 400 });
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = readSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_read" }, { status: 400 });
  const { data: book } = await supabase.from("library_books")
    .select("title,authors,isbn,published_year,page_count,format,reading_language,cover_url").eq("id", parsed.data.bookId).eq("user_id", userId).maybeSingle();
  if (!book) return NextResponse.json({ error: "book_not_found" }, { status: 404 });
  const sharedCoverUrl = (() => {
    if (!book.cover_url) return null;
    try {
      const url = new URL(book.cover_url);
      return url.protocol === "https:" && ["books.google.com", "books.googleusercontent.com", "covers.openlibrary.org"].includes(url.hostname)
        ? url.href : null;
    } catch { return null; }
  })();
  const { data: read, error } = await supabase.from("book_club_reads")
    .insert({
      club_id: clubId, created_by: userId, title: book.title, authors: book.authors,
      isbn: book.isbn, published_year: book.published_year, page_count: book.page_count,
      format: book.format, reading_language: book.reading_language, cover_url: sharedCoverUrl,
      started_on: parsed.data.startedOn, target_on: parsed.data.targetOn,
    })
    .select("id").single();
  if (error || !read) return NextResponse.json({ error: "read_create_failed" }, { status: 400 });
  return NextResponse.json({ readId: read.id }, { status: 201 });
}

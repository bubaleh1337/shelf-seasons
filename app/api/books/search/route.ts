import { NextRequest, NextResponse } from "next/server";
import type { BookSearchResult } from "@/lib/books/types";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

const cleanCover = (url?: string) => url?.replace(/^http:/, "https:") ?? null;
const yearFrom = (value?: string) => {
  const match = value?.match(/\b(1\d{3}|20\d{2}|21\d{2})\b/);
  return match ? Number(match[1]) : null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!(await requireUser(supabase))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const locale = request.nextUrl.searchParams.get("locale") === "ru" ? "ru" : "en";
  if (query.length < 2 || query.length > 200) return NextResponse.json({ results: [] });

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=12&printType=books&orderBy=relevance&langRestrict=${locale}`,
      { signal: AbortSignal.timeout(8_000), next: { revalidate: 3600 } },
    );
    if (response.ok) {
      const payload = (await response.json()) as {
        items?: Array<{ id: string; volumeInfo?: { title?: string; authors?: string[]; description?: string; publishedDate?: string; pageCount?: number; imageLinks?: { thumbnail?: string }; industryIdentifiers?: Array<{ type: string; identifier: string }> } }>;
      };
      const results: BookSearchResult[] = (payload.items ?? []).flatMap((item) => {
        const info = item.volumeInfo;
        if (!info?.title) return [];
        return [{
          provider: "google_books",
          providerId: item.id,
          title: info.title,
          authors: info.authors ?? [],
          description: info.description ?? null,
          coverUrl: cleanCover(info.imageLinks?.thumbnail),
          isbn: info.industryIdentifiers?.find((value) => value.type === "ISBN_13")?.identifier ?? info.industryIdentifiers?.[0]?.identifier ?? null,
          publishedYear: yearFrom(info.publishedDate),
          pageCount: info.pageCount ?? null,
        }];
      });
      if (results.length) return NextResponse.json({ results });
    }
  } catch {
    // Continue with the fallback provider.
  }

  try {
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`, {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error("provider_failed");
    const payload = (await response.json()) as { docs?: Array<{ key?: string; title?: string; author_name?: string[]; first_publish_year?: number; isbn?: string[]; cover_i?: number; number_of_pages_median?: number }> };
    const results: BookSearchResult[] = (payload.docs ?? []).flatMap((book) => {
      if (!book.key || !book.title) return [];
      return [{ provider: "open_library", providerId: book.key, title: book.title, authors: book.author_name ?? [], description: null, coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null, isbn: book.isbn?.[0] ?? null, publishedYear: book.first_publish_year ?? null, pageCount: book.number_of_pages_median ?? null }];
    });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "search_failed" }, { status: 502 });
  }
}

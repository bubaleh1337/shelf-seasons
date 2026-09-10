import { NextRequest, NextResponse } from "next/server";
import {
  knownAlternateTitle,
  rankAndDedupeResults,
  type RankedBookSearchResult,
} from "@/lib/books/search";
import { requireUser } from "@/lib/books/server";
import { identifyGoogleBooksRequest } from "@/lib/books/google";
import { createClient } from "@/lib/supabase/server";
import { rateLimitResponse } from "@/lib/security/rate-limit";

const cleanCover = (url?: string) => url?.replace(/^http:/, "https:") ?? null;
const yearFrom = (value?: string) => {
  const match = value?.match(/\b(1\d{3}|20\d{2}|21\d{2})\b/);
  return match ? Number(match[1]) : null;
};

type GooglePayload = {
  items?: Array<{
    id: string;
    volumeInfo?: {
      title?: string;
      authors?: string[];
      description?: string;
      publishedDate?: string;
      pageCount?: number;
      language?: string;
      imageLinks?: { extraLarge?: string; large?: string; medium?: string; small?: string; thumbnail?: string; smallThumbnail?: string };
      industryIdentifiers?: Array<{ type: string; identifier: string }>;
    };
  }>;
};

async function searchGoogle(query: string, language?: "ru" | "en") {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.search = new URLSearchParams({
    q: query,
    maxResults: "12",
    printType: "books",
    orderBy: "relevance",
    ...(language ? { langRestrict: language } : {}),
  }).toString();
  const response = await fetch(identifyGoogleBooksRequest(url), {
    signal: AbortSignal.timeout(4_000),
    next: { revalidate: 3600 },
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as GooglePayload;
  return (payload.items ?? []).flatMap<RankedBookSearchResult>((item) => {
    const info = item.volumeInfo;
    if (!info?.title) return [];
    return [
      {
        provider: "google_books",
        providerId: item.id,
        title: info.title,
        authors: info.authors ?? [],
        description: info.description ?? null,
        coverUrl: cleanCover(info.imageLinks?.extraLarge ?? info.imageLinks?.large ?? info.imageLinks?.medium ?? info.imageLinks?.small ?? info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
        isbn:
          info.industryIdentifiers?.find((value) => value.type === "ISBN_13")
            ?.identifier ?? info.industryIdentifiers?.[0]?.identifier ?? null,
        publishedYear: yearFrom(info.publishedDate),
        pageCount: info.pageCount ?? null,
        language: info.language ?? null,
      },
    ];
  });
}

async function searchOpenLibrary(query: string) {
  const url = new URL("https://openlibrary.org/search.json");
  url.search = new URLSearchParams({
    q: query,
    limit: "12",
    fields:
      "key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median,language",
  }).toString();
  const response = await fetch(url, {
    signal: AbortSignal.timeout(4_000),
    next: { revalidate: 3600 },
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      first_publish_year?: number;
      isbn?: string[];
      cover_i?: number;
      number_of_pages_median?: number;
      language?: string[];
    }>;
  };
  return (payload.docs ?? []).flatMap<RankedBookSearchResult>((book) => {
    if (!book.key || !book.title) return [];
    return [
      {
        provider: "open_library",
        providerId: book.key,
        title: book.title,
        authors: book.author_name ?? [],
        description: null,
        coverUrl: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg?default=false`
          : null,
        isbn: book.isbn?.[0] ?? null,
        publishedYear: book.first_publish_year ?? null,
        pageCount: book.number_of_pages_median ?? null,
        language: book.language?.includes("rus")
          ? "ru"
          : book.language?.includes("eng")
            ? "en"
            : null,
      },
    ];
  });
}

type WikidataSearchPayload = { search?: Array<{ id: string }> };
type WikidataEntitiesPayload = {
  entities?: Record<string, { labels?: Record<string, { value: string }>; aliases?: Record<string, Array<{ value: string }>> }>;
};

async function translatedTitleQueries(query: string, locale: "ru" | "en") {
  const searchUrl = new URL("https://www.wikidata.org/w/api.php");
  searchUrl.search = new URLSearchParams({ action: "wbsearchentities", format: "json", language: locale, uselang: locale, type: "item", limit: "4", search: query }).toString();
  const searchResponse = await fetch(searchUrl, { headers: { "User-Agent": "ShelfSeasons/0.18 (https://shelf-seasons.vercel.app)" }, signal: AbortSignal.timeout(2_000), next: { revalidate: 86_400 } }).catch(() => null);
  if (!searchResponse?.ok) return [];
  const search = (await searchResponse.json()) as WikidataSearchPayload;
  const ids = (search.search ?? []).map((item) => item.id).filter(Boolean);
  if (!ids.length) return [];

  const entitiesUrl = new URL("https://www.wikidata.org/w/api.php");
  entitiesUrl.search = new URLSearchParams({ action: "wbgetentities", format: "json", ids: ids.join("|"), props: "labels|aliases", languages: "ru|en" }).toString();
  const entitiesResponse = await fetch(entitiesUrl, { headers: { "User-Agent": "ShelfSeasons/0.18 (https://shelf-seasons.vercel.app)" }, signal: AbortSignal.timeout(2_000), next: { revalidate: 86_400 } }).catch(() => null);
  if (!entitiesResponse?.ok) return [];
  const payload = (await entitiesResponse.json()) as WikidataEntitiesPayload;
  const values = Object.values(payload.entities ?? {}).flatMap((entity) => [
    entity.labels?.ru?.value,
    entity.labels?.en?.value,
    ...(entity.aliases?.ru ?? []).slice(0, 2).map((alias) => alias.value),
    ...(entity.aliases?.en ?? []).slice(0, 2).map((alias) => alias.value),
  ]).filter((value): value is string => Boolean(value));
  const normalizedQuery = query.toLocaleLowerCase().trim();
  return [...new Set(values)].filter((value) => value.toLocaleLowerCase().trim() !== normalizedQuery).slice(0, 2);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!(await requireUser(supabase))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const limited = await rateLimitResponse(supabase, "book-search", 30, 60, {
    continueOnInfrastructureError: true,
  });
  if (limited) return limited;
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const locale = request.nextUrl.searchParams.get("locale") === "ru" ? "ru" : "en";
  if (query.length < 2 || query.length > 200) {
    return NextResponse.json({ results: [] });
  }

  const titleQuery = `intitle:\"${query.replaceAll('"', "")}\"`;
  const knownAlternate = knownAlternateTitle(query);
  const [firstAttempts, translatedAlternates] = await Promise.all([
    Promise.allSettled([
      searchGoogle(titleQuery, locale),
      searchGoogle(query),
      searchOpenLibrary(query),
      ...(knownAlternate
        ? [searchGoogle(`intitle:\"${knownAlternate}\"`), searchOpenLibrary(knownAlternate)]
        : []),
    ]),
    knownAlternate ? Promise.resolve([]) : translatedTitleQueries(query, locale).catch(() => []),
  ]);
  const directResults: RankedBookSearchResult[] = firstAttempts.flatMap((attempt) => attempt.status === "fulfilled" ? attempt.value : []);
  const translatedAttempts = await Promise.allSettled(
    (directResults.length ? [] : translatedAlternates).flatMap((alternate) => [
      searchGoogle(`intitle:\"${alternate.replaceAll('"', "")}\"`),
      searchOpenLibrary(alternate),
    ]),
  );
  const translatedResults = translatedAttempts.flatMap((attempt) => attempt.status === "fulfilled" ? attempt.value : []);
  return NextResponse.json({
    results: rankAndDedupeResults(query, locale, [...directResults, ...translatedResults]),
  });
}

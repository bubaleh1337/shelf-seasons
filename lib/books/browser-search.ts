import {
  knownAlternateTitle,
  rankAndDedupeResults,
  type RankedBookSearchResult,
} from "./search";
import type { BookSearchResult } from "./types";
import type { Locale } from "../shelf-seasons";

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
      imageLinks?: {
        extraLarge?: string;
        large?: string;
        medium?: string;
        small?: string;
        thumbnail?: string;
        smallThumbnail?: string;
      };
      industryIdentifiers?: Array<{ type: string; identifier: string }>;
    };
  }>;
};

async function searchGoogle(query: string, language?: Locale) {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.search = new URLSearchParams({
    q: query,
    maxResults: "12",
    printType: "books",
    orderBy: "relevance",
    ...(language ? { langRestrict: language } : {}),
  }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(6_000) });
  if (!response.ok) return [];
  const payload = (await response.json()) as GooglePayload;
  return (payload.items ?? []).flatMap<RankedBookSearchResult>((item) => {
    const info = item.volumeInfo;
    if (!info?.title) return [];
    return [{
      provider: "google_books",
      providerId: item.id,
      title: info.title,
      authors: info.authors ?? [],
      description: info.description ?? null,
      coverUrl: cleanCover(
        info.imageLinks?.extraLarge ??
          info.imageLinks?.large ??
          info.imageLinks?.medium ??
          info.imageLinks?.small ??
          info.imageLinks?.thumbnail ??
          info.imageLinks?.smallThumbnail,
      ),
      isbn:
        info.industryIdentifiers?.find((value) => value.type === "ISBN_13")
          ?.identifier ?? info.industryIdentifiers?.[0]?.identifier ?? null,
      publishedYear: yearFrom(info.publishedDate),
      pageCount: info.pageCount ?? null,
      language: info.language ?? null,
    }];
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
  const response = await fetch(url, { signal: AbortSignal.timeout(6_000) });
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
    return [{
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
    }];
  });
}

export async function searchBooksInBrowser(
  query: string,
  locale: Locale,
): Promise<BookSearchResult[]> {
  const alternate = knownAlternateTitle(query);
  const queries = [...new Set([query, alternate].filter((value): value is string => Boolean(value)))];
  const attempts = await Promise.allSettled(
    queries.flatMap((value) => [
      searchGoogle(`intitle:\"${value.replaceAll('"', "")}\"`, locale),
      searchGoogle(value),
      searchOpenLibrary(value),
    ]),
  );
  const results = attempts.flatMap((attempt) =>
    attempt.status === "fulfilled" ? attempt.value : [],
  );
  return rankAndDedupeResults(query, locale, results);
}

import type { LibraryBook } from "@/lib/books/types";
import type { SeriesEntry } from "@/lib/series/types";

export function summarizeSeries(entries: SeriesEntry[], books: LibraryBook[]) {
  const statuses = new Map(books.map((book) => [book.id, book.status]));
  const completed = entries.filter((entry) => entry.bookId && statuses.get(entry.bookId) === "read").length;
  const nextEntry = entries.find((entry) => !entry.bookId || statuses.get(entry.bookId) !== "read") ?? null;
  return { completed, total: entries.length, nextEntry };
}

export function moveSeriesEntry(entries: SeriesEntry[], index: number, delta: -1 | 1): SeriesEntry[] {
  const target = index + delta;
  if (index < 0 || index >= entries.length || target < 0 || target >= entries.length) return entries;
  const ordered = [...entries];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  return ordered;
}

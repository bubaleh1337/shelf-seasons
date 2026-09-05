import type { LibraryBook } from "@/lib/books/types";
import type { ReadingSession } from "@/lib/reading/types";

export function selectCurrentBook(
  books: LibraryBook[],
  sessions: ReadingSession[],
): LibraryBook | null {
  const readingBooks = books.filter((book) => book.status === "reading");
  if (readingBooks.length === 0) return null;

  const readingById = new Map(readingBooks.map((book) => [book.id, book]));
  for (const session of sessions) {
    const recentlyRead = readingById.get(session.bookId);
    if (recentlyRead) return recentlyRead;
  }

  return readingBooks[0] ?? null;
}

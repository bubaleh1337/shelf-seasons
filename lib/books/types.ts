import type { Database } from "@/lib/supabase/database.types";

export type LibraryStatus = Database["public"]["Enums"]["library_status"];
export type BookFormat = Database["public"]["Enums"]["book_format"];
export type ReadingLanguage = Database["public"]["Enums"]["reading_language"];
export type BookSeason = Database["public"]["Enums"]["book_season"];

export type LibraryBook = {
  id: string;
  title: string;
  authors: string[];
  description: string | null;
  coverUrl: string | null;
  defaultCoverUrl: string | null;
  isbn: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  format: BookFormat;
  status: LibraryStatus;
  readingLanguage: ReadingLanguage;
  season: BookSeason | null;
  createdAt: string;
};

export type BookSearchResult = {
  provider: "google_books" | "open_library";
  providerId: string;
  title: string;
  authors: string[];
  description: string | null;
  coverUrl: string | null;
  isbn: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  language: string | null;
};

import type { LibraryBook } from "@/lib/books/types";

export type RecapPeriodType = "month" | "year";
export type RecapCategory = "favorite_book" | "biggest_disappointment" | "favorite_cover" | "favorite_series";

export type RecapBookCandidate = {
  runId: string;
  book: LibraryBook;
  finishedOn: string;
  isReread: boolean;
  rating: number | null;
  nomination: "favorite" | "disappointment" | null;
};

export type RecapBookChoice = {
  id: string;
  title: string;
  authors: string[];
};

export type RecapSeriesCandidate = {
  id: string;
  name: string;
  completedInPeriod: number;
  totalVolumes: number;
};

export type RecapSelections = Partial<Record<RecapCategory, string>>;

export type RecapSummary = {
  periodType: RecapPeriodType;
  periodStart: string;
  periodEnd: string;
  isFinal: boolean;
  completedCount: number;
  uniqueBooks: number;
  rereads: number;
  readingDays: number;
  longestStreak: number;
  pagesRead: number;
  sessionsWithPages: number;
  minutesRead: number;
  sessionsWithMinutes: number;
  mostActiveWeekStart: string | null;
  mostActiveWeekDays: number;
  goal: { target: number; completed: number; includeRereads: boolean } | null;
  books: RecapBookCandidate[];
  selectionBooks: RecapBookChoice[];
  series: RecapSeriesCandidate[];
  selections: RecapSelections;
  languageCounts: { ru: number; en: number; other: number };
};

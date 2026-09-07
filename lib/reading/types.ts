export type ReadingSession = {
  id: string;
  runId: string;
  bookId: string;
  readOn: string;
  checkInOnly: boolean;
  pagesRead: number | null;
  minutesRead: number | null;
  resultingPercent: number | null;
  note: string | null;
};

export type ReadingRun = {
  id: string;
  bookId: string;
  status: "reading" | "paused" | "completed" | "dnf";
  startedOn: string;
  finishedOn: string | null;
  isReread: boolean;
  currentPosition: number | null;
  totalUnits: number | null;
  rating: number | null;
  impression: string | null;
  nomination: "favorite" | "disappointment" | null;
  readingLanguage: "ru" | "en" | "other";
};

export type YearlyGoal = {
  year: number;
  targetBooks: number;
  includeRereads: boolean;
};

export type StreakSummary = {
  current: number;
  longest: number;
};

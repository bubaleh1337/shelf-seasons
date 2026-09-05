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

export type StreakSummary = {
  current: number;
  longest: number;
};

export type SeriesStatus = "planned" | "in_progress" | "completed" | "abandoned";

export type SeriesEntry = {
  id: string;
  seriesId: string;
  bookId: string | null;
  placeholderTitle: string | null;
  sortOrder: number;
  positionLabel: string;
};

export type BookSeries = {
  id: string;
  name: string;
  creator: string | null;
  description: string | null;
  status: SeriesStatus;
  coverBookId: string | null;
  entries: SeriesEntry[];
  createdAt: string;
  updatedAt: string;
};

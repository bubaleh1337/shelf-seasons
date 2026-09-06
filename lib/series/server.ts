import type { Database } from "@/lib/supabase/database.types";
import type { BookSeries, SeriesEntry } from "@/lib/series/types";

type SeriesRow = Database["public"]["Tables"]["series"]["Row"];
type EntryRow = Database["public"]["Tables"]["series_entries"]["Row"];

export function seriesEntryToDto(row: EntryRow): SeriesEntry {
  return {
    id: row.id,
    seriesId: row.series_id,
    bookId: row.book_id,
    placeholderTitle: row.placeholder_title,
    sortOrder: Number(row.sort_order),
    positionLabel: row.position_label,
  };
}

export function seriesToDto(row: SeriesRow, entries: SeriesEntry[] = []): BookSeries {
  return {
    id: row.id,
    name: row.name,
    creator: row.creator,
    description: row.description,
    status: row.status,
    coverBookId: row.cover_book_id,
    entries: [...entries].sort((left, right) => left.sortOrder - right.sortOrder),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

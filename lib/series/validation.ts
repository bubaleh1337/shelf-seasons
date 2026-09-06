import { z } from "zod";

const optionalText = (max: number) => z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.string().trim().max(max).nullable(),
);

export const seriesInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  creator: optionalText(160),
  description: optionalText(2000),
  status: z.enum(["planned", "in_progress", "completed", "abandoned"]),
  coverBookId: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    z.string().uuid().nullable(),
  ),
});

export const seriesEntryInputSchema = z.object({
  bookId: z.string().uuid().nullable(),
  placeholderTitle: optionalText(300),
  positionLabel: z.string().trim().min(1).max(40),
}).refine((value) => Boolean(value.bookId) !== Boolean(value.placeholderTitle), {
  message: "series_entry_requires_one_source",
});

export const seriesOrderInputSchema = z.object({
  entryIds: z.array(z.string().uuid()).min(1).max(500).refine((ids) => new Set(ids).size === ids.length),
});

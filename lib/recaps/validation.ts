import { z } from "zod";

export const recapPeriodSchema = z.object({
  periodType: z.enum(["month", "year"]),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const recapSelectionSchema = recapPeriodSchema.extend({
  category: z.enum(["favorite_book", "biggest_disappointment", "favorite_cover", "favorite_series"]),
  valueId: z.string().uuid().nullable(),
});

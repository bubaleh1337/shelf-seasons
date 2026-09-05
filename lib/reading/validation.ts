import { z } from "zod";

const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
  z.number().int().positive().max(100_000).nullable(),
);

export const readingInputSchema = z.object({
  bookId: z.string().uuid(),
  readOn: z.preprocess((value) => (value === "" ? null : value), z.string().date().nullable().default(null)),
  checkInOnly: z.preprocess((value) => value === true || value === "true", z.boolean()),
  pagesRead: optionalPositiveInteger,
  minutesRead: optionalPositiveInteger,
  resultingPercent: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
    z.number().min(0).max(100).nullable(),
  ),
  note: z.preprocess((value) => (value === "" ? null : value), z.string().trim().max(1000).nullable()),
}).refine((value) => value.checkInOnly || value.pagesRead !== null || value.minutesRead !== null || value.resultingPercent !== null, {
  message: "reading_activity_required",
});

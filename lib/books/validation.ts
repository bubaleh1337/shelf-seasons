import { z } from "zod";

const nullableText = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(maximum).nullable().optional(),
  );

const nullableInteger = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
  z.number().int().positive().max(100_000).nullable().optional(),
);

export const bookInputSchema = z.object({
  title: z.string().trim().min(1).max(300),
  authors: z.preprocess(
    (value) => (typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value),
    z.array(z.string().trim().min(1).max(160)).max(20).default([]),
  ),
  description: nullableText(5_000),
  coverUrl: nullableText(2_000),
  isbn: nullableText(32),
  publishedYear: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
    z.number().int().min(1000).max(2200).nullable().optional(),
  ),
  pageCount: nullableInteger,
  format: z.enum(["print", "ebook", "audiobook"]),
  status: z.enum(["want", "reading", "read", "paused", "dnf"]),
  provider: z.enum(["manual", "google_books", "open_library"]).default("manual"),
  providerId: nullableText(500),
  removeCover: z.preprocess((value) => value === true || value === "true", z.boolean()).default(false),
});

export type BookInput = z.infer<typeof bookInputSchema>;

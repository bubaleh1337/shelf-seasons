import "server-only";

import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookInput } from "@/lib/books/validation";
import type { LibraryBook } from "@/lib/books/types";
import type { Database } from "@/lib/supabase/database.types";
import { identifyGoogleBooksRequest } from "@/lib/books/google";

type Client = SupabaseClient<Database>;
type BookRow = Database["public"]["Tables"]["library_books"]["Row"];
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_BOOK_FORM_BYTES = 6 * 1024 * 1024;

export function isBookFormTooLarge(request: Request) {
  const rawLength = request.headers.get("content-length");
  if (!rawLength) return false;
  const length = Number(rawLength);
  return Number.isFinite(length) && length > MAX_BOOK_FORM_BYTES;
}

export async function requireUser(supabase: Client) {
  const { data } = await supabase.auth.getClaims();
  return typeof data?.claims?.sub === "string" ? data.claims.sub : null;
}

export async function bookToDto(supabase: Client, row: BookRow): Promise<LibraryBook> {
  let coverUrl = row.cover_url;
  if (row.cover_path) {
    const { data } = await supabase.storage.from("book-covers").createSignedUrl(row.cover_path, 3600);
    coverUrl = data?.signedUrl ?? row.cover_url;
  }
  return {
    id: row.id,
    title: row.title,
    authors: row.authors,
    description: row.description,
    coverUrl,
    defaultCoverUrl: row.cover_url,
    isbn: row.isbn,
    publishedYear: row.published_year,
    pageCount: row.page_count,
    format: row.format,
    status: row.status,
    readingLanguage: row.reading_language,
    season: row.season,
    createdAt: row.created_at,
  };
}

export async function booksToDtos(supabase: Client, rows: BookRow[]): Promise<LibraryBook[]> {
  const coverPaths = [...new Set(rows.flatMap((row) => row.cover_path ? [row.cover_path] : []))];
  const signedUrls = new Map<string, string>();
  for (let index = 0; index < coverPaths.length; index += 100) {
    const chunk = coverPaths.slice(index, index + 100);
    const { data } = await supabase.storage.from("book-covers").createSignedUrls(chunk, 3600);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
    }
  }
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    authors: row.authors,
    description: row.description,
    coverUrl: row.cover_path ? signedUrls.get(row.cover_path) ?? row.cover_url : row.cover_url,
    defaultCoverUrl: row.cover_url,
    isbn: row.isbn,
    publishedYear: row.published_year,
    pageCount: row.page_count,
    format: row.format,
    status: row.status,
    readingLanguage: row.reading_language,
    season: row.season,
    createdAt: row.created_at,
  }));
}

export function toInsert(userId: string, input: BookInput) {
  return {
    user_id: userId,
    source: input.provider,
    provider_id: input.providerId ?? null,
    title: input.title,
    authors: input.authors,
    description: input.description ?? null,
    cover_url: input.coverUrl ?? null,
    isbn: input.isbn ?? null,
    published_year: input.publishedYear ?? null,
    page_count: input.pageCount ?? null,
    format: input.format,
    status: input.status,
    reading_language: input.readingLanguage,
    season: input.season,
  } satisfies Database["public"]["Tables"]["library_books"]["Insert"];
}

export async function setBookStatus(
  supabase: Client,
  bookId: string,
  status: Database["public"]["Enums"]["library_status"],
) {
  const { error: statusError } = await supabase.rpc("set_library_book_status", {
    p_book_id: bookId,
    p_status: status,
  });
  if (statusError) throw statusError;

  const { data: row, error } = await supabase
    .from("library_books")
    .select()
    .eq("id", bookId)
    .single();
  if (error || !row) throw error ?? new Error("book_not_found_after_status_update");
  return row;
}

export async function storeCover(supabase: Client, userId: string, bookId: string, file: File) {
  if (file.size > MAX_COVER_BYTES) throw new Error("cover_too_large");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("cover_type");
  return storeCoverBytes(supabase, userId, bookId, Buffer.from(await file.arrayBuffer()));
}

async function storeCoverBytes(supabase: Client, userId: string, bookId: string, input: Buffer) {
  if (input.byteLength > MAX_COVER_BYTES) throw new Error("cover_too_large");
  const metadata = await sharp(input, { animated: false, limitInputPixels: 40_000_000 }).metadata();
  if (!metadata.width || !metadata.height) throw new Error("cover_invalid");
  const output = await sharp(input, { animated: false })
    .rotate()
    .resize({ width: 1200, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  const path = `${userId}/${bookId}.webp`;
  const { error } = await supabase.storage.from("book-covers").upload(path, output, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) throw error;
  return path;
}

const remoteCoverHosts = new Set([
  "books.google.com",
  "books.googleusercontent.com",
  "covers.openlibrary.org",
]);

export async function storeRemoteCover(supabase: Client, userId: string, bookId: string, rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || !remoteCoverHosts.has(url.hostname)) throw new Error("cover_host");
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("cover_download");
  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== "https:" || !remoteCoverHosts.has(finalUrl.hostname)) throw new Error("cover_redirect");
  const type = response.headers.get("content-type")?.split(";")[0];
  if (!type || !["image/jpeg", "image/png", "image/webp"].includes(type)) throw new Error("cover_type");
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_COVER_BYTES) throw new Error("cover_too_large");
  if (!response.body) throw new Error("cover_download");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_COVER_BYTES) {
      await reader.cancel();
      throw new Error("cover_too_large");
    }
    chunks.push(value);
  }
  return storeCoverBytes(supabase, userId, bookId, Buffer.concat(chunks, received));
}

type GoogleVolume = { volumeInfo?: { imageLinks?: { extraLarge?: string; large?: string; medium?: string; small?: string; thumbnail?: string; smallThumbnail?: string } } };
type CoverReference = Pick<BookInput, "coverUrl" | "provider" | "providerId" | "isbn">;

export async function resolveProviderCover(input: CoverReference) {
  if (input.coverUrl) return input.coverUrl.replace(/^http:/, "https:");
  if (input.provider === "google_books" && input.providerId) {
    try {
      const url = identifyGoogleBooksRequest(new URL(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(input.providerId)}`));
      const response = await fetch(url, { signal: AbortSignal.timeout(7_000) });
      if (response.ok) {
        const info = ((await response.json()) as GoogleVolume).volumeInfo;
        const cover = info?.imageLinks?.extraLarge ?? info?.imageLinks?.large ?? info?.imageLinks?.medium ?? info?.imageLinks?.small ?? info?.imageLinks?.thumbnail ?? info?.imageLinks?.smallThumbnail;
        if (cover) return cover.replace(/^http:/, "https:");
      }
    } catch {
      // Continue to the ISBN fallback.
    }
  }
  if (input.isbn) return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(input.isbn)}-L.jpg?default=false`;
  return null;
}

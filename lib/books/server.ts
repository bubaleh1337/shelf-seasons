import "server-only";

import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookInput } from "@/lib/books/validation";
import type { LibraryBook } from "@/lib/books/types";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;
type BookRow = Database["public"]["Tables"]["library_books"]["Row"];

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
    createdAt: row.created_at,
  };
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
  if (file.size > 5 * 1024 * 1024) throw new Error("cover_too_large");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("cover_type");
  return storeCoverBytes(supabase, userId, bookId, Buffer.from(await file.arrayBuffer()));
}

async function storeCoverBytes(supabase: Client, userId: string, bookId: string, input: Buffer) {
  if (input.byteLength > 5 * 1024 * 1024) throw new Error("cover_too_large");
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
  return storeCoverBytes(supabase, userId, bookId, Buffer.from(await response.arrayBuffer()));
}

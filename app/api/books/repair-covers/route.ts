import { NextResponse } from "next/server";
import { bookToDto, requireUser, resolveProviderCover, storeRemoteCover } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST() {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limited = await rateLimitResponse(supabase, "cover-repair", 3, 3600);
  if (limited) return limited;

  const { data: rows, error } = await supabase
    .from("library_books")
    .select()
    .eq("user_id", userId)
    .is("cover_path", null)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: "repair_failed" }, { status: 400 });

  const repaired = [];
  for (const row of rows ?? []) {
    const [existingUrl, recoveredUrl] = await Promise.all([
      resolveProviderCover({ coverUrl: row.cover_url, provider: row.source, providerId: row.provider_id, isbn: row.isbn }),
      resolveProviderCover({ coverUrl: null, provider: row.source, providerId: row.provider_id, isbn: row.isbn }),
    ]);
    for (const remoteUrl of [...new Set([existingUrl, recoveredUrl].filter((value): value is string => Boolean(value)))]) {
      try {
        const path = await storeRemoteCover(supabase, userId, row.id, remoteUrl);
        const { data: updated } = await supabase.from("library_books").update({ cover_path: path, cover_url: remoteUrl }).eq("id", row.id).eq("user_id", userId).select().single();
        if (updated) repaired.push(await bookToDto(supabase, updated));
        break;
      } catch {
        // Try the next trusted provider candidate.
      }
    }
  }

  return NextResponse.json({ books: repaired });
}

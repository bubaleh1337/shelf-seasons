import { NextRequest, NextResponse } from "next/server";
import { isValidDeleteConfirmation } from "@/lib/account/validation";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";
export async function DELETE(request: NextRequest) {
  let confirmation: unknown; try { ({ confirmation } = await request.json()); } catch { return NextResponse.json({ error: "invalid_confirmation" }, { status: 400 }); }
  if (!isValidDeleteConfirmation(confirmation)) return NextResponse.json({ error: "invalid_confirmation" }, { status: 400 });
  const supabase = await createClient(); const userId = await requireUser(supabase); if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: covers, error: coversError } = await supabase.from("library_books").select("cover_path").eq("user_id", userId).not("cover_path", "is", null); if (coversError) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  const paths = (covers ?? []).flatMap((row) => row.cover_path ? [row.cover_path] : []); for (let from = 0; from < paths.length; from += 100) { const { error } = await supabase.storage.from("book-covers").remove(paths.slice(from, from + 100)); if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 }); }
  const { error } = await supabase.rpc("delete_own_account"); if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  const response = NextResponse.json({ deleted: true }); for (const cookie of request.cookies.getAll()) if (cookie.name.startsWith("sb-")) response.cookies.set(cookie.name, "", { expires: new Date(0), maxAge: 0, path: "/" }); return response;
}

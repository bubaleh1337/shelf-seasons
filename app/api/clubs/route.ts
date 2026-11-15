import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({ name: z.string().trim().min(1).max(80) });

export async function GET() {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("book_clubs")
    .select("id,owner_id,name,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "clubs_unavailable" }, { status: 503 });
  return NextResponse.json({ clubs: (data ?? []).map((club) => ({
    id: club.id, ownerId: club.owner_id, name: club.name, createdAt: club.created_at,
  })) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_club" }, { status: 400 });

  const { data: club, error } = await supabase.from("book_clubs")
    .insert({ owner_id: userId, name: parsed.data.name })
    .select("id,owner_id,name,created_at").single();
  if (error || !club) return NextResponse.json({ error: "club_create_failed" }, { status: 400 });
  return NextResponse.json({ club: { id: club.id, ownerId: club.owner_id, name: club.name, createdAt: club.created_at } }, { status: 201 });
}

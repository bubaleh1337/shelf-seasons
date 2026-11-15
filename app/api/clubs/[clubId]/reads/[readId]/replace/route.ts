import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();
const schema = z.object({
  bookId: uuid,
  startedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).refine((value) => !value.targetOn || value.targetOn >= value.startedOn);

type Context = { params: Promise<{ clubId: string; readId: string }> };

export async function POST(request: Request, { params }: Context) {
  const { clubId, readId } = await params;
  if (!uuid.safeParse(clubId).success || !uuid.safeParse(readId).success) {
    return NextResponse.json({ error: "invalid_read" }, { status: 400 });
  }
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_replacement" }, { status: 400 });

  const { data: readIdNew, error } = await supabase.rpc("replace_book_club_read", {
    p_club_id: clubId,
    p_previous_read_id: readId,
    p_book_id: parsed.data.bookId,
    p_started_on: parsed.data.startedOn,
    p_target_on: parsed.data.targetOn,
  });
  if (error || !readIdNew) {
    return NextResponse.json({ error: "replace_failed" }, { status: 400 });
  }
  return NextResponse.json({ readId: readIdNew }, { status: 201 });
}

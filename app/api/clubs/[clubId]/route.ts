import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

const paramsSchema = z.object({ clubId: z.string().uuid() });

type Context = { params: Promise<{ clubId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: "invalid_club" }, { status: 400 });
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { clubId } = parsed.data;
  const { data: club, error } = await supabase.from("book_clubs")
    .select("id,name,owner_id,invite_token,created_at")
    .eq("id", clubId).maybeSingle();
  if (error) return NextResponse.json({ error: "clubs_unavailable" }, { status: 503 });
  if (!club) return NextResponse.json({ error: "club_not_found" }, { status: 404 });

  const [{ data: members, error: membersError }, { data: reads, error: readsError }, { data: progress, error: progressError }] = await Promise.all([
    supabase.from("book_club_members").select("user_id,display_name,joined_at").eq("club_id", clubId).order("joined_at"),
    supabase.from("book_club_reads").select("id,title,authors,isbn,published_year,page_count,format,reading_language,cover_url,started_on,target_on,status,created_at").eq("club_id", clubId).order("created_at", { ascending: false }),
    supabase.from("book_club_progress").select("club_read_id,user_id,current_page,total_pages,percent,is_complete").eq("club_id", clubId),
  ]);
  if (membersError || readsError || progressError) return NextResponse.json({ error: "clubs_unavailable" }, { status: 503 });
  return NextResponse.json({
    club: { id: club.id, name: club.name, ownerId: club.owner_id, inviteToken: club.invite_token, createdAt: club.created_at },
    myUserId: userId,
    members: (members ?? []).map((member) => ({ userId: member.user_id, name: member.display_name, joinedAt: member.joined_at })),
    reads: (reads ?? []).map((read) => ({ id: read.id, title: read.title, authors: read.authors, isbn: read.isbn, publishedYear: read.published_year, pageCount: read.page_count, format: read.format, readingLanguage: read.reading_language, coverUrl: read.cover_url, startedOn: read.started_on, targetOn: read.target_on, status: read.status, createdAt: read.created_at })),
    progress: (progress ?? []).map((item) => ({ readId: item.club_read_id, userId: item.user_id, currentPage: item.current_page, totalPages: item.total_pages, percent: item.percent === null ? null : Number(item.percent), isComplete: item.is_complete })),
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: "invalid_club" }, { status: 400 });
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const clubId = parsed.data.clubId;
  const { data: club } = await supabase.from("book_clubs")
    .select("owner_id").eq("id", clubId).maybeSingle();
  if (!club) return NextResponse.json({ error: "club_not_found" }, { status: 404 });
  if (club.owner_id === userId) {
    const { error } = await supabase.from("book_clubs").delete().eq("id", clubId).eq("owner_id", userId);
    if (error) return NextResponse.json({ error: "club_delete_failed" }, { status: 400 });
  } else {
    const { error } = await supabase.from("book_club_members").delete()
      .eq("club_id", clubId).eq("user_id", userId);
    if (error) return NextResponse.json({ error: "club_leave_failed" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

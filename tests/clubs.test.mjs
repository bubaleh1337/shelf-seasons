import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('club tables use RLS and membership predicates', async () => {
  const sql = await read('supabase/migrations/202611150001_book_clubs.sql');
  for (const table of ['book_clubs', 'book_club_members', 'book_club_reads', 'book_club_progress']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`revoke all on public\\.${table}|revoke all on public\\.book_clubs, public\\.book_club_members`, 'i'));
  }
  assert.match(sql, /private\.club_ids_for_user\(\)/);
  assert.match(sql, /security definer set search_path = ''/);
  assert.match(sql, /grant execute on function public\.join_book_club\(text\) to authenticated/);
  assert.match(sql, /p_invite_token !~ '\^\[a-f0-9\]\{32\}\$'/);
  assert.match(sql, /member_count >= 50/);
});

test('club endpoints require auth and do not accept user_id from requests', async () => {
  const paths = [
    'app/api/clubs/route.ts', 'app/api/clubs/join/route.ts',
    'app/api/clubs/[clubId]/route.ts', 'app/api/clubs/[clubId]/reads/route.ts',
    'app/api/clubs/[clubId]/reads/[readId]/route.ts', 'app/api/clubs/[clubId]/progress/route.ts',
  ];
  for (const path of paths) {
    const content = await read(path);
    assert.match(content, /requireUser\(supabase\)/);
    assert.doesNotMatch(content, /user_id:\s*parsed\.data|userId:\s*parsed\.data/);
  }
});

test('club progress uses personal runs without sharing notes, ratings or impressions', async () => {
  const sql = await read('supabase/migrations/202611150001_book_clubs.sql');
  const api = await read('app/api/clubs/[clubId]/route.ts');
  assert.match(sql, /from public\.reading_runs/);
  assert.match(sql, /book_club_sync_reading_run/);
  assert.match(sql, /book_club_link_progress/);
  assert.match(api, /current_page,total_pages,percent,is_complete/);
  assert.doesNotMatch(api, /select\([^\n]*(?:impression|rating|note)/);
});

test('navigation preserves access to other sections on mobile', async () => {
  const app = await read('components/shelf-seasons-app.tsx');
  assert.match(app, /id: "clubs", icon: UsersRound/);
  assert.match(app, /"home", "library", "calendar", "clubs", "more"/);
  assert.match(app, /<MorePage locale=\{locale\}/);
});

test('impression placeholder uses explicitly requested phrase', async () => {
  const copy = await read('lib/app-copy.ts');
  assert.match(copy, /Что тебе заполнилось в этой книге\?/);
  assert.doesNotMatch(copy, /Что тебе запомнится в этой книге\?/);
});

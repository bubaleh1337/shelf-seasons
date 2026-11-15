begin;

-- Store a non-private edition snapshot so an invited reader can create their
-- own, independent book without manually searching their library.
-- Private covers, descriptions and season choices are never copied.
alter table public.book_club_reads
  add column isbn text,
  add column published_year integer,
  add column page_count integer,
  add column format public.book_format not null default 'print',
  add column reading_language public.reading_language not null default 'other',
  add column cover_url text;

alter table public.book_club_reads
  add constraint club_reads_isbn_length check (isbn is null or char_length(isbn) <= 32),
  add constraint club_reads_published_year_range check (published_year is null or published_year between 1000 and 2200),
  add constraint club_reads_page_count_range check (page_count is null or page_count between 1 and 100000),
  add constraint club_reads_cover_url_length check (cover_url is null or char_length(cover_url) <= 2000);

-- Best-effort backfill for club reads made before this update, including
-- a current shared read, based on the organizer's matching personal edition.
update public.book_club_reads r
set isbn = b.isbn,
    published_year = b.published_year,
    page_count = b.page_count,
    format = b.format,
    reading_language = b.reading_language,
    cover_url = case
      when b.cover_url ~ '^https://(books\.google\.com|books\.googleusercontent\.com|covers\.openlibrary\.org)/'
        then b.cover_url
      else null
    end
from public.library_books b
where b.id = (
  select candidate.id from public.library_books candidate
  where candidate.user_id = r.created_by
    and candidate.title = r.title
    and candidate.authors = r.authors
  order by candidate.created_at desc, candidate.id desc limit 1
);

-- Club member labels follow the editable public display name, while
-- the underlying auth identity and ownership remain unchanged.
create or replace function private.sync_club_member_display_name()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if nullif(btrim(new.display_name), '') is not null then
    update public.book_club_members
       set display_name = left(btrim(new.display_name), 80)
     where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger sync_club_member_display_name
  after update of display_name on public.profiles
  for each row
  when (old.display_name is distinct from new.display_name)
  execute function private.sync_club_member_display_name();

commit;

create type public.book_source as enum ('manual', 'google_books', 'open_library');
create type public.book_format as enum ('print', 'ebook', 'audiobook');
create type public.library_status as enum ('want', 'reading', 'read', 'paused', 'dnf');

create table public.library_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  source public.book_source not null default 'manual',
  provider_id text,
  title text not null check (char_length(title) between 1 and 300),
  authors text[] not null default '{}',
  description text check (description is null or char_length(description) <= 5000),
  cover_url text check (cover_url is null or char_length(cover_url) <= 2000),
  cover_path text,
  isbn text check (isbn is null or char_length(isbn) <= 32),
  published_year integer check (published_year is null or published_year between 1000 and 2200),
  page_count integer check (page_count is null or page_count between 1 and 100000),
  format public.book_format not null default 'print',
  status public.library_status not null default 'want',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index library_books_user_created_idx on public.library_books (user_id, created_at desc);
create index library_books_user_status_idx on public.library_books (user_id, status);

create trigger set_library_books_updated_at
before update on public.library_books
for each row execute function public.set_updated_at();

alter table public.library_books enable row level security;

revoke all on table public.library_books from anon;
grant select, insert, update, delete on table public.library_books to authenticated;

create policy "Users can read their own books"
on public.library_books for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their own books"
on public.library_books for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own books"
on public.library_books for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own books"
on public.library_books for delete to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-covers',
  'book-covers',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Users can read their own book covers"
on storage.objects for select to authenticated
using (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload their own book covers"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can update their own book covers"
on storage.objects for update to authenticated
using (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their own book covers"
on storage.objects for delete to authenticated
using (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

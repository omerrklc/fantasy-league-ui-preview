-- FUTMAC lig yönetimi modülleri
-- 001_initial.sql sonrasında Supabase SQL Editor içinde bir kez çalıştırın.

create table if not exists public.authors (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique check (char_length(name) between 2 and 80),
  role text not null default 'FUTMAC Yazarı' check (char_length(role) between 2 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  image_url text not null default 'assets/images/logo/emac-turka-transparent.png' check (char_length(image_url) <= 1000 and image_url ~ '^(assets/images/[A-Za-z0-9_./-]+|https://[^[:space:]]+)$'),
  is_active boolean not null default true,
  sort_order smallint not null default 0 check (sort_order between 0 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.league_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  manager text not null check (char_length(manager) between 2 and 80),
  short_name text check (short_name is null or char_length(short_name) between 2 and 12),
  is_active boolean not null default true,
  sort_order smallint not null default 0 check (sort_order between 0 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.standings (
  team_id uuid primary key references public.league_teams(id) on delete cascade,
  played smallint not null default 0 check (played between 0 and 60),
  won smallint not null default 0 check (won between 0 and 60),
  drawn smallint not null default 0 check (drawn between 0 and 60),
  lost smallint not null default 0 check (lost between 0 and 60),
  fantasy_points integer not null default 0 check (fantasy_points between -100000 and 100000),
  league_points integer not null default 0 check (league_points between -1000 and 1000),
  movement text not null default 'same' check (movement in ('up', 'same', 'down')),
  form text[] not null default '{}'::text[] check (coalesce(array_length(form, 1), 0) <= 5 and form <@ array['G','B','M']::text[]),
  updated_at timestamptz not null default now(),
  constraint standings_match_total check (won + drawn + lost <= played)
);

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  week smallint not null check (week between 1 and 60),
  home_team_id uuid not null references public.league_teams(id),
  away_team_id uuid not null references public.league_teams(id),
  kickoff_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished')),
  home_score integer check (home_score between 0 and 100000),
  away_score integer check (away_score between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixtures_different_teams check (home_team_id <> away_team_id),
  constraint fixtures_score_state check (
    (status = 'scheduled' and home_score is null and away_score is null)
    or (status in ('live', 'finished') and home_score is not null and away_score is not null)
  ),
  unique (week, home_team_id, away_team_id)
);

create index if not exists fixtures_week_kickoff_idx on public.fixtures (week, kickoff_at);
create index if not exists standings_order_idx on public.standings (league_points desc, fantasy_points desc);

drop trigger if exists authors_set_updated_at on public.authors;
create trigger authors_set_updated_at before update on public.authors for each row execute function public.set_updated_at();
drop trigger if exists league_teams_set_updated_at on public.league_teams;
create trigger league_teams_set_updated_at before update on public.league_teams for each row execute function public.set_updated_at();
drop trigger if exists standings_set_updated_at on public.standings;
create trigger standings_set_updated_at before update on public.standings for each row execute function public.set_updated_at();
drop trigger if exists fixtures_set_updated_at on public.fixtures;
create trigger fixtures_set_updated_at before update on public.fixtures for each row execute function public.set_updated_at();

alter table public.authors enable row level security;
alter table public.league_teams enable row level security;
alter table public.standings enable row level security;
alter table public.fixtures enable row level security;

drop policy if exists authors_public_read on public.authors;
create policy authors_public_read on public.authors for select to anon, authenticated using (is_active or public.is_editor());
drop policy if exists authors_editor_write on public.authors;
create policy authors_editor_write on public.authors for all to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists league_teams_public_read on public.league_teams;
create policy league_teams_public_read on public.league_teams for select to anon, authenticated using (is_active or public.is_editor());
drop policy if exists league_teams_editor_write on public.league_teams;
create policy league_teams_editor_write on public.league_teams for all to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists standings_public_read on public.standings;
create policy standings_public_read on public.standings for select to anon, authenticated using (true);
drop policy if exists standings_editor_write on public.standings;
create policy standings_editor_write on public.standings for all to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists fixtures_public_read on public.fixtures;
create policy fixtures_public_read on public.fixtures for select to anon, authenticated using (true);
drop policy if exists fixtures_editor_write on public.fixtures;
create policy fixtures_editor_write on public.fixtures for all to authenticated using (public.is_editor()) with check (public.is_editor());

grant select on public.authors, public.league_teams, public.standings, public.fixtures to anon, authenticated;
grant insert, update, delete on public.authors, public.league_teams, public.standings, public.fixtures to authenticated;

insert into public.authors (slug, name, role, bio, image_url, sort_order) values
  ('furkan', 'Furkan Katılmış', 'Genel Yayın Yönetmeni', 'E-Mac Turka gündemi, lig yönetimi ve transfer stratejileri üzerine yazıyor.', 'assets/images/yazarlar/furkan-katilmis-2.png', 1),
  ('eray', 'Eray', 'Taktik Yazarı', 'Fikstür, oyuncu rolleri ve haftalık kadro planlamasını inceliyor.', 'assets/images/yazarlar/eray.png', 2),
  ('berkay', 'Berkay Minkara', 'Lig Muhabiri', 'Lig rekabetini, derbileri ve güncel puan tablosunu takip ediyor.', 'assets/images/yazarlar/berkay-minkara.jpg', 3)
on conflict (slug) do nothing;

insert into public.league_teams (id, name, manager, short_name, sort_order) values
  ('00000000-0000-4000-8000-000000000001', 'Boğazın Kartalları', 'Berkay Minkara', 'BK', 1),
  ('00000000-0000-4000-8000-000000000002', 'Kadro Mühendisleri', 'Furkan Katılmış', 'KM', 2),
  ('00000000-0000-4000-8000-000000000003', 'Taktik Tahtası', 'Eray', 'TT', 3),
  ('00000000-0000-4000-8000-000000000004', 'Son Dakika FK', 'Ömer', 'SDFK', 4),
  ('00000000-0000-4000-8000-000000000005', 'Yeşil Tribün', 'Mert', 'YT', 5),
  ('00000000-0000-4000-8000-000000000006', 'Transfer Odası', 'Can', 'TO', 6),
  ('00000000-0000-4000-8000-000000000007', 'Macaton United', 'Ali', 'MU', 7),
  ('00000000-0000-4000-8000-000000000008', 'Fikstürspor', 'Efe', 'FS', 8)
on conflict (id) do nothing;

insert into public.standings (team_id, played, won, drawn, lost, fantasy_points, league_points, movement, form) values
  ('00000000-0000-4000-8000-000000000001', 3, 3, 0, 0, 247, 9, 'up', array['G','G','G']),
  ('00000000-0000-4000-8000-000000000002', 3, 3, 0, 0, 239, 9, 'same', array['G','G','G']),
  ('00000000-0000-4000-8000-000000000003', 3, 2, 0, 1, 226, 6, 'up', array['G','M','G']),
  ('00000000-0000-4000-8000-000000000004', 3, 1, 1, 1, 211, 4, 'down', array['B','G','M']),
  ('00000000-0000-4000-8000-000000000005', 3, 1, 1, 1, 205, 4, 'same', array['M','G','B']),
  ('00000000-0000-4000-8000-000000000006', 3, 1, 0, 2, 198, 3, 'up', array['M','M','G']),
  ('00000000-0000-4000-8000-000000000007', 3, 0, 2, 1, 191, 2, 'down', array['B','M','B']),
  ('00000000-0000-4000-8000-000000000008', 3, 0, 0, 3, 176, 0, 'down', array['M','M','M'])
on conflict (team_id) do nothing;

insert into public.fixtures (id, week, home_team_id, away_team_id, kickoff_at, status, home_score, away_score) values
  ('10000000-0000-4000-8000-000000000001', 1, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000008', '2026-08-14 20:00:00+03', 'finished', 82, 61),
  ('10000000-0000-4000-8000-000000000002', 1, '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000007', '2026-08-14 20:00:00+03', 'finished', 79, 67),
  ('10000000-0000-4000-8000-000000000003', 1, '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000006', '2026-08-15 18:00:00+03', 'finished', 74, 69),
  ('10000000-0000-4000-8000-000000000004', 1, '00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000005', '2026-08-15 21:00:00+03', 'finished', 70, 70),
  ('10000000-0000-4000-8000-000000000005', 2, '00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000001', '2026-08-21 20:00:00+03', 'live', 41, 48),
  ('10000000-0000-4000-8000-000000000006', 2, '00000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000003', '2026-08-21 20:00:00+03', 'scheduled', null, null),
  ('10000000-0000-4000-8000-000000000007', 2, '00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000004', '2026-08-22 18:00:00+03', 'scheduled', null, null),
  ('10000000-0000-4000-8000-000000000008', 2, '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000002', '2026-08-22 21:00:00+03', 'scheduled', null, null)
on conflict (id) do nothing;

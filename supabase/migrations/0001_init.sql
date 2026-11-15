-- ============ Extensions & enums ============
create extension if not exists "pgcrypto";

create type idea_status   as enum ('idea', 'planned', 'done', 'archived');
create type source_type   as enum ('tiktok', 'instagram', 'youtube', 'maps', 'other', 'none');
create type budget_level  as enum ('free', 'low', 'medium', 'high');
create type setting_type  as enum ('indoor', 'outdoor', 'either');
create type date_status   as enum ('planned', 'done', 'cancelled');
create type vote_type     as enum ('like', 'maybe', 'pass');

-- ============ Profiles ============
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Me',
  avatar_url   text,
  telegram_chat_id bigint,
  created_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Couples ============
create table public.couples (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Us',
  created_at  timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);
create unique index one_couple_per_user on public.couple_members (user_id);

create or replace function public.is_couple_member(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = c and user_id = auth.uid()
  );
$$;

-- ============ Ideas ============
create table public.ideas (
  id                  uuid primary key default gen_random_uuid(),
  couple_id           uuid not null references public.couples(id) on delete cascade,
  created_by          uuid not null references auth.users(id),
  title               text not null check (char_length(title) between 1 and 200),
  notes               text,
  status              idea_status not null default 'idea',

  source_url          text,
  source_type         source_type not null default 'none',
  source_external_id  text,
  source_author       text,
  source_caption      text,
  thumbnail_path      text,

  category            text,
  budget              budget_level,
  setting             setting_type default 'either',
  duration_minutes    int,
  location_name       text,
  lat                 double precision,
  lng                 double precision,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index ideas_couple_status on public.ideas (couple_id, status);
create unique index ideas_unique_source
  on public.ideas (couple_id, source_type, source_external_id)
  where source_external_id is not null;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger ideas_touch before update on public.ideas
  for each row execute function public.touch_updated_at();

-- ============ Tags ============
create table public.tags (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  name      text not null,
  unique (couple_id, name)
);
create table public.idea_tags (
  idea_id uuid not null references public.ideas(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (idea_id, tag_id)
);

-- ============ Dates ============
create table public.dates (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references public.couples(id) on delete cascade,
  idea_id      uuid references public.ideas(id) on delete set null,
  created_by   uuid not null references auth.users(id),
  title        text not null,
  scheduled_at timestamptz,
  status       date_status not null default 'planned',
  notes        text,
  created_at   timestamptz not null default now()
);
create index dates_couple_time on public.dates (couple_id, scheduled_at);

create table public.date_reviews (
  date_id      uuid not null references public.dates(id) on delete cascade,
  user_id      uuid not null references auth.users(id),
  rating       int check (rating between 1 and 5),
  note         text,
  would_repeat boolean,
  primary key (date_id, user_id)
);

create table public.date_photos (
  id           uuid primary key default gen_random_uuid(),
  date_id      uuid not null references public.dates(id) on delete cascade,
  couple_id    uuid not null references public.couples(id) on delete cascade,
  uploaded_by  uuid not null references auth.users(id),
  storage_path text not null,
  created_at   timestamptz not null default now()
);

-- ============ Swipes (v1.5) ============
create table public.swipes (
  idea_id    uuid not null references public.ideas(id) on delete cascade,
  user_id    uuid not null references auth.users(id),
  vote       vote_type not null,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

-- ============ Settings ============
create table public.couple_settings (
  couple_id      uuid primary key references public.couples(id) on delete cascade,
  nudge_enabled  boolean not null default true,
  nudge_weekday  int not null default 1,
  timezone       text not null default 'Asia/Jakarta'
);

-- ============ Row Level Security ============
alter table public.profiles        enable row level security;
alter table public.couples         enable row level security;
alter table public.couple_members  enable row level security;
alter table public.ideas           enable row level security;
alter table public.tags            enable row level security;
alter table public.idea_tags       enable row level security;
alter table public.dates           enable row level security;
alter table public.date_reviews    enable row level security;
alter table public.date_photos     enable row level security;
alter table public.swipes          enable row level security;
alter table public.couple_settings enable row level security;

create policy "profiles read" on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from public.couple_members a
    join public.couple_members b on a.couple_id = b.couple_id
    where a.user_id = auth.uid() and b.user_id = profiles.id
  )
);
create policy "profiles update" on public.profiles for update using (id = auth.uid());

create policy "couples read"  on public.couples for select using (public.is_couple_member(id));
create policy "members read"  on public.couple_members for select using (public.is_couple_member(couple_id));

create policy "ideas select" on public.ideas for select using (public.is_couple_member(couple_id));
create policy "ideas insert" on public.ideas for insert
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy "ideas update" on public.ideas for update using (public.is_couple_member(couple_id));
create policy "ideas delete" on public.ideas for delete using (public.is_couple_member(couple_id));

create policy "tags all" on public.tags for all
  using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));

create policy "idea_tags all" on public.idea_tags for all
  using (exists (select 1 from public.ideas i where i.id = idea_id and public.is_couple_member(i.couple_id)))
  with check (exists (select 1 from public.ideas i where i.id = idea_id and public.is_couple_member(i.couple_id)));

create policy "dates select" on public.dates for select using (public.is_couple_member(couple_id));
create policy "dates insert" on public.dates for insert
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy "dates update" on public.dates for update using (public.is_couple_member(couple_id));
create policy "dates delete" on public.dates for delete using (public.is_couple_member(couple_id));

create policy "reviews select" on public.date_reviews for select using (
  exists (select 1 from public.dates d where d.id = date_id and public.is_couple_member(d.couple_id))
);
create policy "reviews write own" on public.date_reviews for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "photos select" on public.date_photos for select using (public.is_couple_member(couple_id));
create policy "photos insert" on public.date_photos for insert
  with check (public.is_couple_member(couple_id) and uploaded_by = auth.uid());
create policy "photos delete" on public.date_photos for delete using (public.is_couple_member(couple_id));

create policy "swipes own" on public.swipes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "settings all" on public.couple_settings for all
  using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));

-- ============ Helper RPCs ============
create or replace function public.pick_idea(
  p_couple uuid,
  p_budget budget_level default null,
  p_setting setting_type default null,
  p_max_minutes int default null,
  p_category text default null
) returns setof public.ideas
language sql stable security invoker as $$
  select * from public.ideas
  where couple_id = p_couple
    and status = 'idea'
    and (p_budget is null or budget is null or budget <= p_budget)
    and (p_setting is null or setting = 'either' or setting = p_setting)
    and (p_max_minutes is null or duration_minutes is null or duration_minutes <= p_max_minutes)
    and (p_category is null or category = p_category)
  order by random()
  limit 1;
$$;

create or replace function public.get_matches(p_couple uuid)
returns setof public.ideas
language sql stable security definer set search_path = public as $$
  select i.* from public.ideas i
  where public.is_couple_member(p_couple)
    and i.couple_id = p_couple
    and i.status = 'idea'
    and (select count(*) from public.swipes s
         where s.idea_id = i.id and s.vote = 'like') >= 2;
$$;

-- ============ Storage ============
insert into storage.buckets (id, name, public) values
  ('thumbnails', 'thumbnails', true),
  ('date-photos', 'date-photos', false)
on conflict (id) do nothing;

create policy "thumbnails write" on storage.objects for insert
  with check (bucket_id = 'thumbnails'
         and public.is_couple_member(((storage.foldername(name))[1])::uuid));

create policy "photos bucket read" on storage.objects for select
  using (bucket_id = 'date-photos'
         and public.is_couple_member(((storage.foldername(name))[1])::uuid));
create policy "photos bucket write" on storage.objects for insert
  with check (bucket_id = 'date-photos'
         and public.is_couple_member(((storage.foldername(name))[1])::uuid));

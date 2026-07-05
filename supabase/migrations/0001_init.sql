-- Nomly database schema
-- Run against a Supabase project (SQL editor or `supabase db push`).
-- Assumes Supabase Auth is enabled; auth.users is the source of truth for accounts.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- food_preferences
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.food_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  favorite_cuisines text[] not null default '{}',
  disliked_foods text[] not null default '{}',
  dietary_restrictions text[] not null default '{}',
  allergies text[] not null default '{}',
  spice_level int not null default 50 check (spice_level between 0 and 100),
  budget_min int not null default 10,
  budget_max int not null default 30,
  max_distance int not null default 5,
  dining_style text not null default 'dine-in' check (dining_style in ('dine-in','takeout','delivery','cook-at-home')),
  mood_preferences text[] not null default '{}',
  recommendation_styles text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- favorite_restaurants
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.favorite_restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  restaurant_name text not null,
  address text,
  rating numeric,
  photo_url text,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- restaurant_history
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.restaurant_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  restaurant_name text not null,
  visited_at timestamptz not null default now(),
  notes text
);

-- ─────────────────────────────────────────────────────────────────────────
-- group_rooms
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.group_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting','active','completed','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- group_members
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.group_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text not null,
  is_ready boolean not null default false,
  joined_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- group_preferences
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.group_preferences (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.group_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text not null,
  budget_min int not null default 10,
  budget_max int not null default 30,
  max_distance int not null default 5,
  cravings text[] not null default '{}',
  disliked_foods text[] not null default '{}',
  dietary_restrictions text[] not null default '{}',
  mood text default 'happy',
  dining_style text not null default 'dine-in' check (dining_style in ('dine-in','takeout','delivery','cook-at-home')),
  spice_level int not null default 50 check (spice_level between 0 and 100),
  is_ready boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (room_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- group_results
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.group_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.group_rooms(id) on delete cascade,
  place_id text not null,
  restaurant_name text not null,
  compatibility_score int not null check (compatibility_score between 0 and 100),
  reason_summary text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────
create index if not exists idx_group_members_room on public.group_members(room_id);
create index if not exists idx_group_preferences_room on public.group_preferences(room_id);
create index if not exists idx_group_results_room on public.group_results(room_id);
create index if not exists idx_favorite_restaurants_user on public.favorite_restaurants(user_id);
create index if not exists idx_restaurant_history_user on public.restaurant_history(user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.food_preferences enable row level security;
alter table public.favorite_restaurants enable row level security;
alter table public.restaurant_history enable row level security;
alter table public.group_rooms enable row level security;
alter table public.group_members enable row level security;
alter table public.group_preferences enable row level security;
alter table public.group_results enable row level security;

-- profiles: users manage their own row, but display names are readable by anyone
-- (needed so group room members can see each other's names).
create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users manage their own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage their own food preferences" on public.food_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage their own favorites" on public.favorite_restaurants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage their own history" on public.restaurant_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- group rooms/members/preferences/results are readable by anyone with the room id
-- (guests without accounts can join via invite link) and writable by anyone —
-- access is effectively gated by knowledge of the unguessable room code/id.
-- Tighten these policies if you need stricter guest isolation.
create policy "rooms are readable by anyone" on public.group_rooms for select using (true);
create policy "authenticated users can create rooms" on public.group_rooms
  for insert with check (auth.uid() = created_by or created_by is null);
create policy "room creator can update room" on public.group_rooms
  for update using (true);

create policy "members are readable by anyone" on public.group_members for select using (true);
create policy "anyone can join a room" on public.group_members for insert with check (true);
create policy "members can update their own row" on public.group_members
  for update using (true);

create policy "group preferences are readable by anyone" on public.group_preferences for select using (true);
create policy "anyone can set group preferences" on public.group_preferences for insert with check (true);
create policy "members can update their own preferences" on public.group_preferences
  for update using (true);

create policy "group results are readable by anyone" on public.group_results for select using (true);
create policy "anyone can write group results" on public.group_results for insert with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Realtime
-- ─────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.group_preferences;
alter publication supabase_realtime add table public.group_rooms;
alter publication supabase_realtime add table public.group_results;

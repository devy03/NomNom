-- Add room naming and permanent room code features
-- Adds support for group room history, naming, and vote tracking

-- Add room_name column to group_rooms
ALTER TABLE public.group_rooms ADD COLUMN IF NOT EXISTS room_name TEXT;

-- Add is_permanent flag (defaults to true for new rooms, existing rooms stay open)
ALTER TABLE public.group_rooms ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT TRUE;

-- Create table for vote tracking
CREATE TABLE IF NOT EXISTS public.group_votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.group_rooms(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  guest_name text not null,
  user_id uuid,
  place_id text not null,
  restaurant_name text not null,
  voted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_group_rooms_created_by_created_at
ON public.group_rooms(created_by, created_at DESC)
WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_group_votes_room
ON public.group_votes(room_id);

CREATE INDEX IF NOT EXISTS idx_group_votes_member
ON public.group_votes(member_id);

-- Enable RLS on votes table
ALTER TABLE public.group_votes ENABLE ROW LEVEL SECURITY;

-- Votes are readable by anyone who knows the room code (same as other group tables)
CREATE POLICY "votes are publicly readable" ON public.group_votes FOR SELECT USING (true);

-- Anyone can insert votes (anyone in the room)
CREATE POLICY "users can record votes" ON public.group_votes FOR INSERT WITH CHECK (true);

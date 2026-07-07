-- Shared group meetup location + computed result snapshot
-- Fixes the bug where each member saw restaurants near their OWN location by
-- giving the whole room a single shared origin, and stores the computed match
-- as a JSON snapshot so every member renders a byte-identical result list.

-- Shared search origin (defaults to the room creator's location, editable to a
-- specific meetup address by the creator).
ALTER TABLE public.group_rooms ADD COLUMN IF NOT EXISTS origin_lat double precision;
ALTER TABLE public.group_rooms ADD COLUMN IF NOT EXISTS origin_lng double precision;
ALTER TABLE public.group_rooms ADD COLUMN IF NOT EXISTS location_label text;

-- Full computed GroupMatchBreakdown[] as JSON so all members see the same rich
-- cards (photos, cuisine, distance, badges, per-member reasons). The thin
-- group_results table can't hold this shape.
ALTER TABLE public.group_rooms ADD COLUMN IF NOT EXISTS result_snapshot jsonb;
ALTER TABLE public.group_rooms ADD COLUMN IF NOT EXISTS results_computed_at timestamptz;

-- group_rooms is already in the supabase_realtime publication (migration 0001),
-- so updates to these columns auto-broadcast to every subscribed member.

import { supabase } from "@/lib/supabaseClient";
import { hasSupabase } from "@/lib/env";
import type { GroupMember, GroupMemberPreferences, GroupRoom, RoomStatus } from "@/types";

export class GroupServiceError extends Error {}

function randomRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── In-memory / localStorage fallback (used when Supabase isn't configured) ──
// Realtime updates are simulated with a BroadcastChannel so multiple tabs on
// the same machine still see each other live during local development.
const LOCAL_ROOMS_KEY = "nomnom:demo-rooms";
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("nomnom-group-rooms") : null;

interface LocalRoomState {
  room: GroupRoom;
  members: GroupMember[];
  preferences: GroupMemberPreferences[];
}

function readLocalRooms(): Record<string, LocalRoomState> {
  try {
    const raw = localStorage.getItem(LOCAL_ROOMS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalRooms(rooms: Record<string, LocalRoomState>) {
  try {
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
    channel?.postMessage({ type: "update" });
  } catch {
    // ignore
  }
}

export async function createRoom(userId?: string): Promise<GroupRoom> {
  const roomCode = randomRoomCode();

  if (!hasSupabase) {
    const room: GroupRoom = {
      id: roomCode,
      roomCode,
      createdBy: userId ?? "demo",
      status: "waiting",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const rooms = readLocalRooms();
    rooms[roomCode] = { room, members: [], preferences: [] };
    writeLocalRooms(rooms);
    return room;
  }

  const { data, error } = await supabase!
    .from("group_rooms")
    .insert({ room_code: roomCode, created_by: userId ?? null, status: "waiting" })
    .select()
    .single();
  if (error) throw new GroupServiceError(error.message);
  return {
    id: data.id, roomCode: data.room_code, createdBy: data.created_by,
    status: data.status, createdAt: data.created_at, updatedAt: data.updated_at,
  };
}

export async function findRoomByCode(roomCode: string): Promise<GroupRoom | null> {
  if (!hasSupabase) {
    const rooms = readLocalRooms();
    return rooms[roomCode.toUpperCase()]?.room ?? null;
  }
  const { data, error } = await supabase!
    .from("group_rooms")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .maybeSingle();
  if (error) throw new GroupServiceError(error.message);
  if (!data) return null;
  return {
    id: data.id, roomCode: data.room_code, createdBy: data.created_by,
    status: data.status, createdAt: data.created_at, updatedAt: data.updated_at,
  };
}

export async function joinRoom(roomId: string, guestName: string, userId?: string): Promise<GroupMember> {
  if (!hasSupabase) {
    const rooms = readLocalRooms();
    const state = rooms[roomId];
    if (!state) throw new GroupServiceError("Room not found");
    const member: GroupMember = {
      id: crypto.randomUUID(), roomId, userId, guestName, isReady: false, joinedAt: new Date().toISOString(),
    };
    state.members.push(member);
    writeLocalRooms(rooms);
    return member;
  }

  const { data, error } = await supabase!
    .from("group_members")
    .insert({ room_id: roomId, user_id: userId ?? null, guest_name: guestName, is_ready: false })
    .select()
    .single();
  if (error) throw new GroupServiceError(error.message);
  return { id: data.id, roomId: data.room_id, userId: data.user_id, guestName: data.guest_name, isReady: data.is_ready, joinedAt: data.joined_at };
}

export async function getMembers(roomId: string): Promise<GroupMember[]> {
  if (!hasSupabase) {
    return readLocalRooms()[roomId]?.members ?? [];
  }
  const { data, error } = await supabase!.from("group_members").select("*").eq("room_id", roomId).order("joined_at");
  if (error) throw new GroupServiceError(error.message);
  return (data ?? []).map((m) => ({ id: m.id, roomId: m.room_id, userId: m.user_id, guestName: m.guest_name, isReady: m.is_ready, joinedAt: m.joined_at }));
}

export async function getGroupPreferences(roomId: string): Promise<GroupMemberPreferences[]> {
  if (!hasSupabase) {
    return readLocalRooms()[roomId]?.preferences ?? [];
  }
  const { data, error } = await supabase!.from("group_preferences").select("*").eq("room_id", roomId);
  if (error) throw new GroupServiceError(error.message);
  return (data ?? []).map((p) => ({
    id: p.id, roomId: p.room_id, userId: p.user_id, guestName: p.guest_name,
    budgetMin: p.budget_min, budgetMax: p.budget_max, maxDistanceMiles: p.max_distance,
    cravings: p.cravings ?? [], dislikedFoods: p.disliked_foods ?? [], dietaryRestrictions: p.dietary_restrictions ?? [],
    mood: p.mood ?? "Happy", diningStyle: p.dining_style, spiceLevel: p.spice_level,
    openToNewPlaces: true, isReady: p.is_ready, updatedAt: p.updated_at,
  }));
}

export async function savePreferences(
  roomId: string,
  memberId: string,
  guestName: string,
  userId: string | undefined,
  prefs: Omit<GroupMemberPreferences, "roomId" | "guestName" | "userId">
): Promise<void> {
  if (!hasSupabase) {
    const rooms = readLocalRooms();
    const state = rooms[roomId];
    if (!state) throw new GroupServiceError("Room not found");
    const existingIdx = state.preferences.findIndex((p) => p.userId === userId || (!userId && p.guestName === guestName));
    const record: GroupMemberPreferences = { ...prefs, roomId, guestName, userId };
    if (existingIdx >= 0) state.preferences[existingIdx] = record;
    else state.preferences.push(record);
    const memberIdx = state.members.findIndex((m) => m.id === memberId);
    if (memberIdx >= 0) state.members[memberIdx].isReady = prefs.isReady;
    writeLocalRooms(rooms);
    return;
  }

  const { error } = await supabase!.from("group_preferences").upsert({
    room_id: roomId, user_id: userId ?? null, guest_name: guestName,
    budget_min: prefs.budgetMin, budget_max: prefs.budgetMax, max_distance: prefs.maxDistanceMiles,
    cravings: prefs.cravings, disliked_foods: prefs.dislikedFoods, dietary_restrictions: prefs.dietaryRestrictions,
    mood: prefs.mood, dining_style: prefs.diningStyle, spice_level: prefs.spiceLevel, is_ready: prefs.isReady,
  }, { onConflict: "room_id,user_id" });
  if (error) throw new GroupServiceError(error.message);

  await supabase!.from("group_members").update({ is_ready: prefs.isReady }).eq("id", memberId);
}

export async function setRoomStatus(roomId: string, status: RoomStatus): Promise<void> {
  if (!hasSupabase) {
    const rooms = readLocalRooms();
    if (rooms[roomId]) {
      rooms[roomId].room.status = status;
      writeLocalRooms(rooms);
    }
    return;
  }
  const { error } = await supabase!.from("group_rooms").update({ status }).eq("id", roomId);
  if (error) throw new GroupServiceError(error.message);
}

type RoomChangeHandler = () => void;

/** Subscribes to live changes for a room. Falls back to BroadcastChannel
 * polling when Supabase isn't configured, so local multi-tab demos still
 * feel real-time. Returns an unsubscribe function. */
export function subscribeToRoom(roomId: string, onChange: RoomChangeHandler): () => void {
  if (!hasSupabase) {
    const handler = () => onChange();
    channel?.addEventListener("message", handler);
    const interval = setInterval(onChange, 2500);
    return () => {
      channel?.removeEventListener("message", handler);
      clearInterval(interval);
    };
  }

  const sub = supabase!
    .channel(`room:${roomId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "group_members", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "group_preferences", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "group_rooms", filter: `id=eq.${roomId}` }, onChange)
    .subscribe();

  return () => {
    supabase!.removeChannel(sub);
  };
}

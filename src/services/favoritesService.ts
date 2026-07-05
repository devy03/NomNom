import { supabase } from "@/lib/supabaseClient";
import { hasSupabase } from "@/lib/env";
import type { FavoriteRestaurant, Restaurant } from "@/types";

const LOCAL_KEY = "nomnom:demo-favorites";

function readLocal(): FavoriteRestaurant[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(favorites: FavoriteRestaurant[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(favorites));
  } catch {
    // ignore
  }
}

export async function getFavorites(userId?: string): Promise<FavoriteRestaurant[]> {
  if (!hasSupabase || !userId) return readLocal();
  const { data, error } = await supabase!
    .from("favorite_restaurants")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    placeId: row.place_id,
    restaurantName: row.restaurant_name,
    address: row.address,
    rating: row.rating,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
  }));
}

export async function isFavorite(userId: string | undefined, placeId: string): Promise<boolean> {
  const favorites = await getFavorites(userId);
  return favorites.some((f) => f.placeId === placeId);
}

export async function addFavorite(userId: string | undefined, restaurant: Restaurant): Promise<void> {
  if (!hasSupabase || !userId) {
    const favorites = readLocal();
    if (favorites.some((f) => f.placeId === restaurant.id)) return;
    favorites.unshift({
      id: crypto.randomUUID(),
      userId: userId ?? "demo",
      placeId: restaurant.id,
      restaurantName: restaurant.name,
      address: restaurant.address,
      rating: restaurant.rating,
      photoUrl: restaurant.image,
      createdAt: new Date().toISOString(),
    });
    writeLocal(favorites);
    return;
  }

  const { error } = await supabase!.from("favorite_restaurants").upsert(
    {
      user_id: userId,
      place_id: restaurant.id,
      restaurant_name: restaurant.name,
      address: restaurant.address,
      rating: restaurant.rating,
      photo_url: restaurant.image,
    },
    { onConflict: "user_id,place_id" }
  );
  if (error) throw error;
}

export async function removeFavorite(userId: string | undefined, placeId: string): Promise<void> {
  if (!hasSupabase || !userId) {
    writeLocal(readLocal().filter((f) => f.placeId !== placeId));
    return;
  }
  const { error } = await supabase!.from("favorite_restaurants").delete().eq("user_id", userId).eq("place_id", placeId);
  if (error) throw error;
}

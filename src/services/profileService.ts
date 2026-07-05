import { supabase } from "@/lib/supabaseClient";
import { hasSupabase } from "@/lib/env";
import type { FoodPreferences, Profile } from "@/types";

const LOCAL_PROFILE_KEY = "nomnom:demo-profile";
const LOCAL_PREFS_KEY = "nomnom:demo-preferences";

export const defaultPreferences: FoodPreferences = {
  favoriteCuisines: [],
  dislikedFoods: [],
  dietaryRestrictions: [],
  allergies: [],
  spiceLevel: 50,
  budgetMin: 10,
  budgetMax: 30,
  maxDistanceMiles: 5,
  diningStyle: "dine-in",
  recommendationStyles: [],
  moodPreferences: [],
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (private mode / storage full)
  }
}

export async function getProfile(userId?: string): Promise<Profile | null> {
  if (!hasSupabase || !userId) {
    return readLocal<Profile | null>(LOCAL_PROFILE_KEY, null);
  }
  const { data, error } = await supabase!.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, userId: data.user_id, displayName: data.display_name, avatarUrl: data.avatar_url };
}

export async function upsertProfile(userId: string | undefined, profile: Partial<Profile>): Promise<Profile> {
  if (!hasSupabase || !userId) {
    const existing = readLocal<Profile | null>(LOCAL_PROFILE_KEY, null);
    const merged: Profile = { userId: userId ?? "demo", displayName: "Alex", ...existing, ...profile };
    writeLocal(LOCAL_PROFILE_KEY, merged);
    return merged;
  }

  const { data, error } = await supabase!
    .from("profiles")
    .upsert(
      { user_id: userId, display_name: profile.displayName, avatar_url: profile.avatarUrl },
      { onConflict: "user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, userId: data.user_id, displayName: data.display_name, avatarUrl: data.avatar_url };
}

function fromRow(row: Record<string, unknown>): FoodPreferences {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    favoriteCuisines: (row.favorite_cuisines as string[]) ?? [],
    dislikedFoods: (row.disliked_foods as string[]) ?? [],
    dietaryRestrictions: (row.dietary_restrictions as string[]) ?? [],
    allergies: (row.allergies as string[]) ?? [],
    spiceLevel: (row.spice_level as number) ?? 50,
    budgetMin: (row.budget_min as number) ?? 10,
    budgetMax: (row.budget_max as number) ?? 30,
    maxDistanceMiles: (row.max_distance as number) ?? 5,
    diningStyle: (row.dining_style as FoodPreferences["diningStyle"]) ?? "dine-in",
    recommendationStyles: (row.recommendation_styles as FoodPreferences["recommendationStyles"]) ?? [],
    moodPreferences: (row.mood_preferences as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getFoodPreferences(userId?: string): Promise<FoodPreferences> {
  if (!hasSupabase || !userId) {
    return readLocal<FoodPreferences>(LOCAL_PREFS_KEY, defaultPreferences);
  }
  const { data, error } = await supabase!
    .from("food_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : defaultPreferences;
}

export async function saveFoodPreferences(
  userId: string | undefined,
  prefs: FoodPreferences
): Promise<FoodPreferences> {
  if (!hasSupabase || !userId) {
    writeLocal(LOCAL_PREFS_KEY, prefs);
    return prefs;
  }

  const { data, error } = await supabase!
    .from("food_preferences")
    .upsert({
      user_id: userId,
      favorite_cuisines: prefs.favoriteCuisines,
      disliked_foods: prefs.dislikedFoods,
      dietary_restrictions: prefs.dietaryRestrictions,
      allergies: prefs.allergies,
      spice_level: prefs.spiceLevel,
      budget_min: prefs.budgetMin,
      budget_max: prefs.budgetMax,
      max_distance: prefs.maxDistanceMiles,
      dining_style: prefs.diningStyle,
      mood_preferences: prefs.moodPreferences ?? [],
      recommendation_styles: prefs.recommendationStyles,
    }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

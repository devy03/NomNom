import type { Coordinates, Restaurant } from "@/types";
import { env, hasGeoapify } from "@/lib/env";
import { mockRestaurants } from "@/data/mockRestaurants";
import { milesBetween } from "@/services/locationService";

export class RestaurantServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RestaurantServiceError";
  }
}

export interface RestaurantFilters {
  minPrice?: 1 | 2 | 3 | 4;
  maxPrice?: 1 | 2 | 3 | 4;
  openNowOnly?: boolean;
  cuisine?: string;
  maxDistanceMiles?: number;
  minRating?: number;
  /** Restrict the search to fast-food-style places only. */
  fastFoodOnly?: boolean;
}

// Geoapify Places API (https://apidocs.geoapify.com/docs/places/) — built on
// OpenStreetMap data, free tier (3,000 credits/day, 1 credit per 20 results).
// Replaces the previous Google Places integration entirely.
const CATERING_CATEGORIES = [
  "catering.restaurant",
  "catering.fast_food",
  "catering.cafe",
  "catering.pub",
  "catering.bar",
  "catering.food_court",
  "catering.ice_cream",
].join(",");

const FAST_FOOD_CATEGORIES = "catering.fast_food";

// OSM/Geoapify don't expose a price-tier field for most places, so every
// result gets a flat "moderate" price level; this stays a rough average
// check size for that tier (used for budget matching/estimates).
const PRICE_LEVEL_AVG: Record<1 | 2 | 3 | 4, number> = { 1: 12, 2: 22, 3: 40, 4: 65 };

interface GeoapifyProperties {
  place_id: string;
  name?: string;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  lat: number;
  lon: number;
  categories?: string[];
  contact?: { phone?: string };
  website?: string;
  opening_hours?: string;
  wiki_and_media?: { image?: string };
}

interface GeoapifyFeature {
  properties: GeoapifyProperties;
}

function guessCuisine(categories: string[] | undefined): string {
  const specific = categories?.find((c) => c.startsWith("catering.") && c !== "catering.restaurant");
  if (!specific) return "Restaurant";
  // Categories can nest (e.g. "catering.restaurant.american") — the last
  // dot-segment is always the most specific/human-readable part.
  const lastSegment = specific.split(".").pop() ?? specific;
  return lastSegment
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";

/** Maps a Geoapify Places/Place-Details feature into the app's Restaurant
 * shape. `image` is only ever populated when called from getRestaurantDetails
 * (via wiki_and_media, only present on the Place Details endpoint) — bulk
 * nearby search results always get the placeholder image, since fetching
 * details per-result would mean one extra API call per restaurant. Geoapify
 * has no rating/review-count field at all (OSM doesn't track this), so those
 * are honestly left at 0 rather than guessed. */
function normalizeFeature(feature: GeoapifyFeature, origin?: Coordinates): Restaurant {
  const p = feature.properties;
  const location = { lat: p.lat, lng: p.lon };
  const image = p.wiki_and_media?.image;

  return {
    id: p.place_id,
    source: "geoapify",
    name: p.name ?? "Unnamed Restaurant",
    image: image ?? DEFAULT_IMAGE,
    photos: image ? [image] : [],
    rating: 0,
    reviewsCount: 0,
    distanceMiles: origin ? milesBetween(origin, location) : undefined,
    priceLevel: 2,
    cuisine: guessCuisine(p.categories),
    // OSM's opening_hours is a raw mini-syntax string, not a simple bool —
    // parsing it correctly needs a dedicated library, so we surface the raw
    // string in `hours` but don't claim to know if it's open right now.
    openNow: "unknown",
    address: p.formatted ?? ([p.address_line1, p.address_line2].filter(Boolean).join(", ") || "Address unavailable"),
    location,
    phone: p.contact?.phone,
    website: p.website,
    mapsUrl: `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}`,
    hours: p.opening_hours ? [p.opening_hours] : undefined,
    tags: (p.categories ?? []).map((t) => t.replace(/^catering\./, "").replace(/_/g, " ")).slice(0, 5),
    waitTimeMins: undefined,
  };
}

function applyMockFallback(origin: Coordinates | undefined, filters?: RestaurantFilters): Restaurant[] {
  let list = mockRestaurants.map((r) =>
    origin ? { ...r, distanceMiles: milesBetween(origin, r.location) } : r
  );
  if (filters) list = applyFilters(list, filters);
  return list.sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0));
}

function applyFilters(list: Restaurant[], filters: RestaurantFilters): Restaurant[] {
  return list.filter((r) => {
    if (filters.minPrice && r.priceLevel < filters.minPrice) return false;
    if (filters.maxPrice && r.priceLevel > filters.maxPrice) return false;
    if (filters.openNowOnly && r.openNow !== true) return false;
    if (filters.cuisine && r.cuisine.toLowerCase() !== filters.cuisine.toLowerCase()) return false;
    if (filters.maxDistanceMiles && (r.distanceMiles ?? 0) > filters.maxDistanceMiles) return false;
    if (filters.minRating && r.rating < filters.minRating) return false;
    return true;
  });
}

// ── Nearby-search cache (in-memory + sessionStorage) ────────────────────────
// There was no caching at all before this change, so every page nav/revisit
// re-fired the same request. Keyed on a coarse ~1km grid + radius + category
// set, TTL 20 min — keeps everyday use comfortably inside Geoapify's free
// 3,000-credits/day tier.
const NEARBY_CACHE_TTL_MS = 20 * 60 * 1000;
const nearbyMemCache = new Map<string, { at: number; data: Restaurant[] }>();

function nearbyCacheKey(origin: Coordinates, radiusMeters: number, categories: string): string {
  return `${origin.lat.toFixed(2)}_${origin.lng.toFixed(2)}_${radiusMeters}_${categories}`;
}

function readNearbyCache(key: string): Restaurant[] | null {
  const mem = nearbyMemCache.get(key);
  if (mem && Date.now() - mem.at < NEARBY_CACHE_TTL_MS) return mem.data;
  try {
    const raw = sessionStorage.getItem(`nomnom:nearby-cache:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: Restaurant[] };
    if (Date.now() - parsed.at >= NEARBY_CACHE_TTL_MS) return null;
    nearbyMemCache.set(key, parsed);
    return parsed.data;
  } catch {
    return null;
  }
}

function writeNearbyCache(key: string, data: Restaurant[]) {
  const entry = { at: Date.now(), data };
  nearbyMemCache.set(key, entry);
  try {
    sessionStorage.setItem(`nomnom:nearby-cache:${key}`, JSON.stringify(entry));
  } catch {
    // ignore (private mode / storage full)
  }
}

/** Nearby restaurant search via Geoapify Places API. Falls back to mock data
 * if no API key is configured or the request fails. */
export async function searchNearbyRestaurants(
  origin: Coordinates,
  filters?: RestaurantFilters
): Promise<Restaurant[]> {
  if (!hasGeoapify) return applyMockFallback(origin, filters);

  const radiusMeters = Math.round((filters?.maxDistanceMiles ?? 8) * 1609.34);
  const categories = filters?.fastFoodOnly ? FAST_FOOD_CATEGORIES : CATERING_CATEGORIES;
  const cacheKey = nearbyCacheKey(origin, radiusMeters, categories);
  const cached = readNearbyCache(cacheKey);
  if (cached) return filters ? applyFilters(cached, filters) : cached;

  try {
    const url =
      `https://api.geoapify.com/v2/places?categories=${categories}` +
      `&filter=circle:${origin.lng},${origin.lat},${radiusMeters}` +
      `&bias=proximity:${origin.lng},${origin.lat}` +
      `&limit=60&apiKey=${env.geoapifyApiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new RestaurantServiceError(`Places API returned ${res.status}`);
    const data = await res.json();
    const features: GeoapifyFeature[] = data.features ?? [];
    const results = features
      .map((f) => normalizeFeature(f, origin))
      .sort((a, b) => (a.distanceMiles ?? 999) - (b.distanceMiles ?? 999));

    writeNearbyCache(cacheKey, results);
    return filters ? applyFilters(results, filters) : results;
  } catch {
    return applyMockFallback(origin, filters);
  }
}

/** Geoapify's Places API has no free-text search endpoint like Google's Text
 * Search — fetch the nearby pool (cached, see above) and filter client-side. */
export async function searchRestaurantsByText(query: string, origin?: Coordinates): Promise<Restaurant[]> {
  const q = query.toLowerCase();
  const matchesQuery = (r: Restaurant) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q);

  if (!hasGeoapify || !origin) {
    return applyMockFallback(origin).filter(matchesQuery);
  }

  const pool = await searchNearbyRestaurants(origin);
  const matches = pool.filter(matchesQuery);
  return matches.length > 0 ? matches : applyMockFallback(origin).filter(matchesQuery);
}

export async function getRestaurantDetails(placeId: string, origin?: Coordinates): Promise<Restaurant> {
  if (!hasGeoapify || placeId.startsWith("mock-")) {
    const found = mockRestaurants.find((r) => r.id === placeId);
    if (!found) throw new RestaurantServiceError("Restaurant not found");
    return origin ? { ...found, distanceMiles: milesBetween(origin, found.location) } : found;
  }

  try {
    const url = `https://api.geoapify.com/v2/place-details?id=${encodeURIComponent(placeId)}&features=details,contact,wiki_and_media&apiKey=${env.geoapifyApiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new RestaurantServiceError(`Places API returned ${res.status}`);
    const data = await res.json();
    const feature: GeoapifyFeature | undefined = data.features?.[0];
    if (!feature) throw new RestaurantServiceError("Restaurant not found");
    return normalizeFeature(feature, origin);
  } catch (err) {
    const found = mockRestaurants.find((r) => r.id === placeId);
    if (found) return origin ? { ...found, distanceMiles: milesBetween(origin, found.location) } : found;
    throw err instanceof RestaurantServiceError ? err : new RestaurantServiceError("Could not load restaurant details");
  }
}

export function getRestaurantPhotos(restaurant: Restaurant): string[] {
  return restaurant.photos.length > 0 ? restaurant.photos : [restaurant.image];
}

export function estimateAveragePrice(restaurant: Restaurant): number {
  return PRICE_LEVEL_AVG[restaurant.priceLevel];
}

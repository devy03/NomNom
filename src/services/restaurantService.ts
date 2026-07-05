import type { Coordinates, Restaurant } from "@/types";
import { env, hasGooglePlaces } from "@/lib/env";
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

// The actual food-serving place types we want back from Google. Grouped into
// small batches because Nearby Search caps out at 20 results per request —
// running several targeted batches and merging them is how we get a real
// 40-60 result pool instead of the ~20 a single "restaurant" query returns.
const FOOD_TYPE_BATCHES: string[][] = [
  ["restaurant", "fast_food_restaurant", "meal_takeaway", "cafe"],
  ["bakery", "pizza_restaurant", "hamburger_restaurant", "sandwich_shop"],
  ["indian_restaurant", "mexican_restaurant", "chinese_restaurant", "japanese_restaurant"],
  ["thai_restaurant", "american_restaurant"],
];

const FAST_FOOD_TYPES = [
  "fast_food_restaurant",
  "hamburger_restaurant",
  "pizza_restaurant",
  "sandwich_shop",
  "meal_takeaway",
];

const ALL_FOOD_TYPES = new Set(FOOD_TYPE_BATCHES.flat());

// Types that disqualify a result outright, even if it also carries a food
// type (e.g. a hotel with an on-site restaurant is still a hotel listing).
const HARD_EXCLUDE_TYPES = new Set(["lodging", "hotel", "motel", "gas_station"]);

// Store-type venues (groceries, big-box retail, convenience stores) that
// only count as food places if they're also explicitly tagged as a
// restaurant or takeaway — otherwise a Whole Foods or Walmart with a deli
// counter would show up as a "restaurant".
const STORE_TYPES = new Set([
  "convenience_store",
  "grocery_store",
  "supermarket",
  "department_store",
  "warehouse_store",
]);

/** True if a place is a genuine food venue, filtering out hotels, gas
 * stations, grocery/retail stores, and bars that don't actually serve food
 * as a restaurant/takeaway would. */
function isFoodPlace(place: GooglePlace): boolean {
  const types = new Set(place.types ?? []);

  for (const excluded of HARD_EXCLUDE_TYPES) {
    if (types.has(excluded)) return false;
  }

  const isStore = [...STORE_TYPES].some((t) => types.has(t));
  if (isStore && !types.has("meal_takeaway") && !types.has("restaurant")) {
    return false;
  }

  if (types.has("bar") && !types.has("restaurant") && !types.has("meal_takeaway")) {
    return false;
  }

  for (const foodType of ALL_FOOD_TYPES) {
    if (types.has(foodType)) return true;
  }
  return false;
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.photos",
  "places.primaryTypeDisplayName",
  "places.types",
].join(",");

const SINGLE_FIELD_MASK = FIELD_MASK.replace(/places\./g, "");

const PRICE_LEVEL_MAP: Record<string, 1 | 2 | 3 | 4> = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

// Rough per-price-level average check size, used since Google no longer
// exposes a dollar figure directly.
const PRICE_LEVEL_AVG: Record<1 | 2 | 3 | 4, number> = { 1: 12, 2: 22, 3: 40, 4: 65 };

function guessCuisine(place: GooglePlace): string {
  const type = place.primaryTypeDisplayName?.text;
  if (type) return type;
  const typeGuess = place.types?.find((t) => t.endsWith("_restaurant"));
  if (typeGuess) {
    return typeGuess
      .replace("_restaurant", "")
      .split("_")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  }
  return "Restaurant";
}

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  photos?: { name: string }[];
  primaryTypeDisplayName?: { text: string };
  types?: string[];
}

function photoUrl(photoName: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1000&key=${env.googlePlacesApiKey}`;
}

function normalizePlace(place: GooglePlace, origin?: Coordinates): Restaurant {
  const location = place.location
    ? { lat: place.location.latitude, lng: place.location.longitude }
    : { lat: 0, lng: 0 };
  const priceLevel = place.priceLevel ? PRICE_LEVEL_MAP[place.priceLevel] ?? 2 : 2;
  const photos = (place.photos ?? []).map((p) => photoUrl(p.name));

  return {
    id: place.id,
    source: "google",
    name: place.displayName?.text ?? "Unnamed Restaurant",
    image: photos[0] ?? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    photos,
    rating: place.rating ?? 0,
    reviewsCount: place.userRatingCount ?? 0,
    distanceMiles: origin && place.location ? milesBetween(origin, location) : undefined,
    priceLevel,
    cuisine: guessCuisine(place),
    openNow: place.currentOpeningHours?.openNow ?? "unknown",
    address: place.formattedAddress ?? "Address unavailable",
    location,
    phone: place.internationalPhoneNumber,
    website: place.websiteUri,
    mapsUrl: place.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text ?? "")}`,
    hours: place.currentOpeningHours?.weekdayDescriptions ?? place.regularOpeningHours?.weekdayDescriptions,
    tags: (place.types ?? []).map((t) => t.replace(/_/g, " ")).slice(0, 5),
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

async function fetchNearbyBatch(
  origin: Coordinates,
  includedTypes: string[],
  radiusMeters: number
): Promise<GooglePlace[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googlePlacesApiKey!,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: origin.lat, longitude: origin.lng },
          radius: radiusMeters,
        },
      },
    }),
  });
  if (!res.ok) throw new RestaurantServiceError(`Places API returned ${res.status}`);
  const data = await res.json();
  return data.places ?? [];
}

/** Nearby restaurant search. Runs several targeted Nearby Search requests
 * (one per food-type batch, or just the fast-food batch when requested),
 * merges the results, dedupes by place id, and drops anything that isn't a
 * genuine food venue (hotels, gas stations, plain convenience stores, and
 * bars that don't also serve food). Falls back to mock data if no API key
 * is configured or every request fails (e.g. CORS in local dev without a
 * proxy). */
export async function searchNearbyRestaurants(
  origin: Coordinates,
  filters?: RestaurantFilters
): Promise<Restaurant[]> {
  if (!hasGooglePlaces) return applyMockFallback(origin, filters);

  const radiusMeters = (filters?.maxDistanceMiles ?? 8) * 1609.34;
  const batches = filters?.fastFoodOnly ? [FAST_FOOD_TYPES] : FOOD_TYPE_BATCHES;

  const batchResults = await Promise.allSettled(
    batches.map((types) => fetchNearbyBatch(origin, types, radiusMeters))
  );

  const anySucceeded = batchResults.some((r) => r.status === "fulfilled");
  if (!anySucceeded) return applyMockFallback(origin, filters);

  const seen = new Map<string, GooglePlace>();
  for (const result of batchResults) {
    if (result.status !== "fulfilled") continue;
    for (const place of result.value) {
      if (!seen.has(place.id) && isFoodPlace(place)) {
        seen.set(place.id, place);
      }
    }
  }

  let results = Array.from(seen.values()).map((p) => normalizePlace(p, origin));
  if (filters) results = applyFilters(results, filters);

  return results
    .sort((a, b) => {
      const distA = a.distanceMiles ?? 999;
      const distB = b.distanceMiles ?? 999;
      if (Math.abs(distA - distB) > 0.05) return distA - distB;
      return b.rating - a.rating;
    })
    .slice(0, 60);
}

export async function searchRestaurantsByText(
  query: string,
  origin?: Coordinates
): Promise<Restaurant[]> {
  if (!hasGooglePlaces) {
    const q = query.toLowerCase();
    return applyMockFallback(origin).filter(
      (r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)
    );
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.googlePlacesApiKey!,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        includedType: "restaurant",
        ...(origin && {
          locationBias: {
            circle: { center: { latitude: origin.lat, longitude: origin.lng }, radius: 15000 },
          },
        }),
      }),
    });
    if (!res.ok) throw new RestaurantServiceError(`Places API returned ${res.status}`);
    const data = await res.json();
    const places: GooglePlace[] = data.places ?? [];
    return places.map((p) => normalizePlace(p, origin));
  } catch {
    const q = query.toLowerCase();
    return applyMockFallback(origin).filter(
      (r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)
    );
  }
}

export async function getRestaurantDetails(placeId: string, origin?: Coordinates): Promise<Restaurant> {
  if (!hasGooglePlaces || placeId.startsWith("mock-")) {
    const found = mockRestaurants.find((r) => r.id === placeId);
    if (!found) throw new RestaurantServiceError("Restaurant not found");
    return origin ? { ...found, distanceMiles: milesBetween(origin, found.location) } : found;
  }

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": env.googlePlacesApiKey!,
        "X-Goog-FieldMask": SINGLE_FIELD_MASK,
      },
    });
    if (!res.ok) throw new RestaurantServiceError(`Places API returned ${res.status}`);
    const place: GooglePlace = await res.json();
    return normalizePlace(place, origin);
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

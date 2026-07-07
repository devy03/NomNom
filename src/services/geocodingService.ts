import type { Coordinates } from "@/types";
import { SF_DEFAULT_CENTER } from "@/data/mockRestaurants";

export class GeocodingError extends Error {
  constructor(message = "We couldn't find that location. Try a city, ZIP, or full address.") {
    super(message);
    this.name = "GeocodingError";
  }
}

// Geocoding runs against OpenStreetMap's public Nominatim instance — free, no
// API key. Per its usage policy (https://operations.osmfoundation.org/policies/nominatim/)
// callers must identify themselves via User-Agent or Referer and must cache
// results. Browsers block scripts from setting a custom User-Agent, but every
// fetch() automatically sends this page's Referer, which the policy accepts
// as the alternative — combined with the localStorage cache below, that
// satisfies both requirements without needing a proxy.
const NOMINATIM_CACHE_KEY = "nomnom:geocode-cache";

function readGeocodeCache(): Record<string, GeocodeResult> {
  try {
    const raw = localStorage.getItem(NOMINATIM_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeGeocodeCache(cache: Record<string, GeocodeResult>) {
  try {
    localStorage.setItem(NOMINATIM_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore (private mode / storage full)
  }
}

// A tiny offline fallback so manual-location entry still "works" in demo/dev
// mode without an API key. Matches a handful of well-known cities/ZIPs.
const FALLBACK_PLACES: Record<string, Coordinates & { label: string }> = {
  "san francisco": { lat: 37.7749, lng: -122.4194, label: "San Francisco, CA" },
  "new york": { lat: 40.7128, lng: -74.006, label: "New York, NY" },
  "los angeles": { lat: 34.0522, lng: -118.2437, label: "Los Angeles, CA" },
  "chicago": { lat: 41.8781, lng: -87.6298, label: "Chicago, IL" },
  "austin": { lat: 30.2672, lng: -97.7431, label: "Austin, TX" },
  "seattle": { lat: 47.6062, lng: -122.3321, label: "Seattle, WA" },
  "94103": { lat: 37.7725, lng: -122.4147, label: "San Francisco, CA 94103" },
  "94110": { lat: 37.7519, lng: -122.4212, label: "San Francisco, CA 94110" },
  "10001": { lat: 40.7506, lng: -73.9972, label: "New York, NY 10001" },
};

export interface GeocodeResult extends Coordinates {
  label: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  const trimmed = query.trim();
  if (!trimmed) throw new GeocodingError("Enter a city, ZIP code, or address.");

  const cacheKey = trimmed.toLowerCase();
  const cache = readGeocodeCache();
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data) && data[0]) {
      const result: GeocodeResult = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        label: data[0].display_name,
      };
      writeGeocodeCache({ ...cache, [cacheKey]: result });
      return result;
    }
  } catch {
    // network error — fall through to offline fallback below
  }

  const directMatch = FALLBACK_PLACES[cacheKey];
  if (directMatch) return directMatch;

  const partial = Object.entries(FALLBACK_PLACES).find(([k]) => cacheKey.includes(k) || k.includes(cacheKey));
  if (partial) return partial[1];

  // Last resort: center on the default demo city so the UI keeps working.
  return { ...SF_DEFAULT_CENTER, label: `${trimmed} (approximate)` };
}

import type { Coordinates } from "@/types";
import { env, hasGooglePlaces } from "@/lib/env";
import { SF_DEFAULT_CENTER } from "@/data/mockRestaurants";

export class GeocodingError extends Error {
  constructor(message = "We couldn't find that location. Try a city, ZIP, or full address.") {
    super(message);
    this.name = "GeocodingError";
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

  if (hasGooglePlaces) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        trimmed
      )}&key=${env.googlePlacesApiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.results?.[0]) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          label: result.formatted_address,
        };
      }
      throw new GeocodingError();
    } catch (err) {
      if (err instanceof GeocodingError) throw err;
      // network/CORS error — fall through to offline fallback below
    }
  }

  const key = trimmed.toLowerCase();
  const directMatch = FALLBACK_PLACES[key];
  if (directMatch) return directMatch;

  const partial = Object.entries(FALLBACK_PLACES).find(([k]) => key.includes(k) || k.includes(key));
  if (partial) return partial[1];

  // Last resort: center on the default demo city so the UI keeps working.
  return { ...SF_DEFAULT_CENTER, label: `${trimmed} (approximate)` };
}

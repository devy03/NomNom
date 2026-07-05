import type { Coordinates } from "@/types";

export class LocationPermissionDeniedError extends Error {
  constructor() {
    super("Location permission denied");
    this.name = "LocationPermissionDeniedError";
  }
}

export class LocationUnavailableError extends Error {
  constructor(message = "Location is currently unavailable") {
    super(message);
    this.name = "LocationUnavailableError";
  }
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/**
 * Requests the browser's current position. Only call this from a direct user
 * action (e.g. clicking "Use My Location") — browsers block/annoy on
 * unsolicited permission prompts.
 */
export function getCurrentPosition(options?: PositionOptions): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new LocationUnavailableError("Your browser does not support geolocation"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new LocationPermissionDeniedError());
        } else {
          reject(new LocationUnavailableError(error.message));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options }
    );
  });
}

export function milesBetween(a: Coordinates, b: Coordinates): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c * 10) / 10;
}

const LOCATION_STORAGE_KEY = "nomnom:last-location";

export function persistLocation(coords: Coordinates, label: string) {
  try {
    sessionStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ coords, label }));
  } catch {
    // sessionStorage may be unavailable (private browsing); ignore.
  }
}

export function readPersistedLocation(): { coords: Coordinates; label: string } | null {
  try {
    const raw = sessionStorage.getItem(LOCATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

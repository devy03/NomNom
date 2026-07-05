import { useCallback, useState } from "react";
import type { Coordinates } from "@/types";
import {
  getCurrentPosition,
  LocationPermissionDeniedError,
  persistLocation,
  readPersistedLocation,
} from "@/services/locationService";
import { geocodeAddress } from "@/services/geocodingService";

export type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "error";

export function useGeolocation() {
  const persisted = readPersistedLocation();
  const [coords, setCoords] = useState<Coordinates | null>(persisted?.coords ?? null);
  const [label, setLabel] = useState<string | null>(persisted?.label ?? null);
  const [status, setStatus] = useState<LocationStatus>(persisted ? "granted" : "idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestBrowserLocation = useCallback(async () => {
    setStatus("requesting");
    setErrorMessage(null);
    try {
      const pos = await getCurrentPosition();
      setCoords(pos);
      setLabel("your current location");
      setStatus("granted");
      persistLocation(pos, "your current location");
      return pos;
    } catch (err) {
      if (err instanceof LocationPermissionDeniedError) {
        setStatus("denied");
        setErrorMessage("Location permission denied — enter a city or ZIP instead.");
      } else {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Couldn't get your location.");
      }
      throw err;
    }
  }, []);

  const setManualLocation = useCallback(async (query: string) => {
    setStatus("requesting");
    setErrorMessage(null);
    try {
      const result = await geocodeAddress(query);
      const newCoords = { lat: result.lat, lng: result.lng };
      setCoords(newCoords);
      setLabel(result.label);
      setStatus("granted");
      persistLocation(newCoords, result.label);
      return newCoords;
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Couldn't find that location.");
      throw err;
    }
  }, []);

  return { coords, label, status, errorMessage, requestBrowserLocation, setManualLocation };
}

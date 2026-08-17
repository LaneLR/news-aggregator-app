"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "morningfeeds:weatherLocation";

// Local-only, same reasoning as readerPrefs.js: this is opt-in by
// construction (nothing is read/shown until the user explicitly grants a
// location, either via a real browser geolocation permission prompt or a
// manual city/zip search — never inferred from IP or read silently), and
// works for anonymous readers since it never leaves the browser or touches
// the account. See the memory note this feature came from: location data
// here must be something the user deliberately hands over, not silently
// detected.
export function useWeatherLocation() {
  const [location, setLocationState] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLocationState(JSON.parse(saved));
    } catch {
      // Ignore malformed/unavailable storage — falls back to "no location".
    }
    setHydrated(true);
  }, []);

  const setLocation = (next) => {
    setLocationState(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Best-effort persistence only.
    }
  };

  return { location, setLocation, hydrated };
}

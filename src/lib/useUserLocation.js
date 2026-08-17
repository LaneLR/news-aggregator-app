"use client";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "morningfeeds:weatherLocation";
// Fired on every setLocation call so sibling components mounted in the same
// tab (weather widget, Settings' Location card, the Local News prompt) stay
// in sync with each other — the browser's own "storage" event only fires in
// *other* tabs/windows, never the one that made the change, which isn't
// enough once more than one component reads this same saved location.
const CHANGE_EVENT = "morningfeeds:user-location-changed";

// Local-only, same reasoning as readerPrefs.js: this is opt-in by
// construction (nothing is read/shown until the user explicitly grants a
// location, either via a real browser geolocation permission prompt or a
// manual city/zip search — never inferred from IP or read silently), and
// works for anonymous readers since it never leaves the browser or touches
// the account. See the memory note this feature came from: location data
// here must be something the user deliberately hands over, not silently
// detected.
//
// Originally weather-only (hence the storage key, kept as-is so existing
// saved locations aren't silently dropped) — now shared with Local News,
// which reads/writes the same location rather than prompting separately.
// See LocationPicker.jsx for the shared acquisition UI both features use.
export function useUserLocation() {
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

    const handleChange = (event) => setLocationState(event.detail);
    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CHANGE_EVENT, handleChange);
  }, []);

  const setLocation = useCallback((next) => {
    setLocationState(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Best-effort persistence only.
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, []);

  return { location, setLocation, hydrated };
}

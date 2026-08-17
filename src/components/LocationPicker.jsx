"use client";
import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { useUserLocation } from "@/lib/useUserLocation";
import styles from "./LocationPicker.module.scss";

// Shared "acquire a location" UI — a real browser geolocation prompt plus a
// manual city/zip fallback (via the existing /api/weather/search geocoding
// endpoint). Originally lived inline inside WeatherWidget's popover; pulled
// out so Settings' Location card and the Local News opt-in prompt can offer
// the exact same picker rather than three drifting copies. All three write
// to the same useUserLocation-backed location, so changing it in any one of
// them updates the other two immediately (see useUserLocation.js).
//
// Only ever rendered while there's no saved location, or the caller is
// letting the user replace one — showing/hiding the "current location"
// summary once one exists is each consumer's own concern (weather shows a
// temperature, Settings shows plain text, the Local News prompt shows
// neither), so this component doesn't render that state itself.
export default function LocationPicker({ onPicked, onCancel, onSearchResponse, autoFocus = false }) {
  const { setLocation } = useUserLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | error
  const [geoError, setGeoError] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/weather/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        onSearchResponse?.(data);
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
    // onSearchResponse is intentionally omitted — callers (WeatherWidget,
    // etc.) pass a fresh inline function on every render, and including it
    // here would reset the debounce timer on every parent re-render instead
    // of only on a real query change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const pickLocation = (loc) => {
    const next = {
      name: loc.name ?? null,
      state: loc.state ?? null,
      country: loc.country ?? null,
      lat: loc.lat,
      lon: loc.lon,
    };
    setLocation(next);
    setQuery("");
    setResults([]);
    setGeoStatus("idle");
    setGeoError("");
    onPicked?.(next);
  };

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("error");
      setGeoError("Geolocation isn't supported in this browser — search for your city or zip instead.");
      return;
    }
    setGeoStatus("loading");
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // No reverse-geocode call — consumers already fall back to a
        // server-provided display name (weather's locationName, Local
        // News's resolved hub-city name) whenever name/state are unset.
        pickLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (error) => {
        setGeoStatus("error");
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? "Location access denied — search for your city or zip instead."
            : "Couldn't get your location — search for your city or zip instead."
        );
      },
      { timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.geoButton}
        onClick={useMyLocation}
        disabled={geoStatus === "loading"}
      >
        <LocateFixed size={14} strokeWidth={2} />
        {geoStatus === "loading" ? "Locating…" : "Use my current location"}
      </button>
      {geoStatus === "error" && <p className={styles.geoError}>{geoError}</p>}
      <div className={styles.divider}>
        <span>or enter manually</span>
      </div>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="City, state, or zip code…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search for a city or zip code"
        autoFocus={autoFocus}
      />
      {results.length > 0 && (
        <ul className={styles.resultsList} role="listbox">
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lon}-${i}`}>
              <button type="button" className={styles.resultButton} onClick={() => pickLocation(r)}>
                {[r.name, r.state, r.country].filter(Boolean).join(", ")}
              </button>
            </li>
          ))}
        </ul>
      )}
      {onCancel && (
        <button type="button" className={styles.cancelLink} onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
}

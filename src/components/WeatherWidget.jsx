"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, X, Pencil } from "lucide-react";
import { useWeatherLocation } from "@/lib/useWeatherLocation";
import { getWeatherDisplay } from "@/lib/weatherCodes";
import styles from "./WeatherWidget.module.scss";

// Lives in the header, between the search bar and the icon button group — a
// compact trigger that expands into a small popover, the same pattern
// Header.jsx already uses for its own account menu (see
// dropdownContainer/dropdownMenu there), rather than the always-visible
// inline card this used to be on /news.
//
// Current conditions only — no radar, alerts, or forecast beyond right now,
// and no push notifications. Opt-in by construction: nothing is fetched or
// shown until the user explicitly picks a location (see
// useWeatherLocation.js), never inferred from IP/geolocation. Renders
// nothing at all if the site owner hasn't set OPENWEATHER_API_KEY yet.
export default function WeatherWidget() {
  const { location, setLocation, hydrated } = useWeatherLocation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [notConfigured, setNotConfigured] = useState(false);
  const [conditions, setConditions] = useState(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!location || editing) return;
    let cancelled = false;
    fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.configured || data.error) {
          setConditions(null);
          if (!data.configured) setNotConfigured(true);
          return;
        }
        setConditions(data);
      })
      .catch(() => {
        if (!cancelled) setConditions(null);
      });
    return () => {
      cancelled = true;
    };
  }, [location, editing]);

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
        if (!data.configured) {
          setNotConfigured(true);
          setResults([]);
          return;
        }
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Matches Header.jsx's own account-menu dropdown: close on an outside
  // click or Escape, only listening while actually open.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!hydrated || notConfigured) return null;

  const pickLocation = (loc) => {
    setLocation({ name: loc.name, state: loc.state, country: loc.country, lat: loc.lat, lon: loc.lon });
    setConditions(null);
    setEditing(false);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const removeLocation = () => {
    setLocation(null);
    setConditions(null);
    setEditing(false);
  };

  const showSearch = !location || editing;
  const displayName = location
    ? [location.name, location.state || location.country].filter(Boolean).join(", ")
    : "";
  const weatherDisplay = conditions ? getWeatherDisplay(conditions.conditionId, conditions.isDay) : null;
  const TriggerIcon = weatherDisplay?.Icon || MapPin;

  const triggerLabel =
    location && conditions
      ? `Weather: ${conditions.tempF}°F, ${weatherDisplay.label} in ${conditions.locationName || displayName}. Open weather settings.`
      : "Add your location for local weather";

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={triggerLabel}
      >
        <TriggerIcon size={17} strokeWidth={2} />
        {location && conditions && <span className={styles.tempLabel}>{conditions.tempF}°F</span>}
      </button>

      {open && (
        <div className={styles.popover} role="dialog" aria-label="Weather">
          {showSearch ? (
            <div className={styles.searchArea}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Add your location — city, state, or zip code…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search for a city or zip code for local weather"
                autoFocus
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
              {location && (
                <button
                  type="button"
                  className={styles.cancelLink}
                  onClick={() => {
                    setEditing(false);
                    setQuery("");
                    setResults([]);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          ) : conditions ? (
            <div className={styles.conditionsArea}>
              <div className={styles.conditionsRow}>
                <TriggerIcon size={22} strokeWidth={2} className={styles.conditionIcon} />
                <div>
                  <p className={styles.conditionsTemp}>{conditions.tempF}°F</p>
                  <p className={styles.conditionsLabel}>
                    {weatherDisplay.label} in {conditions.locationName || displayName}
                  </p>
                </div>
              </div>
              <div className={styles.actionsRow}>
                <button type="button" className={styles.actionButton} onClick={() => setEditing(true)}>
                  <Pencil size={13} strokeWidth={2} />
                  Change location
                </button>
                <button type="button" className={styles.actionButton} onClick={removeLocation}>
                  <X size={13} strokeWidth={2} />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <p className={styles.loadingText}>Loading weather…</p>
          )}
        </div>
      )}
    </div>
  );
}

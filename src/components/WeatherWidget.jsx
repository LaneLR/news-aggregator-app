"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, X, Pencil } from "lucide-react";
import { useWeatherLocation } from "@/lib/useWeatherLocation";
import { getWeatherDisplay } from "@/lib/weatherCodes";
import styles from "./WeatherWidget.module.scss";

// Current conditions only — no radar, no alerts, no forecast, no push
// notifications. Opt-in by construction: nothing is fetched or shown until
// the user explicitly picks a location (see useWeatherLocation.js), never
// inferred from IP/geolocation. Renders nothing at all if the site owner
// hasn't set OPENWEATHER_API_KEY yet, or once results with location come
// back with configured:false (key removed after a location was already
// saved) — a missing/removed key is a site-config concern, not something
// to surface to visitors as an error.
export default function WeatherWidget() {
  const { location, setLocation, hydrated } = useWeatherLocation();
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [notConfigured, setNotConfigured] = useState(false);
  const [conditions, setConditions] = useState(null);
  const debounceRef = useRef(null);

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

  if (!hydrated || notConfigured) return null;

  const pickLocation = (loc) => {
    setLocation({ name: loc.name, state: loc.state, country: loc.country, lat: loc.lat, lon: loc.lon });
    setConditions(null);
    setEditing(false);
    setQuery("");
    setResults([]);
  };

  const removeLocation = () => {
    setLocation(null);
    setConditions(null);
    setEditing(false);
  };

  const displayName = location ? [location.name, location.state || location.country].filter(Boolean).join(", ") : "";

  if (!location || editing) {
    return (
      <div className={styles.widget}>
        <MapPin size={16} strokeWidth={2} className={styles.pinIcon} />
        <div className={styles.searchArea}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Add your location for local weather…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search for a city for local weather"
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
        </div>
        {location && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => {
              setEditing(false);
              setQuery("");
              setResults([]);
            }}
            aria-label="Cancel changing location"
          >
            <X size={15} strokeWidth={2} />
          </button>
        )}
      </div>
    );
  }

  if (!conditions) return null;

  const { label, Icon } = getWeatherDisplay(conditions.conditionId, conditions.isDay);

  return (
    <div className={styles.widget}>
      <Icon size={20} strokeWidth={2} className={styles.conditionIcon} />
      <span className={styles.temp}>{conditions.tempF}°F</span>
      <span className={styles.location}>
        {label} in {conditions.locationName || displayName}
      </span>
      <button type="button" className={styles.iconButton} onClick={() => setEditing(true)} aria-label="Change weather location">
        <Pencil size={14} strokeWidth={2} />
      </button>
      <button type="button" className={styles.iconButton} onClick={removeLocation} aria-label="Remove weather location">
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

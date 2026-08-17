"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, X, Pencil } from "lucide-react";
import { useUserLocation } from "@/lib/useUserLocation";
import { getWeatherDisplay } from "@/lib/weatherCodes";
import LocationPicker from "./LocationPicker";
import styles from "./WeatherWidget.module.scss";

// Lives in the header, between the search bar and the icon button group — a
// compact trigger that expands into a small popover, the same pattern
// Header.jsx already uses for its own account menu (see
// dropdownContainer/dropdownMenu there), rather than the always-visible
// inline card this used to be on /news.
//
// Current conditions only — no radar, alerts, or forecast beyond right now,
// and no push notifications. Opt-in by construction: nothing is fetched or
// shown until the user explicitly grants a location, either by tapping "Use
// my current location" (a real browser permission prompt — nothing is read
// silently or inferred from IP) or by searching a city/zip manually. The
// acquisition UI itself lives in LocationPicker.jsx, shared with Settings'
// Location card and the Local News opt-in prompt — all three read/write the
// same useUserLocation-backed location. Renders nothing at all if the site
// owner hasn't set OPENWEATHER_API_KEY yet.
export default function WeatherWidget() {
  const { location, setLocation, hydrated } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [conditions, setConditions] = useState(null);
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

  const removeLocation = () => {
    // Handled by LocationPicker's own setLocation for picks; Remove has no
    // picker involved, so it goes straight through the shared hook.
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
            <LocationPicker
              autoFocus
              onPicked={() => {
                setConditions(null);
                setEditing(false);
                setOpen(false);
              }}
              onCancel={location ? () => setEditing(false) : undefined}
              onSearchResponse={(data) => {
                if (!data.configured) setNotConfigured(true);
              }}
            />
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

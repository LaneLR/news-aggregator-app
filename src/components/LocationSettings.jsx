"use client";
import { useState } from "react";
import { MapPin, Pencil, X } from "lucide-react";
import { useUserLocation } from "@/lib/useUserLocation";
import LocationPicker from "./LocationPicker";
import styles from "./LocationSettings.module.scss";

// A permanent, always-reachable home for the location used by both the
// weather widget and Local News — so a user who denied geolocation (or
// wants to switch it for a trip) can fix it without re-triggering the
// browser's permission prompt. Same useUserLocation-backed location as
// those two; changing it here updates them immediately, and vice versa.
export default function LocationSettings() {
  const { location, setLocation, hydrated } = useUserLocation();
  const [editing, setEditing] = useState(false);

  if (!hydrated) return null;

  const displayName = location
    ? [location.name, location.state || location.country].filter(Boolean).join(", ")
    : "";

  const removeLocation = () => {
    setLocation(null);
    setEditing(false);
  };

  return (
    <div className={styles.container}>
      <p className={styles.helperText}>
        Used for local weather and Local News — never shared, never inferred from your IP.
      </p>
      {!location || editing ? (
        <LocationPicker
          onPicked={() => setEditing(false)}
          onCancel={location ? () => setEditing(false) : undefined}
        />
      ) : (
        <div className={styles.currentLocation}>
          <div className={styles.currentLocationLabel}>
            <MapPin size={16} strokeWidth={2} />
            <span>{displayName || "Saved location"}</span>
          </div>
          <div className={styles.actionsRow}>
            <button type="button" className={styles.actionButton} onClick={() => setEditing(true)}>
              <Pencil size={13} strokeWidth={2} />
              Change
            </button>
            <button type="button" className={styles.actionButton} onClick={removeLocation}>
              <X size={13} strokeWidth={2} />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

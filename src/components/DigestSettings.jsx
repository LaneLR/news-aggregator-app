"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./DigestSettings.module.scss";

export default function DigestSettings() {
  const { data: session, update } = useSession();
  const [saving, setSaving] = useState(false);

  const enabled = !!session?.user?.digestEnabled;
  const frequency = session?.user?.digestFrequency || "weekly";

  const savePreferences = async (fields) => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/digest-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Failed to update digest preferences");
      await update(fields);
    } catch (err) {
      console.error("Failed to update digest preferences:", err);
      alert("Something went wrong updating your email digest settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <div>
          <div className={styles.label}>Email Digest</div>
          <p className={styles.subLabel}>
            Get trending headlines and picks based on what you&apos;ve liked
            and saved, sent to your inbox.
          </p>
        </div>
        <label className={styles.switchWrapper}>
          <input
            className={styles.switchInput}
            type="checkbox"
            checked={enabled}
            disabled={saving}
            onChange={(e) => savePreferences({ digestEnabled: e.target.checked })}
          />
          <span className={styles.switchSlider} />
        </label>
      </div>

      {enabled && (
        <div className={styles.row}>
          <div
            className={styles.label}
            style={{ fontWeight: 400, color: "var(--theme-text-secondary)" }}
          >
            How often?
          </div>
          <div className={styles.frequencyToggle}>
            <button
              type="button"
              className={`${styles.frequencyOption} ${
                frequency === "daily" ? styles.active : ""
              }`}
              disabled={saving}
              onClick={() => savePreferences({ digestFrequency: "daily" })}
            >
              Daily
            </button>
            <button
              type="button"
              className={`${styles.frequencyOption} ${
                frequency === "weekly" ? styles.active : ""
              }`}
              disabled={saving}
              onClick={() => savePreferences({ digestFrequency: "weekly" })}
            >
              Weekly
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

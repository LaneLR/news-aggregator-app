"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "./ToastProvider";
import styles from "./DigestSettings.module.scss";

export default function DigestSettings() {
  const { data: session } = useSession();
  const toast = useToast();
  const [prefs, setPrefs] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [saving, setSaving] = useState(false);

  const isSubscribed = session?.user?.tier !== "Free";

  useEffect(() => {
    fetch("/api/users/digest-preferences")
      .then((res) => res.json())
      .then(setPrefs)
      .catch((err) => console.error("Failed to load digest preferences:", err));

    if (isSubscribed) {
      fetch("/api/feeds")
        .then((res) => res.json())
        .then((data) => setFeeds(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Failed to load feeds:", err));
    }
  }, [isSubscribed]);

  const savePreferences = async (fields) => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/digest-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Failed to update digest preferences");
      const data = await res.json();
      setPrefs((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to update digest preferences:", err);
      toast.error("Something went wrong updating your email digest settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) return null;

  const enabled = !!prefs.digestEnabled;
  const frequency = prefs.digestFrequency || "weekly";

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
        <>
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

          {isSubscribed && feeds.length > 0 && (
            <div className={styles.row}>
              <div
                className={styles.label}
                style={{ fontWeight: 400, color: "var(--theme-text-secondary)" }}
              >
                Digest content
              </div>
              <select
                className={styles.feedSelect}
                value={prefs.digestFeedId || ""}
                disabled={saving}
                onChange={(e) =>
                  savePreferences({ digestFeedId: e.target.value || null })
                }
              >
                <option value="">Trending &amp; For You</option>
                {feeds.map((feed) => (
                  <option key={feed.id} value={feed.id}>
                    {feed.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

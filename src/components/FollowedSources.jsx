"use client";
import { useState } from "react";
import { X } from "lucide-react";
import styles from "./KeywordFilters.module.scss";

// Sources are only ever added via the follow icon on an article card (see
// FollowSourceButton) — there's no free-text add field here, since a typo'd
// source name would just never match anything. This is a review/unfollow
// surface, not the primary way to follow a source.
export default function FollowedSources({ initialSources }) {
  const [sources, setSources] = useState(initialSources || []);
  const [saving, setSaving] = useState(false);

  const handleRemove = async (sourceName) => {
    const next = sources.filter((s) => s !== sourceName);
    setSources(next);
    setSaving(true);
    try {
      const res = await fetch("/api/users/followed-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceName }),
      });
      if (!res.ok) throw new Error("Failed to unfollow source");
      const data = await res.json();
      setSources(data.followedSources);
    } catch (err) {
      console.error("Failed to unfollow source:", err);
      setSources((prev) =>
        prev.includes(sourceName) ? prev : [...prev, sourceName]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className={styles.helperText}>
        Sources you follow from the follow icon on any article card. They&apos;re
        prioritized in your <a href="/for-you">For You feed</a> and included on your{" "}
        <a href="/following">Following page</a>.
      </p>

      {sources.length > 0 ? (
        <div className={styles.chipList}>
          {sources.map((sourceName) => (
            <span key={sourceName} className={styles.chip}>
              {sourceName}
              <button
                type="button"
                onClick={() => handleRemove(sourceName)}
                disabled={saving}
                aria-label={`Unfollow ${sourceName}`}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className={styles.helperText}>You&apos;re not following any sources yet.</p>
      )}
    </div>
  );
}

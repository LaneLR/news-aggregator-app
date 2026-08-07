"use client";
import { useState } from "react";
import { X } from "lucide-react";
import styles from "./KeywordFilters.module.scss";

export default function KeywordFilters({ initialKeywords }) {
  const [keywords, setKeywords] = useState(initialKeywords || []);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const persist = async (next) => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/keyword-filters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mutedKeywords: next }),
      });
      if (!res.ok) throw new Error("Failed to update keyword filters");
      const data = await res.json();
      setKeywords(data.mutedKeywords);
    } catch (err) {
      console.error("Failed to update keyword filters:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const value = draft.trim();
    if (!value || keywords.includes(value)) {
      setDraft("");
      return;
    }
    const next = [...keywords, value];
    setKeywords(next);
    setDraft("");
    persist(next);
  };

  const handleRemove = (keyword) => {
    const next = keywords.filter((k) => k !== keyword);
    setKeywords(next);
    persist(next);
  };

  return (
    <div>
      <p className={styles.helperText}>
        Articles with these words in the title are hidden from your feeds,
        search, and email digest.
      </p>

      <form className={styles.addRow} onSubmit={handleAdd}>
        <input
          className={styles.input}
          type="text"
          placeholder="Add a word or phrase to mute…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={saving}
          maxLength={40}
        />
        <button type="submit" className={styles.addButton} disabled={saving}>
          Add
        </button>
      </form>

      {keywords.length > 0 && (
        <div className={styles.chipList}>
          {keywords.map((keyword) => (
            <span key={keyword} className={styles.chip}>
              {keyword}
              <button
                type="button"
                onClick={() => handleRemove(keyword)}
                disabled={saving}
                aria-label={`Remove ${keyword}`}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

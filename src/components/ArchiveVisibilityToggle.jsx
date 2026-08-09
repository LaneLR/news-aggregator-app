"use client";
import { useState } from "react";
import { Globe, Lock } from "lucide-react";
import CopyButton from "./CopyButton";
import { useToast } from "./ToastProvider";
import styles from "./ArchiveVisibilityToggle.module.scss";

export default function ArchiveVisibilityToggle({ archiveId, initialIsPublic, initialSlug }) {
  const toast = useToast();
  const [isPublic, setIsPublic] = useState(!!initialIsPublic);
  const [slug, setSlug] = useState(initialSlug || null);
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    const next = !isPublic;
    setSaving(true);
    try {
      const res = await fetch(`/api/archives/${archiveId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      const data = await res.json();
      setIsPublic(data.isPublic);
      setSlug(data.publicSlug);
      toast.success(data.isPublic ? "Archive is now public." : "Archive is now private.");
    } catch (err) {
      console.error("Failed to update archive visibility:", err);
      toast.error("Something went wrong updating this archive's visibility.");
    } finally {
      setSaving(false);
    }
  };

  const shareUrl =
    slug && typeof window !== "undefined" ? `${window.location.origin}/archives/shared/${slug}` : "";

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.toggleButton} ${isPublic ? styles.active : ""}`}
        onClick={handleToggle}
        disabled={saving}
      >
        {isPublic ? <Globe size={15} strokeWidth={2} /> : <Lock size={15} strokeWidth={2} />}
        {isPublic ? "Public" : "Make Public"}
      </button>

      {isPublic && slug && (
        <div className={styles.shareRow}>
          <input className={styles.shareInput} type="text" value={shareUrl} readOnly />
          <CopyButton textToCopy={shareUrl} />
        </div>
      )}
    </div>
  );
}

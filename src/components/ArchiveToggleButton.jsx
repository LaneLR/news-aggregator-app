"use client";
import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { useToast } from "./ToastProvider";
import styles from "./ArchiveToggleButton.module.scss";

export default function ArchiveToggleButton({
  article,
  archiveId: propArchiveId,
  viewOnly = false,
}) {
  const toast = useToast();
  const [archives, setArchives] = useState([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState(
    propArchiveId || null
  );
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    const fetchArchives = async () => {
      try {
        const res = await fetch("/api/archives");
        const data = await res.json();
        if (res.ok) setArchives(data.archives);
      } catch (err) {
        console.error("Error loading archives:", err);
      }
    };
    fetchArchives();
  }, []);

  useEffect(() => {
    if (isSaved || !article.url || propArchiveId || viewOnly) return;

    const checkIfSaved = async () => {
      try {
        const res = await fetch(
          `/api/articles/check?url=${encodeURIComponent(article.url)}`
        );
        if (!res.ok) {
          const text = await res.text();
          console.warn("Check failed:", text);
          return;
        }

        const data = await res.json();
        if (data.saved) {
          setIsSaved(true);
          setSelectedArchiveId(data.archiveId);
        }
      } catch (err) {
        console.error("Error checking saved status:", err);
      }
    };

    checkIfSaved();
  }, [article.url, propArchiveId, isSaved]);

  const handleArchiveSelect = async (archiveId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/archives/${archiveId}/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          urlToImage: article.urlToImage,
          sourceName:
            article.sourceName || article.source?.name || "Unknown source",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSaved(true);
        setSelectedArchiveId(archiveId);
        setDropdownVisible(false);
      } else {
        toast.error(data.message || "Failed to save article.");
      }
    } catch (err) {
      console.error("Error saving article:", err);
      toast.error("Failed to save article. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedArchiveId || !article.id) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/archives/${selectedArchiveId}/articles/${article.id}`,
        {
          method: "DELETE",
        }
      );

      const data = res.status === 204 ? {} : await res.json();
      if (res.ok) {
        setIsSaved(false);
      } else {
        toast.error(data.message || "Failed to remove article.");
      }
    } catch (err) {
      console.error("Error removing article:", err);
      toast.error("Failed to remove article. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {isSaved && propArchiveId && !viewOnly ? (
        <button
          type="button"
          data-action="save"
          className={`${styles.saveButton} ${styles.saved}`}
          onClick={handleRemove}
          disabled={loading}
          title="Remove from archive"
          aria-label="Remove from archive"
        >
          <Bookmark size={19} strokeWidth={2} fill="currentColor" />
        </button>
      ) : viewOnly && isSaved ? (
        <div
          className={`${styles.saveButton} ${styles.saved}`}
          style={{ cursor: "default" }}
          title="Saved"
          aria-label="Saved"
        >
          <Bookmark size={19} strokeWidth={2} fill="currentColor" />
        </div>
      ) : (
        <>
          <button
            type="button"
            data-action="save"
            className={`${styles.saveButton} ${isSaved ? styles.saved : ""}`}
            onClick={() => setDropdownVisible(!dropdownVisible)}
            disabled={loading}
            title={isSaved ? "Saved" : "Save to archive"}
            aria-label={isSaved ? "Saved" : "Save to archive"}
            aria-haspopup="menu"
            aria-expanded={dropdownVisible}
          >
            <Bookmark size={19} strokeWidth={2} fill={isSaved ? "currentColor" : "none"} />
          </button>

          {dropdownVisible && (
            <ul className={styles.dropdown}>
              {archives.map((archive) => (
                <li key={archive.id} className={styles.dropdownItem}>
                  <button type="button" onClick={() => handleArchiveSelect(archive.id)}>
                    {archive.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

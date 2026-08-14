"use client";
import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";
import styles from "./ArchiveToggleButton.module.scss";

export default function ArchiveToggleButton({
  article,
  archiveId: propArchiveId,
  viewOnly = false,
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [archives, setArchives] = useState([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState(
    propArchiveId || null
  );
  // A propArchiveId means the parent already knows this card belongs to
  // that specific archive (e.g. an archive's own detail page renders its
  // own SavedArticle rows) — that's not merely a hint to skip the "is this
  // saved?" check below, it *is* the answer, so isSaved should start true
  // rather than false-until-corrected. Without this, "Remove from archive"
  // never appeared on an archive's own detail page, since nothing else
  // ever set isSaved to true there.
  const [isSaved, setIsSaved] = useState(Boolean(propArchiveId));
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    // No point calling an authenticated endpoint for a signed-out visitor —
    // it would just 401. The save button itself redirects them to /login
    // before this list is ever needed (see handleSaveClick below).
    if (!session) return;

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
  }, [session]);

  useEffect(() => {
    // propArchiveId means the parent already told us exactly which archive
    // this card belongs to (a specific archive's own page) — no need to
    // check. viewOnly alone does NOT mean "skip the check": it's the normal
    // mode for ordinary feed cards (category/news/for-you/following/liked
    // pages all render with viewOnly=true and no archiveId), where this
    // check is the only way the bookmark icon ever reflects an article the
    // user already saved in a previous session.
    if (isSaved || !article.url || propArchiveId || !session) return;

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
  }, [article.url, propArchiveId, isSaved, session]);

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

  const handleSaveClick = () => {
    if (!session) {
      toast.info("Sign in to save articles.");
      router.push("/login");
      return;
    }
    setDropdownVisible(!dropdownVisible);
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
      ) : viewOnly && isSaved && propArchiveId ? (
        // Paired with the branch above: a read-only view of one *specific*
        // known archive's contents (propArchiveId set) shows a static
        // indicator instead of a remove button. Ordinary feed cards
        // (viewOnly=true, no propArchiveId — category/news/for-you/
        // following/liked pages) fall through to the interactive button
        // below instead, so an already-saved article can still be added to
        // another archive from a feed, not frozen the moment it's saved.
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
            onClick={handleSaveClick}
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

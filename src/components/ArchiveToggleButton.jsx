"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function ArchiveToggleButton({
  article,
  archiveId: propArchiveId,
  viewOnly = false,
}) {
  const [archives, setArchives] = useState([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState(
    propArchiveId || null
  );
  const [isSaved, setIsSaved] = useState(!!article.id); // Assume saved if article has an ID
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const pathname = usePathname();

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
  if (isSaved || !article.url || propArchiveId) return;

  const checkIfSaved = async () => {
    try {
      const res = await fetch(`/api/articles/check?url=${encodeURIComponent(article.url)}`);
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
        alert(data.message || "Failed to save article.");
      }
    } catch (err) {
      console.error("Error saving article:", err);
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
        alert(data.message || "Failed to remove article.");
      }
    } catch (err) {
      console.error("Error removing article:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {isSaved && propArchiveId &&!viewOnly ? (
        <button onClick={handleRemove} disabled={loading}>
          {loading ? "Removing..." : "Delete"}
        </button>
      ) : viewOnly && isSaved ? (
        <button disabled style={{ border: 'none', color: "red", cursor: "default", background: "transparent" }}>
          ❤️
        </button>
      ) : (
        <>
          <button
            onClick={() => setDropdownVisible(!dropdownVisible)}
            disabled={loading}
          >
            {loading ? "Saving..." : isSaved ? "Saved" : "Save Article"}
          </button>

          {dropdownVisible && (
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 10,
                background: "#fff",
                border: "1px solid #ccc",
                padding: "0.5rem",
                listStyle: "none",
              }}
            >
              {archives.map((archive) => (
                <li key={archive.id}>
                  <button
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      padding: "0.2rem 0",
                    }}
                    onClick={() => handleArchiveSelect(archive.id)}
                  >
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

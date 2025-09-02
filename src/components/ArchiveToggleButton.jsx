"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import styled from "styled-components";

const SaveButton = styled.div`
  // background-color: var(--primary-blue);
  color: #fff;
  // padding: 12px 20px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  align-self: flex-start;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;

  &:hover {
    background-color: #173b9e;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SavedOrUnsavedButton = styled.img`
  height: 30px;
  width: 30px;
`;

export default function ArchiveToggleButton({
  article,
  archiveId: propArchiveId,
  viewOnly = false,
}) {
  const [archives, setArchives] = useState([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState(
    propArchiveId || null
  );
  const [isSaved, setIsSaved] = useState(false);
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
      {isSaved && propArchiveId && !viewOnly ? (
        <SaveButton onClick={handleRemove} disabled={loading}>
          {loading ? "Removing..." : "Remove"}
        </SaveButton>
      ) : viewOnly && isSaved ? (
        <div
          style={{
            border: "none",
            cursor: "default",
            background: "transparent",
          }}
        >
          <SavedOrUnsavedButton src="/images/save-button-saved.svg" />
        </div>
      ) : (
        <>
          <SaveButton
            onClick={() => setDropdownVisible(!dropdownVisible)}
            disabled={loading}
          >
            {isSaved ? (
              <SavedOrUnsavedButton src="/images/save-button-saved.svg" />
            ) : (
              <SavedOrUnsavedButton src="/images/save-button-unsaved.svg" />
            )}
          </SaveButton>

          {dropdownVisible && (
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 10,
                userSelect: "none",
                background: "#fff",
                border: "1px solid #ccc",
                padding: "0.5rem",
                listStyle: "none",
                borderBottom: "1px solid #ccc",
              }}
            >
              {archives.map((archive) => (
                <li key={archive.id} style={{ borderBottom: "1px solid #ccc" }}>
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

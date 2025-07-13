"use client";
import styled from "styled-components";
import { useState, useEffect } from "react";

export default function ArchiveToggleButton({ article, archiveId }) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSaved = async () => {
      try {
        const res = await fetch(
          `/api/archives/${archiveId}/articles/check?url=${encodeURIComponent(
            article.url
          )}`
        );
        const data = await res.json();
        console.log("Check saved response:", data);
        if (res.ok) setIsSaved(data.saved);
      } catch (err) {
        console.error("Error checking saved article:", err);
      }
    };

    if (article.url && archiveId) {
      checkSaved();
    }
  }, [archiveId, article.url]);

  const handleClick = async () => {
    if (!archiveId) return alert("Please pick an archive first.");

    setLoading(true);

    try {
      const res = await fetch(`/api/archives/${archiveId}/articles`, {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(article),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSaved(!isSaved);
      } else {
        console.error("Error updating archive:", data.message);
      }
    } catch (err) {
      console.error("Archive toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading
        ? "Processing..."
        : isSaved === null
        ? "Checking..."
        : isSaved
        ? "Remove from Archive"
        : "Save to Archive"}
    </button>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import { Share2, Link2, Check, Mail, MessageCircle } from "lucide-react";
import styles from "./ShareButton.module.scss";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export default function ShareButton({ article }) {
  const [showFallback, setShowFallback] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const wrapperRef = useRef(null);

  // Shares the MorningFeeds article page rather than the original publisher's
  // URL directly — every share becomes a branded touchpoint (with its own
  // OG/Twitter preview card) instead of an invisible pass-through, and most
  // articles have full content available there anyway. The "View original"
  // link on that page still gets readers to the source in one more click.
  const shareUrl = `${BASE_URL}/article/${article.id}`;

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowFallback(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: `Check out this article from ${article.sourceName}:`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      setShowFallback(!showFallback);
      setCopySuccess(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setCopySuccess(true);
        setTimeout(() => setShowFallback(false), 800);
      },
      (err) => {
        console.error("Failed to copy text: ", err);
      }
    );
  };

  const encodedText = encodeURIComponent(`Check out this article I found: ${shareUrl}`);
  const emailSubject = encodeURIComponent(`Interesting Article: ${article.title}`);

  return (
    <div className={styles.shareWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.button}
        onClick={handleShare}
        title="Share article"
        aria-label="Share article"
        aria-haspopup="menu"
        aria-expanded={showFallback}
      >
        <Share2 size={18} strokeWidth={2} />
      </button>

      {showFallback && (
        <div className={styles.fallbackMenu}>
          <button className={styles.fallbackOption} onClick={handleCopyLink}>
            {copySuccess ? <Check size={16} /> : <Link2 size={16} />}
            {copySuccess ? "Copied!" : "Copy Link"}
          </button>
          <a
            className={styles.fallbackOption}
            href={`mailto:?subject=${emailSubject}&body=${encodedText}`}
          >
            <Mail size={16} />
            Share via Email
          </a>
          <a className={styles.fallbackOption} href={`sms:?&body=${encodedText}`}>
            <MessageCircle size={16} />
            Share via Text
          </a>
        </div>
      )}
    </div>
  );
}

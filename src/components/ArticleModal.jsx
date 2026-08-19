"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ArticleReader from "./ArticleReader";
import styles from "./ArticleModal.module.scss";

// Matches the CSS closing animation's own duration — router.back() only
// fires once that's had time to actually play, so the panel visibly slides
// away before the modal slot unmounts, instead of vanishing instantly and
// letting the animation get cut off mid-flight.
const EXIT_ANIMATION_MS = 250;

// Renders inside the intercepted @modal/(.)article/[id] route (see that
// page's own comment for the full mechanism) — receives the same plain
// data resolveArticleForPage already resolves server-side, and renders
// ArticleReader itself directly rather than receiving it as an opaque
// children prop, so this component can wire its own animated close handler
// into ArticleReader's existing onClose (the same prop ThreePaneLayout's
// inline reader already uses).
export default function ArticleModal({ article, sanitizedContent, relatedCoverage, readingTime }) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => router.back(), EXIT_ANIMATION_MS);
  };

  return (
    <div className={`${styles.modal} ${isClosing ? styles.closing : ""}`}>
      <ArticleReader
        article={article}
        sanitizedContent={sanitizedContent}
        relatedCoverage={relatedCoverage}
        readingTime={readingTime}
        onClose={handleClose}
      />
    </div>
  );
}

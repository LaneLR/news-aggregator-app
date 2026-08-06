"use client";

// Fire-and-forget click tracking for outbound article links. Uses
// sendBeacon so it doesn't delay/block the navigation the user just
// triggered (the tab is opening in the background via target="_blank").
// Accepts the full article so the server can log sourceName/category
// alongside the click — that per-user history is what powers "For You".
export function trackArticleClick(article) {
  const url = article?.url;
  if (!url || typeof window === "undefined") return;

  try {
    const payload = JSON.stringify({
      articleUrl: url,
      sourceName: article.sourceName || null,
      category: article.category || null,
    });
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/articles/click", blob);
    } else {
      fetch("/api/articles/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Best-effort only — never block navigation over a tracking failure.
  }
}

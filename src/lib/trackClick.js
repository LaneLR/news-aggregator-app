"use client";

// Fire-and-forget click tracking for outbound article links. Uses
// sendBeacon so it doesn't delay/block the navigation the user just
// triggered (the tab is opening in the background via target="_blank").
export function trackArticleClick(url) {
  if (!url || typeof window === "undefined") return;

  try {
    const payload = JSON.stringify({ articleUrl: url });
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

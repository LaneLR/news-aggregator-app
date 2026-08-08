"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

// Shared by every feed surface (category pages, For You, Search) so the
// bulk-read logic and optimistic update only live in one place.
export function useMarkAllRead(articles, setArticles) {
  const { data: session } = useSession();
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const hasUnread = !!session?.user?.id && articles.some((a) => !a.isRead);

  const handleMarkAllRead = async () => {
    if (!session?.user?.id || markingAllRead) return;
    const unreadUrls = articles.filter((a) => !a.isRead).map((a) => a.url);
    if (unreadUrls.length === 0) return;

    setMarkingAllRead(true);
    setArticles((prev) => prev.map((a) => ({ ...a, isRead: true })));
    try {
      await fetch("/api/articles/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: unreadUrls }),
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  return { hasUnread, markingAllRead, handleMarkAllRead };
}

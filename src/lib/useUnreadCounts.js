"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const EMPTY = { categories: {}, feeds: 0, following: 0 };

// Refetches on window focus (same convention as CategoryPage's "new
// articles available" check) so badges stay reasonably current without
// polling — good enough for a glance-at-the-nav signal, not a live count.
export function useUnreadCounts() {
  const { data: session } = useSession();
  const [counts, setCounts] = useState(EMPTY);
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) {
      setCounts(EMPTY);
      return;
    }

    let cancelled = false;
    const load = () => {
      fetch("/api/users/unread-counts")
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Request failed"))))
        .then((data) => {
          if (!cancelled) setCounts(data);
        })
        .catch(() => {});
    };

    load();
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, [userId]);

  return counts;
}

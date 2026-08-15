"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "./ToastProvider";

const FollowedSourcesContext = createContext({
  isFollowing: () => false,
  toggleFollow: () => {},
});

export function useFollowedSources() {
  return useContext(FollowedSourcesContext);
}

// Mounted once in the root layout so every card's FollowSourceButton shares
// one fetch and one in-memory Set, rather than each card independently
// checking membership — a single category page can render dozens of cards,
// often repeating the same source.
export default function FollowedSourcesProvider({ children }) {
  const { data: session } = useSession();
  const toast = useToast();
  const [followedSources, setFollowedSources] = useState(new Set());
  const userId = session?.user?.id;
  // Tracks the latest in-flight toggle per source so a slow response can't
  // clobber a newer optimistic update — e.g. two rapid clicks on the same
  // source, where the first request's response arrives after the second
  // click already fired (Neon's connection latency is variable enough for
  // this to happen even a second or so apart).
  const requestTokens = useRef({});

  useEffect(() => {
    if (!userId) {
      setFollowedSources(new Set());
      return;
    }

    let cancelled = false;
    fetch("/api/users/followed-sources")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.followedSources) {
          setFollowedSources(new Set(data.followedSources));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isFollowing = useCallback(
    (sourceName) => followedSources.has(sourceName),
    [followedSources]
  );

  const toggleFollow = useCallback(
    (sourceName) => {
      const wasFollowing = followedSources.has(sourceName);
      setFollowedSources((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.delete(sourceName);
        else next.add(sourceName);
        return next;
      });

      const token = (requestTokens.current[sourceName] || 0) + 1;
      requestTokens.current[sourceName] = token;
      const isStale = () => requestTokens.current[sourceName] !== token;

      fetch("/api/users/followed-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceName }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Request failed"))))
        .then((data) => {
          if (isStale()) return;
          if (data?.followedSources) setFollowedSources(new Set(data.followedSources));
        })
        .catch(() => {
          if (isStale()) return;
          setFollowedSources((prev) => {
            const next = new Set(prev);
            if (wasFollowing) next.add(sourceName);
            else next.delete(sourceName);
            return next;
          });
          toast.error("Couldn't update follow status. Please try again.");
        });
    },
    [followedSources, toast]
  );

  return (
    <FollowedSourcesContext.Provider value={{ isFollowing, toggleFollow }}>
      {children}
    </FollowedSourcesContext.Provider>
  );
}

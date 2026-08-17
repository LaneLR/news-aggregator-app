"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarDays } from "lucide-react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import ThreePaneLayout from "./ThreePaneLayout";
import Button from "./Button";
import MarkAllReadButton from "./MarkAllReadButton";
import ViewDensityToggle from "./ViewDensityToggle";
import CardSkeleton from "./CardSkeleton";
import { useArticleShortcuts } from "@/lib/useArticleShortcuts";
import { useMarkAllRead } from "@/lib/useMarkAllRead";
import { useLayoutPrefs } from "@/lib/useLayoutPrefs";
import styles from "./TodayPage.module.scss";

const GATED_DENSITIES = new Set(["list", "magazine"]);

// Local midnight, computed once per page load in the visitor's own browser —
// the server has no reliable way to know a visitor's timezone on its own,
// and every publishedAt is stored in UTC (see src/lib/todayArticles.js).
// Computed once (not re-derived on every render) so "today" stays the same
// boundary for the whole session even if the tab's left open past midnight —
// matches how none of the other feeds live-update their own boundaries either.
function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// A relative path, not NEXT_PUBLIC_BASE_URL — this runs in the browser
// (the component is "use client"), where a relative fetch already resolves
// against the current origin on its own.
async function fetchTodayArticles(startOfDay, sort, page = 1) {
  const res = await fetch(
    `/api/articles/today?startOfDay=${encodeURIComponent(startOfDay)}&sort=${sort}&page=${page}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) throw new Error("Failed to fetch today's news");

  return res.json();
}

export default function TodayPage() {
  const { data: session } = useSession();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  const { viewDensity, setViewDensity } = useLayoutPrefs();
  const effectiveDensity = GATED_DENSITIES.has(viewDensity) && !isSubscribed ? "card" : viewDensity;
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [startOfDay] = useState(startOfTodayISO);
  const [articles, setArticles] = useState([]);
  const [defaultArchiveId, setDefaultArchiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTodayArticles(startOfDay, sort, 1);
      setArticles(data.articles);
      setPage(1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreArticles = async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchTodayArticles(startOfDay, sort, nextPage);
      setArticles((prev) => [...prev, ...data.articles]);
      setPage(nextPage);
      setTotalPages(data.totalPages || totalPages);
    } catch (err) {
      console.error("Failed to load more of today's articles:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const didMount = useRef(false);
  useEffect(() => {
    // Skips a duplicate fetch on the very first render — the effect below
    // (keyed on [sort]) already fires once on mount, so this only needs to
    // react to a later sort *change*.
    if (!didMount.current) {
      didMount.current = true;
      loadArticles();
      return;
    }
    loadArticles();
    // loadArticles is intentionally omitted below — it's a plain function
    // re-created every render, so including it would re-fetch on every
    // render instead of only on a real sort change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const { hasUnread, markingAllRead, handleMarkAllRead } = useMarkAllRead(articles, setArticles);

  useEffect(() => {
    const fetchDefaultArchive = async () => {
      try {
        const res = await fetch("/api/archives/default");
        const data = await res.json();
        if (res.ok) {
          setDefaultArchiveId(data.archiveId);
        } else {
          console.warn("Could not get default archive:", data.error);
        }
      } catch (err) {
        console.error("Archive fetch error:", err);
      }
    };
    fetchDefaultArchive();
  }, []);

  const { selectedIndex, cardRefs } = useArticleShortcuts(
    articles,
    effectiveDensity === "reader" ? (article) => setSelectedArticleId(article.id) : undefined
  );

  const skeletonDensity = effectiveDensity === "reader" ? "list" : effectiveDensity;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageHeading} headline`}>
          <CalendarDays size={30} />
          Today&apos;s News
        </h1>
        <p className={styles.pageSubtitle}>
          Everything published since midnight, across every category.
        </p>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.sortToggle}>
          <button
            type="button"
            className={`${styles.sortOption} ${sort === "newest" ? styles.active : ""}`}
            onClick={() => setSort("newest")}
          >
            Newest
          </button>
          <button
            type="button"
            className={`${styles.sortOption} ${sort === "oldest" ? styles.active : ""}`}
            onClick={() => setSort("oldest")}
          >
            Oldest
          </button>
          <button
            type="button"
            className={`${styles.sortOption} ${sort === "trending" ? styles.active : ""}`}
            onClick={() => setSort("trending")}
          >
            Trending
          </button>
        </div>
        <ViewDensityToggle density={viewDensity} onChange={setViewDensity} isSubscribed={isSubscribed} />
        {hasUnread && (
          <MarkAllReadButton onClick={handleMarkAllRead} disabled={markingAllRead} />
        )}
      </div>

      {isLoading ? (
        <NewsGridWrapper density={skeletonDensity}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} density={skeletonDensity} />
          ))}
        </NewsGridWrapper>
      ) : error && articles.length === 0 ? (
        <p className={styles.caughtUpText}>Error: {error}</p>
      ) : articles.length > 0 ? (
        <>
          {effectiveDensity === "reader" ? (
            <ThreePaneLayout
              articles={articles}
              archiveId={defaultArchiveId}
              viewOnly={true}
              selectedIndex={selectedIndex}
              cardRefs={cardRefs}
              selectedArticleId={selectedArticleId}
              onSelectArticle={(article) => setSelectedArticleId(article?.id ?? null)}
            />
          ) : (
            <NewsGridWrapper density={effectiveDensity}>
              {articles.map((article, i) => (
                <NewsCardThree
                  key={article.url}
                  density={effectiveDensity}
                  article={article}
                  archiveId={defaultArchiveId}
                  viewOnly={true}
                  isKeyboardFocused={i === selectedIndex}
                  innerRef={(el) => (cardRefs.current[i] = el)}
                  index={i}
                />
              ))}
            </NewsGridWrapper>
          )}

          <div className={styles.loadMoreRow}>
            {page < totalPages ? (
              <Button
                bgColor={"var(--theme-layout-background)"}
                clr={"var(--theme-dark-blue)"}
                onClick={loadMoreArticles}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading…" : "Load More"}
              </Button>
            ) : (
              <p className={styles.caughtUpText}>You&apos;re all caught up.</p>
            )}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <CalendarDays size={32} strokeWidth={1.5} />
          <p>No articles published today yet.</p>
          <p className={styles.emptyStateHint}>Check back soon — new stories come in throughout the day.</p>
        </div>
      )}
    </div>
  );
}

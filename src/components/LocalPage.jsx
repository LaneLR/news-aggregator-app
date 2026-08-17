"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { MapPinned } from "lucide-react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import ThreePaneLayout from "./ThreePaneLayout";
import Button from "./Button";
import MarkAllReadButton from "./MarkAllReadButton";
import ViewDensityToggle from "./ViewDensityToggle";
import CardSkeleton from "./CardSkeleton";
import LocationPicker from "./LocationPicker";
import { useUserLocation } from "@/lib/useUserLocation";
import { useArticleShortcuts } from "@/lib/useArticleShortcuts";
import { useMarkAllRead } from "@/lib/useMarkAllRead";
import { useLayoutPrefs } from "@/lib/useLayoutPrefs";
import styles from "./TodayPage.module.scss";

const GATED_DENSITIES = new Set(["list", "magazine"]);

// A relative path, not NEXT_PUBLIC_BASE_URL — this runs in the browser
// (the component is "use client"), where a relative fetch already resolves
// against the current origin on its own. Mirrors TodayPage.jsx's
// fetchTodayArticles.
async function fetchLocalArticles(lat, lon, sort, page = 1) {
  const res = await fetch(
    `/api/articles/local?lat=${lat}&lon=${lon}&sort=${sort}&page=${page}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) throw new Error("Failed to fetch local news");

  return res.json();
}

// Reuses TodayPage's stylesheet — same page-header/filter-bar/grid shell,
// just a different data source and an extra "no location yet" state that
// Today's News doesn't need (see the opt-in prompt below).
export default function LocalPage() {
  const { data: session } = useSession();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  const { viewDensity, setViewDensity } = useLayoutPrefs();
  const effectiveDensity = GATED_DENSITIES.has(viewDensity) && !isSubscribed ? "card" : viewDensity;
  const { location, hydrated } = useUserLocation();
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [articles, setArticles] = useState([]);
  const [hubCity, setHubCity] = useState(null);
  const [defaultArchiveId, setDefaultArchiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadArticles = async () => {
    if (!location) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLocalArticles(location.lat, location.lon, sort, 1);
      setArticles(data.articles);
      setHubCity(data.hubCity || null);
      setPage(1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreArticles = async () => {
    if (!location || isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchLocalArticles(location.lat, location.lon, sort, nextPage);
      setArticles((prev) => [...prev, ...data.articles]);
      setPage(nextPage);
      setTotalPages(data.totalPages || totalPages);
    } catch (err) {
      console.error("Failed to load more local news:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const didMount = useRef(false);
  useEffect(() => {
    if (!hydrated || !location) return;
    // Skips a duplicate fetch on the very first render — the effect below
    // (keyed on [sort, location]) already fires once location is ready, so
    // this only needs to react to a later sort/location *change*.
    if (!didMount.current) {
      didMount.current = true;
      loadArticles();
      return;
    }
    loadArticles();
    // loadArticles is intentionally omitted below — it's a plain function
    // re-created every render, so including it would re-fetch on every
    // render instead of only on a real sort/location change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, location, hydrated]);

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
  const subtitle = hubCity
    ? `Local news for ${hubCity.name}, ${hubCity.state}.`
    : "Everything from your nearest covered city, across every category.";

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageHeading} headline`}>
          <MapPinned size={30} />
          Local News
        </h1>
        <p className={styles.pageSubtitle}>{subtitle}</p>
      </div>

      {!hydrated ? null : !location ? (
        <div className={styles.emptyState}>
          <MapPinned size={32} strokeWidth={1.5} />
          <p>See local news for your area.</p>
          <p className={styles.emptyStateHint}>
            Grant your location, or search for a city or zip code, to see coverage from your
            nearest local newsroom.
          </p>
          <LocationPicker />
        </div>
      ) : (
        <>
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
              <MapPinned size={32} strokeWidth={1.5} />
              <p>No local articles yet.</p>
              <p className={styles.emptyStateHint}>Check back soon — new stories come in throughout the day.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

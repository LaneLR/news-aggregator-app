"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Newspaper, RefreshCw, ListChecks, X, Sparkles, Lock } from "lucide-react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import ThreePaneLayout from "./ThreePaneLayout";
import Button from "./Button";
import MarkAllReadButton from "./MarkAllReadButton";
import ViewDensityToggle from "./ViewDensityToggle";
import CardSkeleton from "./CardSkeleton";
import PullToRefreshIndicator from "./PullToRefreshIndicator";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import MarketTicker from "./MarketTicker";
import MarketChart from "./MarketChart";
import SectorPerformance from "./SectorPerformance";
import MostCovered from "./MostCovered";
import Watchlist from "./Watchlist";
import BulkActionBar from "./BulkActionBar";
import SignInGate from "./SignInGate";
import { useArticleShortcuts } from "@/lib/useArticleShortcuts";
import { useMarkAllRead } from "@/lib/useMarkAllRead";
import { useLayoutPrefs } from "@/lib/useLayoutPrefs";
import styles from "./CategoryPage.module.scss";

const GATED_DENSITIES = new Set(["list", "magazine"]);
// Trending/Most Liked reflect this app's own click/like activity rather
// than a plain chronological feed — signed-out visitors get Latest only
// (see ANONYMOUS_ARTICLE_LIMIT server-side); picking either of these while
// signed out shows a sign-in prompt instead of fetching.
const GATED_SORTS = new Set(["trending", "liked"]);

async function fetchCategoryArticles(category, sort, page = 1) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/articles/${category}?sort=${sort}&page=${page}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) throw new Error("Failed to fetch news for category");

  return res.json();
}

export default function CategoryPage({
  category,
  archiveId,
  initialArticles,
  initialTotalPages,
}) {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  const { viewDensity, setViewDensity } = useLayoutPrefs();
  const effectiveDensity = GATED_DENSITIES.has(viewDensity) && !isSubscribed ? "card" : viewDensity;
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const hasInitialArticles = Array.isArray(initialArticles);
  const [articles, setArticles] = useState(initialArticles ?? []);
  const [defaultArchiveId, setDefaultArchiveId] = useState(null);
  const [latestTimestamp, setLatestTimestamp] = useState(
    hasInitialArticles && initialArticles[0]
      ? new Date(initialArticles[0].publishedAt || initialArticles[0].updatedAt)
      : null
  );
  const [newAvailable, setNewAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(!hasInitialArticles);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    hasInitialArticles ? initialTotalPages || 1 : 1
  );
  // Skips exactly one upcoming mount-effect fetch when SSR already provided
  // the initial "latest" page — any later sort change still fetches normally.
  const skipNextFetch = useRef(hasInitialArticles);

  const categoryNameForDisplay =
    category.charAt(0).toUpperCase() + category.slice(1);
  const sortRequiresLogin = !isLoggedIn && GATED_SORTS.has(sort);

  const loadArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCategoryArticles(category.toLowerCase(), sort, 1);
      setArticles(data.articles);
      setPage(1);
      setTotalPages(data.totalPages || 1);
      if (data.articles.length > 0) {
        const newest = new Date(
          data.articles[0].publishedAt || data.articles[0].updatedAt
        );
        setLatestTimestamp(newest);
      }
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
      const data = await fetchCategoryArticles(category.toLowerCase(), sort, nextPage);
      setArticles((prev) => [...prev, ...data.articles]);
      setPage(nextPage);
      setTotalPages(data.totalPages || totalPages);
    } catch (err) {
      console.error("Failed to load more articles:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!category) return;
    // A gated sort with no session renders SignInGate instead of the grid —
    // nothing to fetch, and fetching would just surface as an error.
    if (sortRequiresLogin) return;
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
    } else {
      loadArticles();
    }
    // loadArticles is intentionally omitted below — it's a plain function
    // re-created every render, so including it would re-fetch on every
    // render instead of only on a real category/sort change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, sortRequiresLogin]);

  // Read via a ref rather than closing over latestTimestamp directly: the
  // focus listener below is only re-registered when category/sort change,
  // so a closure over the state value would go stale the moment
  // loadArticles() (or refreshArticles(), e.g. from pull-to-refresh) updates
  // latestTimestamp without category/sort also changing — the "new articles
  // available" banner would then compare against an outdated baseline and
  // could re-fire for articles the user has already seen.
  const latestTimestampRef = useRef(latestTimestamp);
  useEffect(() => {
    latestTimestampRef.current = latestTimestamp;
  }, [latestTimestamp]);

  useEffect(() => {
    const handleFocus = async () => {
      if (!category || sortRequiresLogin) return;
      try {
        const latest = await fetchCategoryArticles(category.toLowerCase(), sort, 1);
        const latestArticle = latest.articles[0];
        if (latestArticle) {
          const latestDate = new Date(
            latestArticle.publishedAt || latestArticle.updatedAt
          );
          if (latestTimestampRef.current && latestDate > latestTimestampRef.current) {
            setNewAvailable(true);
          }
        }
      } catch (err) {
        console.error("Failed to check for new articles:", err);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [category, sort, sortRequiresLogin]);

  const refreshArticles = async () => {
    setNewAvailable(false);
    await loadArticles();
  };

  const { hasUnread, markingAllRead, handleMarkAllRead } = useMarkAllRead(articles, setArticles);
  const { pullDistance, isRefreshing, pullHandlers } = usePullToRefresh(refreshArticles);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedUrls(new Set());
  };

  const toggleSelectUrl = (url) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const selectedArticles = articles.filter((a) => selectedUrls.has(a.url));

  const handleBulkMarkRead = async () => {
    if (bulkBusy || selectedArticles.length === 0) return;
    setBulkBusy(true);
    const urls = selectedArticles.map((a) => a.url);
    setArticles((prev) => prev.map((a) => (urls.includes(a.url) ? { ...a, isRead: true } : a)));
    try {
      await fetch("/api/articles/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
    } catch (err) {
      console.error("Bulk mark-read failed:", err);
    } finally {
      setBulkBusy(false);
      setSelectedUrls(new Set());
    }
  };

  const handleBulkSave = async () => {
    if (bulkBusy || selectedArticles.length === 0 || !defaultArchiveId) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        selectedArticles.map((article) =>
          fetch(`/api/archives/${defaultArchiveId}/articles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: article.title,
              url: article.url,
              urlToImage: article.urlToImage,
              sourceName: article.sourceName,
            }),
          })
        )
      );
    } catch (err) {
      console.error("Bulk save failed:", err);
    } finally {
      setBulkBusy(false);
      setSelectedUrls(new Set());
    }
  };

  const handleBulkLike = async () => {
    if (bulkBusy || selectedArticles.length === 0) return;
    setBulkBusy(true);
    const urls = new Set(selectedArticles.filter((a) => !a.isLikedByUser).map((a) => a.url));
    setArticles((prev) =>
      prev.map((a) => (urls.has(a.url) ? { ...a, isLikedByUser: true, likeCount: (a.likeCount || 0) + 1 } : a))
    );
    try {
      await Promise.all(
        [...urls].map((articleUrl) =>
          fetch("/api/articles/like", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ articleUrl }),
          })
        )
      );
    } catch (err) {
      console.error("Bulk like failed:", err);
    } finally {
      setBulkBusy(false);
      setSelectedUrls(new Set());
    }
  };

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
    <div {...pullHandlers}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      <div className={styles.pageHeader}>
        <h1 className={`${styles.searchBarHeader} headline`}>
          <Newspaper size={30} />
          {categoryNameForDisplay} Headlines
        </h1>
        {newAvailable && (
          <div className={styles.refreshBanner}>
            <RefreshCw size={18} />
            <Button
              bgColor={"var(--theme-primary)"}
              clr={"var(--theme-primary-contrast)"}
              onClick={refreshArticles}
            >
              New articles available
            </Button>
          </div>
        )}
      </div>

      {!isSubscribed && categoryNameForDisplay !== "Podcast" && (
        <p className={styles.upsellNudge}>
          <Sparkles size={14} strokeWidth={2} />
          You&apos;re seeing a curated free selection of {categoryNameForDisplay} sources.{" "}
          <Link href="/pricing">Subscribe</Link> to unlock every source in this category.
        </p>
      )}

      {category === "Market" && (
        <>
          <MarketTicker />
          <MarketChart />
          <SectorPerformance />
          <MostCovered />
          <Watchlist />
        </>
      )}

      <div className={styles.filterBar}>
        <div className={styles.sortToggle}>
          <button
            type="button"
            className={`${styles.sortOption} ${sort === "latest" ? styles.active : ""}`}
            onClick={() => setSort("latest")}
          >
            Latest
          </button>
          <button
            type="button"
            className={`${styles.sortOption} ${sort === "trending" ? styles.active : ""}`}
            onClick={() => setSort("trending")}
          >
            {!isLoggedIn && <Lock size={11} strokeWidth={2.5} />}
            Trending
          </button>
          <button
            type="button"
            className={`${styles.sortOption} ${sort === "liked" ? styles.active : ""}`}
            onClick={() => setSort("liked")}
          >
            {!isLoggedIn && <Lock size={11} strokeWidth={2.5} />}
            Most Liked
          </button>
        </div>
        <ViewDensityToggle density={viewDensity} onChange={setViewDensity} isSubscribed={isSubscribed} />
        {hasUnread && (
          <MarkAllReadButton onClick={handleMarkAllRead} disabled={markingAllRead} />
        )}
        {session?.user?.id && effectiveDensity !== "reader" && (
          <button
            type="button"
            className={`${styles.selectModeButton} ${selectMode ? styles.active : ""}`}
            onClick={toggleSelectMode}
          >
            {selectMode ? <X size={15} strokeWidth={2.25} /> : <ListChecks size={15} strokeWidth={2.25} />}
            {selectMode ? "Cancel" : "Select"}
          </button>
        )}
      </div>

      {sortRequiresLogin ? (
        <SignInGate
          message={`Sign in to see ${
            sort === "trending" ? "Trending" : "Most Liked"
          } ${categoryNameForDisplay} articles.`}
        />
      ) : isLoading ? (
        <NewsGridWrapper density={skeletonDensity}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} density={skeletonDensity} />
          ))}
        </NewsGridWrapper>
      ) : error ? (
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
                  selectionMode={selectMode}
                  isSelected={selectedUrls.has(article.url)}
                  onToggleSelect={() => toggleSelectUrl(article.url)}
                />
              ))}
            </NewsGridWrapper>
          )}

          <div className={styles.loadMoreRow}>
            {page < totalPages ? (
              isLoggedIn ? (
                <Button
                  bgColor={"var(--theme-layout-background)"}
                  clr={"var(--theme-dark-blue)"}
                  onClick={loadMoreArticles}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading…" : "Load More"}
                </Button>
              ) : (
                <SignInGate message="Sign in to load more articles." compact />
              )
            ) : (
              <p className={styles.caughtUpText}>You&apos;re all caught up.</p>
            )}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <Newspaper size={32} strokeWidth={1.5} />
          <p>No articles found for {categoryNameForDisplay}.</p>
          <p className={styles.emptyStateHint}>Check back soon — new stories come in throughout the day.</p>
        </div>
      )}

      {selectMode && (
        <BulkActionBar
          count={selectedUrls.size}
          onMarkRead={handleBulkMarkRead}
          onSave={handleBulkSave}
          onLike={handleBulkLike}
          onCancel={toggleSelectMode}
          busy={bulkBusy}
        />
      )}
    </div>
  );
}

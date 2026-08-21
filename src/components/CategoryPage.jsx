"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Newspaper, RefreshCw, ListChecks, X, Sparkles, Lock } from "lucide-react";
import NewsGridWrapper from "./NewsGridWrapper";
import NewsCardThree from "./NewsCardThree";
import PremiumTeaserCard from "./PremiumTeaserCard";
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
import { useToast } from "./ToastProvider";
import { useArticleShortcuts } from "@/lib/useArticleShortcuts";
import { useMarkAllRead } from "@/lib/useMarkAllRead";
import { useLayoutPrefs } from "@/lib/useLayoutPrefs";
import styles from "./CategoryPage.module.scss";

const GATED_DENSITIES = new Set(["list"]);
// Trending/Most Liked reflect this app's own click/like activity rather
// than a plain chronological feed — signed-out visitors get Latest only
// (see ANONYMOUS_ARTICLE_LIMIT server-side); picking either of these while
// signed out shows a sign-in prompt instead of fetching.
const GATED_SORTS = new Set(["trending", "liked"]);

// A relative path, not NEXT_PUBLIC_BASE_URL — this runs in the browser
// (the component is "use client"), where a relative fetch already resolves
// against the current origin on its own. NEXT_PUBLIC_BASE_URL is inlined at
// build time, so if it were ever missing or wrong for a given deployment,
// every sort switch/load-more/refresh here would silently try to hit the
// build machine's own placeholder origin and fail with "Failed to fetch"
// for every visitor, regardless of environment.
async function fetchCategoryArticles(category, sort, page = 1) {
  const res = await fetch(
    `/api/articles/${category}?sort=${sort}&page=${page}`,
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
  const toast = useToast();
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
      // A failed refresh shouldn't blow away articles already on screen —
      // e.g. switching from Trending back to Latest after a transient
      // network hiccup used to replace a perfectly good, already-loaded
      // list with a bare "Error: Failed to fetch" instead of just leaving
      // it alone. Only the very first load, with nothing cached yet to
      // fall back on, still needs the full error state.
      if (articles.length === 0) {
        setError(err.message);
      } else {
        toast.error("Couldn't refresh articles. Showing what's already loaded.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreArticles = async () => {
    // The old Button that called this only ever rendered for a signed-in
    // user (SignInGate took its place otherwise) — the sentinel below is
    // unconditionally observed regardless of auth state, so this guard has
    // to live here now instead of being implicit in what got rendered.
    if (!isLoggedIn || isLoadingMore || page >= totalPages) return;
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

  // Always the current render's closure (fresh page/totalPages/isLoadingMore
  // every time, no dependency array) — the IntersectionObserver effect below
  // is deliberately only set up once (empty deps, so the same observer
  // instance keeps watching the same sentinel node across re-renders instead
  // of being torn down/recreated every fetch). Calling loadMoreArticles
  // straight from that effect would freeze its closure at whatever
  // page/totalPages were on mount; going through this ref means the
  // intersection callback always invokes the latest version instead.
  const loadMoreArticlesRef = useRef(loadMoreArticles);
  useEffect(() => {
    loadMoreArticlesRef.current = loadMoreArticles;
  });

  const loadMoreSentinelRef = useRef(null);
  useEffect(() => {
    if (!loadMoreSentinelRef.current) return;
    // Deliberately not awaited — a real IntersectionObserver never looks at
    // the callback's return value, and awaiting loadMoreArticlesRef here
    // would tie this callback's own completion to the fetch it kicks off,
    // which is exactly wrong for the case a second intersection fires while
    // the first fetch is still in flight (isLoadingMore's guard, inside
    // loadMoreArticles, is what's supposed to catch that — this callback
    // firing-and-forgetting is what lets a second one even get the chance
    // to hit that guard instead of queuing up behind the first).
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMoreArticlesRef.current();
      },
      { rootMargin: "150px" }
    );
    const current = loadMoreSentinelRef.current;
    observer.observe(current);
    return () => observer.unobserve(current);
  }, []);

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

  // Locked teaser cards have no save/like buttons and nothing to open, so
  // they're excluded from keyboard nav (j/k/o/s/l) entirely — otherwise
  // "o"/Enter on a focused teaser would push straight to
  // /article/[id] for a Pro-only article a Free viewer can't actually read.
  const navigableArticles = useMemo(
    () => articles.filter((article) => !article.isPremiumTeaser),
    [articles]
  );
  const { selectedIndex, cardRefs } = useArticleShortcuts(
    navigableArticles,
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
      ) : error && articles.length === 0 ? (
        <p className={styles.caughtUpText}>Error: {error}</p>
      ) : articles.length > 0 ? (
        <>
          {effectiveDensity === "reader" ? (
            // The 3-pane reader opens a selected article in an adjacent pane —
            // a locked teaser has nothing to open there, so it's left out of
            // this density rather than needing its own dead-end selection
            // state. It still appears in every other density.
            <ThreePaneLayout
              articles={articles.filter((article) => !article.isPremiumTeaser)}
              archiveId={defaultArchiveId}
              viewOnly={true}
              selectedIndex={selectedIndex}
              cardRefs={cardRefs}
              selectedArticleId={selectedArticleId}
              onSelectArticle={(article) => setSelectedArticleId(article?.id ?? null)}
            />
          ) : (
            <NewsGridWrapper density={effectiveDensity}>
              {(() => {
                // Tracks each real (non-teaser) card's own index into
                // navigableArticles separately from its position in the
                // rendered array — keyboard nav (cardRefs/selectedIndex) is
                // keyed against navigableArticles, so a card after a teaser
                // needs the *navigable* index here, not its raw array index.
                let navIndex = -1;
                return articles.map((article) => {
                  if (article.isPremiumTeaser) {
                    return (
                      <PremiumTeaserCard key={article.url} article={article} density={effectiveDensity} />
                    );
                  }
                  navIndex += 1;
                  const i = navIndex;
                  return (
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
                  );
                });
              })()}
            </NewsGridWrapper>
          )}

          <div className={styles.loadMoreRow}>
            {page < totalPages ? (
              isLoggedIn ? (
                isLoadingMore && <p className={styles.caughtUpText}>Loading more…</p>
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

      {/* Scrolling this into view auto-fetches the next page — see the
          loadMoreArticlesRef/IntersectionObserver effect above. Rendered
          unconditionally (not nested inside the articles.length > 0 branch
          above) so the observer effect's one-time mount setup always finds
          a real node to attach to — TodayPage/LocalPage start with zero
          articles before their first fetch resolves, so nesting this inside
          that branch left it absent on first mount, and since that effect
          never re-runs, the observer never got created at all. */}
      <div ref={loadMoreSentinelRef} className={styles.loadMoreSentinel} />

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

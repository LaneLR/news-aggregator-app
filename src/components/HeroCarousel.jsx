"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, TrendingUp } from "lucide-react";
import CarouselArticleCard from "@/components/CarouselArticleCard";
import CarouselRow from "@/components/CarouselRow";
import CarouselSkeleton from "@/components/CarouselSkeleton";
import styles from "./HeroCarousel.module.scss";

const CAROUSEL_LIMIT = 12;

const SUBTITLES = {
  forYou: "Picked based on the sources, categories, and articles you've liked, saved, and clicked on.",
  trending: "The most-read stories across MorningFeeds right now.",
};

// Sits where the single-article hero used to be. Subscribers get a "For
// You" vs "Trending" toggle; free users only ever see Trending (the "For
// You" tab requires a subscription server-side, same as /for-you).
export default function HeroCarousel() {
  const { data: session } = useSession();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  const [view, setView] = useState(isSubscribed ? "forYou" : "trending");
  const [sort, setSort] = useState("trending");
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const url =
          view === "forYou"
            ? "/api/recommendations"
            : `/api/articles/trending?sort=${sort}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled) {
          setArticles(res.ok ? (data.articles || []).slice(0, CAROUSEL_LIMIT) : []);
        }
      } catch (err) {
        console.error("Failed to load hero carousel articles:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [view, sort]);

  return (
    <section className={styles.section}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <span className={styles.accentBar} />
          <div>
            <h2 className={`${styles.sectionTitle} headline`}>
              {view === "forYou" ? <Sparkles size={20} /> : <TrendingUp size={20} />}
              {view === "forYou" ? "For You" : "Trending"}
            </h2>
            <p className={styles.sectionSubtitle}>{SUBTITLES[view]}</p>
          </div>
        </div>
        <div className={styles.toggleGroup}>
          {isSubscribed && (
            <div className={styles.toggleRow}>
              <button
                type="button"
                className={`${styles.toggleOption} ${view === "forYou" ? styles.active : ""}`}
                onClick={() => setView("forYou")}
              >
                For You
              </button>
              <button
                type="button"
                className={`${styles.toggleOption} ${view === "trending" ? styles.active : ""}`}
                onClick={() => setView("trending")}
              >
                Trending
              </button>
            </div>
          )}
          {view === "trending" && (
            <div className={styles.toggleRow}>
              <button
                type="button"
                className={`${styles.toggleOption} ${sort === "trending" ? styles.active : ""}`}
                onClick={() => setSort("trending")}
              >
                Most Read
              </button>
              <button
                type="button"
                className={`${styles.toggleOption} ${sort === "liked" ? styles.active : ""}`}
                onClick={() => setSort("liked")}
              >
                Most Liked
              </button>
            </div>
          )}
        </div>
      </div>
      {isLoading ? (
        <CarouselSkeleton />
      ) : articles.length > 0 ? (
        <CarouselRow>
          {articles.map((article) => (
            <CarouselArticleCard key={article.url} article={article} />
          ))}
        </CarouselRow>
      ) : (
        <p className={styles.emptySectionText}>
          {view === "forYou"
            ? "Like, save, or click a few articles and check back here — we'll start tailoring this to you."
            : "Nothing trending right now — check back soon."}
        </p>
      )}
    </section>
  );
}

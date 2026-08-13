"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Cpu,
  Clapperboard,
  Trophy,
  FlaskConical,
  Newspaper,
  ChevronRight,
  Flame,
  Leaf,
  Landmark,
  Globe,
  Flag,
  CloudSun,
  BookOpen,
  LineChart,
  DollarSign,
  Mic,
} from "lucide-react";
import CarouselArticleCard from "@/components/CarouselArticleCard";
import CarouselRow from "@/components/CarouselRow";
import CarouselSkeleton from "@/components/CarouselSkeleton";
import HeroCarousel from "@/components/HeroCarousel";
import FeatureCallout from "@/components/FeatureCallout";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { DEFAULT_HOME_SECTIONS } from "@/lib/homeSections";
import styles from "./NewNewsPage.module.scss";

// Covers every selectable category (see Settings → Home Page Sections),
// not just the 5 that used to be hardcoded — matches HeaderNavBar's icon
// choices for the same categories, kept in sync by hand.
const CATEGORY_ICONS = {
  Business: Briefcase,
  Tech: Cpu,
  Entertainment: Clapperboard,
  Sports: Trophy,
  Science: FlaskConical,
  Lifestyle: Leaf,
  Politics: Landmark,
  World: Globe,
  US: Flag,
  Weather: CloudSun,
  Journal: BookOpen,
  Market: LineChart,
  Finance: DollarSign,
  Podcast: Mic,
};

const CATEGORY_SUBTITLES = {
  Business: "Markets, companies, and the economy",
  Tech: "The latest in tech and innovation",
  Entertainment: "Movies, TV, music, and culture",
  Sports: "Scores, highlights, and analysis",
  Science: "Discoveries and breakthroughs",
  Lifestyle: "Wellness, culture, and everyday living",
  Politics: "Policy, elections, and government",
  World: "News from around the globe",
  US: "National headlines",
  Weather: "Forecasts and severe weather coverage",
  Journal: "In-depth reporting and analysis",
  Market: "Stocks, indices, and market movements",
  Finance: "Personal finance and the economy",
  Podcast: "Episodes from finance, tech, and news podcasts",
};

// Matches the pre-fetch default so nothing flashes for the common case
// (a user who's never opened Settings → Home Page Sections) — real values
// arrive with the /api/news-by-category response and override these.
const DEFAULT_SHOW_FOR_YOU = DEFAULT_HOME_SECTIONS.includes("forYou");
const DEFAULT_SHOW_TOP_STORIES = DEFAULT_HOME_SECTIONS.includes("topStories");
const DEFAULT_CATEGORY_SECTIONS = DEFAULT_HOME_SECTIONS.filter((key) => CATEGORY_ICONS[key]);

export default function NewsPage() {
  // null = still loading; [] / {} = loaded (possibly empty). Sections render
  // a same-sized skeleton while null instead of the page blocking on one
  // big spinner, so the shell (headers, icons) shows immediately and only
  // the card content pops in once each fetch resolves.
  const [categorizedArticles, setCategorizedArticles] = useState(null);
  const [topStories, setTopStories] = useState(null);
  const [showForYou, setShowForYou] = useState(DEFAULT_SHOW_FOR_YOU);
  const [showTopStories, setShowTopStories] = useState(DEFAULT_SHOW_TOP_STORIES);

  const loadNews = () => {
    const categoriesPromise = fetch("/api/news-by-category")
      .then((res) => res.json())
      .then((data) => {
        setCategorizedArticles(data.categories || {});
        setShowForYou(data.showForYou ?? true);
        setShowTopStories(data.showTopStories ?? true);
      })
      .catch((err) => {
        console.error("Failed to fetch news:", err);
        setCategorizedArticles({});
      });

    const topStoriesPromise = fetch("/api/news/top-stories")
      .then((res) => res.json())
      .then((data) => setTopStories(data.topStories || []))
      .catch((err) => {
        console.error("Failed to fetch top stories:", err);
        setTopStories([]);
      });

    return Promise.all([categoriesPromise, topStoriesPromise]);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const { pullDistance, isRefreshing, pullHandlers } = usePullToRefresh(loadNews);

  const categoriesLoading = categorizedArticles === null;
  const categorySections = categoriesLoading
    ? DEFAULT_CATEGORY_SECTIONS
    : Object.keys(categorizedArticles);

  return (
    <div className={styles.newsPageWrapper} {...pullHandlers}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      <h1 className={styles.srOnly}>Your News Feed</h1>
      <FeatureCallout />
      {showForYou && <HeroCarousel />}

      {showTopStories && (topStories === null || topStories.length > 0) && (
        <section className={styles.section}>
          <div className={styles.headerRow}>
            <div className={styles.headerLeft}>
              <span className={styles.accentBar} />
              <div>
                <h2 className={`${styles.sectionTitle} headline`}>
                  <Flame size={20} />
                  Top Stories
                </h2>
                <p className={styles.sectionSubtitle}>
                  Stories multiple sources are covering right now
                </p>
              </div>
            </div>
          </div>
          {topStories === null ? (
            <CarouselSkeleton />
          ) : (
            <CarouselRow>
              {topStories.map(({ lead, relatedCount, sources }) => (
                <div key={lead.id} className={styles.topStoryCard}>
                  <CarouselArticleCard article={lead} />
                  {relatedCount > 0 && (
                    <span
                      className={styles.relatedBadge}
                      title={sources.join(", ")}
                    >
                      +{relatedCount} more source{relatedCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              ))}
            </CarouselRow>
          )}
        </section>
      )}

      {categorySections.map((category) => {
        const CategoryIcon = CATEGORY_ICONS[category] || Newspaper;
        const articles = categorizedArticles?.[category];
        return (
          <section className={styles.section} key={category}>
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <span className={styles.accentBar} />
                <div>
                  <h2 className={`${styles.sectionTitle} headline`}>
                    <CategoryIcon size={20} />
                    {category}
                  </h2>
                  {CATEGORY_SUBTITLES[category] && (
                    <p className={styles.sectionSubtitle}>{CATEGORY_SUBTITLES[category]}</p>
                  )}
                </div>
              </div>
              <Link className={styles.viewAllLink} href={`/category/${category.toLowerCase()}`}>
                View all
                <ChevronRight size={16} />
              </Link>
            </div>
            {categoriesLoading ? (
              <CarouselSkeleton />
            ) : articles.length > 0 ? (
              <CarouselRow>
                {articles.map((article) => (
                  <CarouselArticleCard key={article.url} article={article} />
                ))}
              </CarouselRow>
            ) : (
              <p className={styles.emptySectionText}>
                No {category.toLowerCase()} articles right now — check back soon.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

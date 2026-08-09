"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Cpu, Clapperboard, Trophy, FlaskConical, Newspaper, ChevronRight, Flame } from "lucide-react";
import CarouselArticleCard from "@/components/CarouselArticleCard";
import CarouselRow from "@/components/CarouselRow";
import CarouselSkeleton from "@/components/CarouselSkeleton";
import HeroCarousel from "@/components/HeroCarousel";
import FeatureCallout from "@/components/FeatureCallout";
import styles from "./NewNewsPage.module.scss";

const CATEGORY_ICONS = {
  Business: Briefcase,
  Tech: Cpu,
  Entertainment: Clapperboard,
  Sports: Trophy,
  Science: FlaskConical,
};

const CATEGORY_SUBTITLES = {
  Business: "Markets, companies, and the economy",
  Tech: "The latest in tech and innovation",
  Entertainment: "Movies, TV, music, and culture",
  Sports: "Scores, highlights, and analysis",
  Science: "Discoveries and breakthroughs",
};

export default function NewsPage() {
  // null = still loading; [] / {} = loaded (possibly empty). Sections render
  // a same-sized skeleton while null instead of the page blocking on one
  // big spinner, so the shell (headers, icons) shows immediately and only
  // the card content pops in once each fetch resolves.
  const [categorizedArticles, setCategorizedArticles] = useState(null);
  const [topStories, setTopStories] = useState(null);

  useEffect(() => {
    fetch("/api/news-by-category")
      .then((res) => res.json())
      .then((data) => setCategorizedArticles(data))
      .catch((err) => {
        console.error("Failed to fetch news:", err);
        setCategorizedArticles({});
      });

    fetch("/api/news/top-stories")
      .then((res) => res.json())
      .then((data) => setTopStories(data.topStories || []))
      .catch((err) => {
        console.error("Failed to fetch top stories:", err);
        setTopStories([]);
      });
  }, []);

  const categoriesLoading = categorizedArticles === null;
  const categorySections = categoriesLoading
    ? Object.keys(CATEGORY_ICONS)
    : Object.keys(categorizedArticles);

  return (
    <div className={styles.newsPageWrapper}>
      <h1 className={styles.srOnly}>Your News Feed</h1>
      <FeatureCallout />
      <HeroCarousel />

      {(topStories === null || topStories.length > 0) && (
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

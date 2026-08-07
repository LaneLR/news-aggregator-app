"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Cpu, Clapperboard, Trophy, FlaskConical, Newspaper, ChevronRight, Flame } from "lucide-react";
import Loading from "@/app/loading";
import CarouselArticleCard from "@/components/CarouselArticleCard";
import CarouselRow from "@/components/CarouselRow";
import HeroCarousel from "@/components/HeroCarousel";
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
  const [categorizedArticles, setCategorizedArticles] = useState(null);
  const [topStories, setTopStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/news-by-category");
        const data = await res.json();
        setCategorizedArticles(data);
      } catch (err) {
        console.error("Failed to fetch news:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();

    fetch("/api/news/top-stories")
      .then((res) => res.json())
      .then((data) => setTopStories(data.topStories || []))
      .catch((err) => console.error("Failed to fetch top stories:", err));
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (!categorizedArticles) {
    return <p>Could not load news.</p>;
  }

  return (
    <div className={styles.newsPageWrapper}>
      <HeroCarousel />

      {topStories.length > 0 && (
        <section className={styles.section}>
          <div className={styles.headerRow}>
            <div className={styles.headerLeft}>
              <span className={styles.accentBar} />
              <div>
                <h2 className={styles.sectionTitle}>
                  <Flame size={20} />
                  Top Stories
                </h2>
                <p className={styles.sectionSubtitle}>
                  Stories multiple sources are covering right now
                </p>
              </div>
            </div>
          </div>
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
        </section>
      )}

      {Object.entries(categorizedArticles).map(([category, articles]) => {
        const CategoryIcon = CATEGORY_ICONS[category] || Newspaper;
        return (
          <section className={styles.section} key={category}>
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <span className={styles.accentBar} />
                <div>
                  <h2 className={styles.sectionTitle}>
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
            <CarouselRow>
              {articles.map((article) => (
                <CarouselArticleCard key={article.url} article={article} />
              ))}
            </CarouselRow>
          </section>
        );
      })}
    </div>
  );
}

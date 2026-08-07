"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Cpu, Clapperboard, Trophy, FlaskConical, Newspaper, ChevronRight } from "lucide-react";
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

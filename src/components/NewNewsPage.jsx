"use client";
import { useState, useEffect } from "react";
import { Briefcase, Cpu, Clapperboard, Trophy, FlaskConical, Newspaper } from "lucide-react";
import Loading from "@/app/loading";
import CarouselArticleCard from "@/components/CarouselArticleCard";
import HeroCarousel from "@/components/HeroCarousel";
import styles from "./NewNewsPage.module.scss";

const CATEGORY_ICONS = {
  Business: Briefcase,
  Technology: Cpu,
  Entertainment: Clapperboard,
  Sports: Trophy,
  Science: FlaskConical,
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
            <h2 className={styles.sectionTitle}>
              <CategoryIcon size={22} />
              {category}
            </h2>
            <div className={styles.carouselWrapper}>
              {articles.map((article) => (
                <CarouselArticleCard key={article.url} article={article} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

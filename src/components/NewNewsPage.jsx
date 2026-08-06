"use client";
import { useState, useEffect } from "react";
import Loading from "@/app/loading";
import CarouselArticleCard from "@/components/CarouselArticleCard";
import HeroCarousel from "@/components/HeroCarousel";
import styles from "./NewNewsPage.module.scss";


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

      {Object.entries(categorizedArticles).map(([category, articles]) => (
        <section className={styles.section} key={category}>
          <h2 className={styles.sectionTitle}>{category}</h2>
          <div className={styles.carouselWrapper}>
            {articles.map((article) => (
              <CarouselArticleCard key={article.url} article={article} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

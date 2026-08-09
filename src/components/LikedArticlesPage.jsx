"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import NewsCardFour from "@/components/NewsCardFour";
import NewsGridWrapper from "@/components/NewsGridWrapper";
import CardSkeleton from "@/components/CardSkeleton";
import styles from "./LikedArticlesPage.module.scss";

export default function LikedArticlesPage() {
  const { data: session, status } = useSession();
  const [likedArticles, setLikedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchLiked = async () => {
        setIsLoading(true);
        try {
          const res = await fetch("/api/articles/liked");
          const data = await res.json();
          if (res.ok) {
            setLikedArticles(data.articles);
          }
        } catch (err) {
          console.error("Failed to fetch liked articles:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLiked();
    }
    if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status]);

  if (!session && status !== "loading") {
    return (
      <p className={styles.statusText}>
        Please sign in to see your liked articles.
      </p>
    );
  }

  return (
    <div className={styles.likedPageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageTitle} headline`}>
          <Heart size={26} strokeWidth={2} />
          Your Liked Articles
        </h1>
      </div>

      {isLoading || status === "loading" ? (
        <NewsGridWrapper>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </NewsGridWrapper>
      ) : likedArticles.length > 0 ? (
        <NewsGridWrapper>
          {likedArticles.map((article, i) => (
            <NewsCardFour key={article.url} article={article} viewOnly={true} index={i} />
          ))}
        </NewsGridWrapper>
      ) : (
        <div className={styles.emptyState}>
          <Heart size={32} strokeWidth={1.5} />
          <p>You haven&apos;t liked any articles yet.</p>
          <p className={styles.emptyStateHint}>
            Tap the heart on any article to save it here.
          </p>
        </div>
      )}
    </div>
  );
}

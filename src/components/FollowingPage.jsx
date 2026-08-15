"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Rss } from "lucide-react";
import Link from "next/link";
import NewsCardFour from "@/components/NewsCardFour";
import NewsGridWrapper from "@/components/NewsGridWrapper";
import CardSkeleton from "@/components/CardSkeleton";
import styles from "./LikedArticlesPage.module.scss";

export default function FollowingPage() {
  const { data: session, status } = useSession();
  const [articles, setArticles] = useState([]);
  const [hasFollows, setHasFollows] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchFollowing = async () => {
        setIsLoading(true);
        try {
          const res = await fetch("/api/articles/following");
          const data = await res.json();
          if (res.ok) {
            setArticles(data.articles);
            setHasFollows(data.hasFollows);
          }
        } catch (err) {
          console.error("Failed to fetch followed articles:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchFollowing();
    }
    if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status]);

  if (!session && status !== "loading") {
    return <p className={styles.statusText}>Please sign in to see articles you follow.</p>;
  }

  return (
    <div className={styles.likedPageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageTitle} headline`}>
          <Rss size={26} strokeWidth={2} />
          Following
        </h1>
      </div>

      {isLoading || status === "loading" ? (
        <NewsGridWrapper>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </NewsGridWrapper>
      ) : !hasFollows ? (
        <div className={styles.emptyState}>
          <Rss size={32} strokeWidth={1.5} />
          <p>You&apos;re not following any sources or topics yet.</p>
          <p className={styles.emptyStateHint}>
            Follow a source from the icon next to its name on any article card, or add a
            word, topic, or company to follow in <Link href="/settings">Settings</Link> — new
            matching articles will show up here.
          </p>
        </div>
      ) : articles.length > 0 ? (
        <NewsGridWrapper>
          {articles.map((article, i) => (
            <NewsCardFour key={article.url} article={article} viewOnly={true} index={i} />
          ))}
        </NewsGridWrapper>
      ) : (
        <div className={styles.emptyState}>
          <Rss size={32} strokeWidth={1.5} />
          <p>No recent articles match what you&apos;re following.</p>
          <p className={styles.emptyStateHint}>Check back soon, or follow a few more topics.</p>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import NewsCardFour from "@/components/NewsCardFour";
import NewsGridWrapper from "@/components/NewsGridWrapper";
import Loading from "@/app/loading";

const LikedPageWrapper = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Header = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.darkBlue};
  text-align: center;
  margin-bottom: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  background-color: ${(props) => props.theme.background};
  border-radius: 12px;
`;

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

  if (isLoading || status === "loading") {
    return <Loading />;
  }

  if (!session) {
    return <p>Please sign in to see your liked articles.</p>;
  }

  return (
    <LikedPageWrapper>
      <Header>Your Liked Articles</Header>
      {likedArticles.length > 0 ? (
        <NewsGridWrapper>
          {likedArticles.map((article) => (
            <NewsCardFour
              key={article.url}
              article={article}
              viewOnly={true}
            />
          ))}
        </NewsGridWrapper>
      ) : (
        <EmptyState>
          <p>You haven't liked any articles yet.</p>
        </EmptyState>
      )}
    </LikedPageWrapper>
  );
}

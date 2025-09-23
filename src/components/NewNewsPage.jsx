"use client";
import { useState, useEffect } from "react";
import styled from "styled-components";
import Loading from "@/app/loading";
import HeroArticleCard from "@/components/HeroArticleCard";
import CarouselArticleCard from "@/components/CarouselArticleCard";


const NewsPageWrapper = styled.div`
  max-width: 96vw;
  margin: 2rem auto;
  padding: 0 1rem;

  @media (max-width: 768px) {
    padding: 0 5px;
    max-width: 100vw;
  }
`;

const Section = styled.section`
  margin-bottom: 3rem;
  max-width: 95vw;
  margin: 0 1.5rem;
  @media (max-width: 440px) {
    margin-bottom: 2rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => props.theme.primary};
  margin-bottom: 1.5rem;
  border-bottom: 2px solid ${(props) => props.theme.border};

  @media (max-width: 440px) {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const CarouselWrapper = styled.div`
  display: flex;
  gap: 8px;
  padding: 5px 13px 20px 13px;
  margin: 30px 0;
  overflow-x: auto;
  width: auto;

  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.primary};
  }
  @media (max-width: 440px) {
    gap: 1rem;
  }
`;


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

  const topStory = categorizedArticles["Top Stories"]?.[0];
  const otherCategories = Object.entries(categorizedArticles).filter(
    ([key]) => key !== "Top Stories"
  );

  return (
    <NewsPageWrapper>
      {topStory && (
        <Section>
          <HeroArticleCard article={topStory} />
        </Section>
      )}

      {otherCategories.map(([category, articles]) => (
        <Section key={category}>
          <SectionTitle>{category}</SectionTitle>
          <CarouselWrapper>
            {articles.map((article) => (
              <CarouselArticleCard key={article.url} article={article} />
            ))}
          </CarouselWrapper>
        </Section>
      ))}
    </NewsPageWrapper>
  );
}

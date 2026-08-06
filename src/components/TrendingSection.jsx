"use client";
import { useState, useEffect } from "react";
import styled from "styled-components";
import CarouselArticleCard from "@/components/CarouselArticleCard";

const Section = styled.section`
  margin-bottom: 3rem;
  max-width: 95vw;
  margin: 0 1.5rem;
  @media (max-width: 440px) {
    margin-bottom: 2rem;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  border-bottom: 2px solid ${(props) => props.theme.border};
  margin-bottom: 1.5rem;

  @media (max-width: 440px) {
    margin-bottom: 1rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => props.theme.darkBlue};
  margin-bottom: 0;

  @media (max-width: 440px) {
    font-size: 1.5rem;
  }
`;

const SortToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const SortOption = styled.button`
  padding: 6px 14px;
  border-radius: 16px;
  border: 2px solid ${(props) => props.theme.border};
  background: ${(props) => (props.$active ? props.theme.primary : "transparent")};
  color: ${(props) => (props.$active ? props.theme.buttonText : props.theme.text)};
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
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

export default function TrendingSection() {
  const [sort, setSort] = useState("trending");
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/articles/trending?sort=${sort}`);
        const data = await res.json();
        if (!cancelled) setArticles(data.articles || []);
      } catch (err) {
        console.error("Failed to load trending articles:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sort]);

  if (!isLoading && articles.length === 0) return null;

  return (
    <Section>
      <HeaderRow>
        <SectionTitle>Trending</SectionTitle>
        <SortToggle>
          <SortOption
            type="button"
            $active={sort === "trending"}
            onClick={() => setSort("trending")}
          >
            Most Read
          </SortOption>
          <SortOption
            type="button"
            $active={sort === "liked"}
            onClick={() => setSort("liked")}
          >
            Most Liked
          </SortOption>
        </SortToggle>
      </HeaderRow>
      <CarouselWrapper>
        {articles.map((article) => (
          <CarouselArticleCard key={article.url} article={article} />
        ))}
      </CarouselWrapper>
    </Section>
  );
}

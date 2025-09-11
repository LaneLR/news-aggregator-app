"use client";
import styled from "styled-components";
import Link from "next/link";
import Image from "next/image";

const CardLink = styled(Link)`
  display: block;
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  overflow: hidden;
  color: white;
  text-decoration: none;
  margin: 0 0 30px 0;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0) 60%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
  @media (max-width: 440px) {
    padding: 1rem;
  }
`;

const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
  @media (max-width: 440px) {
    font-size: 1.6rem;
  }
`;

const Source = styled.p`
  font-size: 1rem;
  font-weight: 500;
  margin: 0.5rem 0 0;
  opacity: 0.9;
  @media (max-width: 440px) {
    font-size: 0.9rem;
  }
`;

export default function HeroArticleCard({ article }) {
  const proxiedImageUrl = article.urlToImage
    ? `/api/image-proxy?url=${encodeURIComponent(article.urlToImage)}`
    : "/images/blurimage.png";

  return (
    <CardLink href={article.url} target="_blank" rel="noopener noreferrer">
      <Image
        src={proxiedImageUrl}
        alt={article.title}
        fill
        sizes="100vw"
        style={{ objectFit: "cover" }}
      />
      <Overlay>
        <Title>{article.title}</Title>
        <Source>{article.sourceName}</Source>
      </Overlay>
    </CardLink>
  );
}

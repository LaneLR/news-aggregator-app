"use client";
import { useState } from "react";
import styled from "styled-components";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

import ShareButton from "./ShareButton";
import ArchiveToggleButton from "./ArchiveToggleButton";

const CardWrapper = styled.div`
  display: inline-block;
  width: 320px;
  flex-shrink: 0;
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid #eee;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 440px) {
    width: 280px;
  }
`;

const ImageLink = styled(Link)`
  display: block;
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
`;

const ContentArea = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const Source = styled.p`
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;

  @media (max-width: 440px) {
    font-size: 0.8rem;
  }
`;

const LockIcon = styled.img`
  width: 16px;
  height: 16px;
  margin-left: 8px;
`;

const TitleLink = styled(Link)`
  text-decoration: none;
  color: var(--dark-blue);
  &:hover {
    text-decoration: underline;
  }
`;

const Title = styled.h3`
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.4;
  margin: 0;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 440px) {
    font-size: 1.05rem;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  border-top: 1px solid #f0f0f0;
  padding-top: 0.75rem;
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.1rem;
  font-weight: 500;
  color: ${(props) => (props.$isLiked ? "var(--primary-blue)" : "#555")};
`;

const LikeIcon = styled.img`
  height: 24px;
  width: 24px;
`;

const ReadMoreButton = styled.a`
  background-color: var(--primary-blue);
  color: #fff;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: bold;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  align-self: flex-start;
  cursor: pointer;
  width: 120px;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;
  &:hover {
    background-color: var(--deep-blue);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
`;

export default function CarouselCard({ article, archiveId, sessionData }) {
  const { data: session } = useSession({ data: sessionData });

  const PAYWALLED_SOURCES = new Set([
    "The Washington Post",
    "Financial Times",
    "The Wall Street Journal",
    "The New York Times",
    "Bloomberg",
    "The Economist",
    "Reuters",
  ]);
  const [isLiked, setIsLiked] = useState(article.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);

  const FALLBACK_IMAGE_URL = "/images/blurimage.png";
  const proxiedImageUrl = article.urlToImage
    ? `/api/image-proxy?url=${encodeURIComponent(article.urlToImage)}`
    : FALLBACK_IMAGE_URL;

  const handleLike = async () => {
    if (!session) {
      alert("You must be signed in to like articles.");
      return;
    }
    const originalLikedState = isLiked;
    const originalLikeCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    try {
      const res = await fetch("/api/articles/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleUrl: article.url }),
      });

      if (!res.ok) {
        throw new Error("Failed to update like status");
      }
    } catch (err) {
      setIsLiked(originalLikedState);
      setLikeCount(originalLikeCount);
    }
  };

  const cleanSourceName =
    article.sourceName || article.source?.name || "Unknown";
  const isPaywalled = PAYWALLED_SOURCES.has(cleanSourceName);

  return (
    <CardWrapper>
      <ImageLink href={article.url} target="_blank" rel="noopener noreferrer">
        <Image
          src={proxiedImageUrl}
          alt={article.title}
          fill
          sizes="320px"
          style={{ objectFit: "cover" }}
        />
      </ImageLink>
      <ContentArea>
        <Source>
          {cleanSourceName}
          {isPaywalled && (
            <LockIcon
              src="/images/lock.svg"
              title="This source could be behind a paywall."
            />
          )}
        </Source>
        <Title>
          <TitleLink
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {article.title}
          </TitleLink>
        </Title>
        <ActionsRow>
          <div
            style={{
              display: "flex",
              justifyContent: "left",
              alignItems: "center",
            }}
          >
            <ReadMoreButton href={article.url} target="_blank">
              Read article
            </ReadMoreButton>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "right",
              alignItems: "center",
              width: "100%",
              gap: "7px",
            }}
          >
            <ArchiveToggleButton article={article} archiveId={archiveId} />
            <ShareButton article={article} />
            <LikeButton onClick={handleLike} $isLiked={isLiked}>
              <LikeIcon
                src={
                  isLiked
                    ? "/images/like-button-liked.svg"
                    : "/images/like-button-unliked.svg"
                }
              />
              {likeCount}
            </LikeButton>
          </div>
        </ActionsRow>
      </ContentArea>
    </CardWrapper>
  );
}

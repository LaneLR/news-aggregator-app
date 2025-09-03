"use client";
import styled from "styled-components";
import ArchiveToggleButton from "./ArchiveToggleButton.jsx";
import Link from "next/link.js";
import Image from "next/image.js";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation.js";

const CardContainer = styled.div`
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  border: 1px solid gray;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
`;

const BrandText = styled.span`
  font-size: 1rem;
  font-weight: bold;
  color: var(--dark-blue);
`;

const ContentArea = styled.div`
  padding: 20px 20px 0px 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 192px;
  justify-content: space-between;
`;

const ArticleTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--dark-blue);
  line-height: 1.3;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ArticleSnippet = styled.div`
  font-size: 1rem;
  color: var(--dark-blue);
  line-height: 1.5;
  font-weight: 700;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ArticleSnippetText = styled.p`
  background-color: #dcebfdff;
  width: fit-content;
  padding: 3px 6px;
  border-radius: 6px;
`;

const ReadMoreButton = styled.a`
  background-color: var(--primary-blue);
  color: #fff;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  align-self: flex-start;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;
  &:hover {
    background-color: var(--deep-blue);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  gap: 6px;
  font-size: 1rem;
  color: ${(props) => (props.$isLiked ? "var(--primary-blue)" : "#555")};
`;

const LikeOrUnlikedButton = styled.img`
  height: 35px;
  width: 35px;
  // &:hover {
  //   transform: translateY(-1px);
  // }

  // &:active {
  //   transform: translateY(0);
  // }
`;

const LikeCountCounter = styled.div`
  font-weight: 500;
  font-size: 1.3rem;
  color: var(--dark-blue);
`;

const LockedArticleSVG = styled.img`
  height: 35px;
  width: 35px;
`;

export default function NewsCardThree({
  article,
  archiveId,
  viewOnly = false,
}) {
  const { data: session } = useSession();

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

  const rawUrl =
    typeof article?.urlToImage === "string" ? article.urlToImage.trim() : "";

  const proxiedImageUrl = rawUrl
    ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`
    : FALLBACK_IMAGE_URL;

  const [imageSrc, setImageSrc] = useState(proxiedImageUrl);

  const handleImageError = () => setImageSrc(FALLBACK_IMAGE_URL);

  const handleLike = async () => {
    if (!session) {
      alert("You must be signed in to like articles.");
      redirect("/login");
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
      alert("There was an error. Please try again.");
    }
  };
  const cleanTitle =
    article.title?.substring(0, article.title.lastIndexOf(" - ")) ||
    article.title;
  const cleanSourceName =
    article.sourceName || article.source?.name || "Unknown source";

  const isPaywalled = PAYWALLED_SOURCES.has(cleanSourceName);

  return (
    <CardContainer>
      <CardHeader>
        <BrandText>Relay News</BrandText>
      </CardHeader>
      <Link
        href={article.url}
        target={"_blank"}
        style={{ position: "relative", width: "100%", height: "200px" }}
      >
        <Image
          src={imageSrc}
          alt={article?.title || "News article image"}
          onError={handleImageError}
          priority
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{
            objectFit: "cover",
            objectPosition: "top",
            borderBottom: "1px solid #eee",
            minWidth: "398px",
          }}
        />
      </Link>
      <ContentArea>
        <div>
          <ArticleTitle>
            <Link href={article.url} target={"_blank"}>
              {cleanTitle}
            </Link>
          </ArticleTitle>
          <ArticleSnippet>
            <ArticleSnippetText>{cleanSourceName}</ArticleSnippetText>
          </ArticleSnippet>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 0 10px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
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
              justifyContent: "center",
              alignItems: "flex-start",
              gap: "6px",
            }}
          >
            {isPaywalled && (
              <span title="This article may be behind a paywall">
                <LockedArticleSVG src="/images/lock.svg" alt="Image may be behind a paywall" />
              </span>
            )}
            <ArchiveToggleButton
              article={article}
              archiveId={archiveId}
              viewOnly={viewOnly}
            />
            <LikeButton onClick={handleLike} $isLiked={isLiked}>
              {isLiked ? (
                <LikeOrUnlikedButton src="/images/like-button-liked.svg" alt="Article liked button"/>
              ) : (
                <LikeOrUnlikedButton src="/images/like-button-unliked.svg" alt="Article not liked button"/>
              )}
              <LikeCountCounter>{likeCount}</LikeCountCounter>
            </LikeButton>
          </div>
        </div>
      </ContentArea>
    </CardContainer>
  );
}

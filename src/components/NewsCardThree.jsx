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
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: fit-content;
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

const ArticleSnippet = styled.p`
  font-size: 1rem;
  color: var(--deep-blue);
  line-height: 1.5;
  font-weight: 700;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ReadMoreButton = styled.a`
  background-color: var(--primary-blue);
  color: #fff;
  padding: 12px 20px;
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
    background-color: #173b9e;
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
  flex-direction: column;
  gap: 6px;
  font-size: 1rem;
  color: ${(props) => (props.$isLiked ? "var(--primary-blue)" : "#555")};

  &:hover {
    color: var(--primary-blue);
  }
`;

const LikeOrUnlikedButton = styled.img`
  height: 30px;
  width: 30px;
`

export default function NewsCardThree({
  article,
  archiveId,
  viewOnly = false,
}) {
  const { data: session } = useSession();

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
      console.error(err);
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
          }}
        />
      </Link>
      <ContentArea>
        <ArticleTitle>
          <Link href={article.url} target={"_blank"}>
            {cleanTitle}
          </Link>
        </ArticleTitle>
        <ArticleSnippet>- {cleanSourceName}</ArticleSnippet>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
            }}
          >
            <ArchiveToggleButton
              article={article}
              archiveId={archiveId}
              viewOnly={viewOnly}
            />
            <LikeButton onClick={handleLike} $isLiked={isLiked}>
              <div>{isLiked ? <LikeOrUnlikedButton src="/images/like-button-liked.svg"/> : <LikeOrUnlikedButton src="/images/like-button-unliked.svg" />}</div>
              <div>{likeCount}</div>
            </LikeButton>
          </div>
        </div>
      </ContentArea>
    </CardContainer>
  );
}

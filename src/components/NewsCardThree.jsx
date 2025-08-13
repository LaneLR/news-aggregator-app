"use client";
import styled from "styled-components";
import ArchiveToggleButton from "./ArchiveToggleButton.jsx";
import Link from "next/link.js";
import Image from "next/image.js";
import { useState } from "react";

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

export default function NewsCardThree({
  article,
  archiveId,
  viewOnly = false,
}) {
  const FALLBACK_IMAGE_URL = "/images/blurimage.png";

  const rawUrl =
    typeof article?.urlToImage === "string" ? article.urlToImage.trim() : "";
  const initialImage = rawUrl || FALLBACK_IMAGE_URL;

  const [imageSrc, setImageSrc] = useState(initialImage);

  const handleImageError = () => setImageSrc(FALLBACK_IMAGE_URL);

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
          src={imageSrc || FALLBACK_IMAGE_URL}
          alt={article?.title || "News article image"}
          onError={handleImageError}
          priority
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{
            objectFit: "cover",
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
          <ReadMoreButton href={article.url} target="_blank">
            Read article
          </ReadMoreButton>
          <ArchiveToggleButton
            article={article}
            archiveId={archiveId}
            viewOnly={viewOnly}
          />
        </div>
      </ContentArea>
    </CardContainer>
  );
}

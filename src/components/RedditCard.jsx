"use client";

import styled from "styled-components";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import ArchiveToggleButton from "./ArchiveToggleButton";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  color: black;
  background-color: white;
  border-radius: 20px;
`;

const CardWrapper = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
  border-top-left-radius: 15px;
  border-top-right-radius: 10px;
`;

const DescriptionSection = styled.div`
  width: 100%;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  padding: 5px 7px 7px;
  justify-content: space-between;
`;

const TitleSection = styled.div`
  width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 1rem;
`;

const AuthorSection = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 95%;
`;

export default function RedditCard({ article, archiveId, viewOnly = false }) {
  const FALLBACK_IMAGE_URL = "/images/NoImage.png";

  // Strip trailing " - Source" from title if present
  const index = article.title.lastIndexOf(" - ");
  const cleanTitle =
    index !== -1 ? article.title.substring(0, index) : article.title;

  const [currentImageSrc, setCurrentImageSrc] = useState(() => {
    return article.thumbnail?.trim()
      ? article.thumbnail
      : FALLBACK_IMAGE_URL;
  });

  useEffect(() => {
    const newSrc = article.thumbnail?.trim()
      ? article.thumbnail
      : FALLBACK_IMAGE_URL;

    setCurrentImageSrc((prevSrc) => (prevSrc !== newSrc ? newSrc : prevSrc));
  }, [article.thumbnail]);

  const handleImageError = () => {
    if (currentImageSrc !== FALLBACK_IMAGE_URL) {
      console.warn(`Image failed to load: ${currentImageSrc}. Using fallback.`);
      setCurrentImageSrc(FALLBACK_IMAGE_URL);
    }
  };

  return (
    <Wrapper>
      <CardWrapper>
        <a href={article.url} target="_blank" rel="noopener noreferrer">
          <Image
            src={currentImageSrc}
            fill
            alt={article.title || "News article image"}
            onError={handleImageError}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
            style={{
              objectFit: "cover",
              backgroundColor:
                currentImageSrc === FALLBACK_IMAGE_URL
                  ? "lightgray"
                  : "#f0f0f0",
            }}
          />
        </a>
      </CardWrapper>

      <DescriptionSection>
        <TitleSection>{cleanTitle}</TitleSection>
        <FooterRow>
          <AuthorSection>
            {(article.sourceName || article.source?.domain || "Unknown source").split(/[\s/]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          </AuthorSection>
          <ArchiveToggleButton
            article={article}
            archiveId={archiveId}
            viewOnly={viewOnly}
          />
        </FooterRow>
      </DescriptionSection>
    </Wrapper>
  );
}

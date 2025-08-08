"use client";
import styled from "styled-components";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import ArchiveToggleButton from "./ArchiveToggleButton";

const Wrapper = styled.div`
  flex-flow: column nowrap;
  justify-content: center;
  align-items: flex-start;
  color: black;
  background-color: white;
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 20px;
  border-top-left-radius: 20px;
  border-top-right-radius: 15px;
  max-width: 350px;
`;

const CardWrapper = styled.div`
  // width: 100%;
  aspect-ratio: 16 / 9;
  position: relative;
  // overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  row-gap: 14px;
`;

const DescriptionSection = styled.div`
  width: 100%;
  min-height: 70px;
  display: flex;
  flex-flow: column nowrap;
  padding: 5px 7px 7px;
  align-items: flex-start;
  justify-content: space-between;
  background-color: var(--white);
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 20px;
`;

const TitleSection = styled.div`
  width: 100%;
  height: auto;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 1rem;
`;

const AuthorSection = styled.div`
  width: 100%;
  height: auto;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  font-weight: 600;
  font-size: 0.9rem;
`;

export default function NewsCard({ article, archiveId, viewOnly = false }) {
  const FALLBACK_IMAGE_URL = "/images/NoImage.png";
  const index = article.title.lastIndexOf(" - ");
  const cleanTitle =
    index !== -1 ? article.title.substring(0, index) : article.title;

  const [currentImageSrc, setCurrentImageSrc] = useState(() => {
    return article.urlToImage &&
      typeof article.urlToImage === "string" &&
      article.urlToImage.trim() !== ""
      ? article.urlToImage
      : FALLBACK_IMAGE_URL;
  });

  useEffect(() => {
    setCurrentImageSrc((prevSrc) => {
      const newSrc =
        article.urlToImage &&
        typeof article.urlToImage === "string" &&
        article.urlToImage.trim() !== ""
          ? article.urlToImage
          : FALLBACK_IMAGE_URL;
      return newSrc !== prevSrc ? newSrc : prevSrc;
    });
  }, [article.urlToImage]);

  const handleImageError = () => {
    if (currentImageSrc !== FALLBACK_IMAGE_URL) {
      console.warn(`Image failed to load: ${currentImageSrc}. Using fallback.`);
      setCurrentImageSrc(FALLBACK_IMAGE_URL);
    }
  };

  // fixed imageHeight and imageWidth if not using fill
  // const imageHeight = 250;
  // const imageWidth = 400;

  return (
    <>
      <Wrapper>
        <CardWrapper>
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            <Image
              style={{
                borderTopLeftRadius: "15px",
                borderTopRightRadius: "10px",
                backgroundColor:
                  currentImageSrc === FALLBACK_IMAGE_URL
                    ? "lightgray"
                    : "f0f0f0",
                objectFit: "cover",
              }}
              src={currentImageSrc}
              fill
              alt={article.title || "News article image"}
              onError={handleImageError}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
            />
          </a>
        </CardWrapper>
        <DescriptionSection>
          <TitleSection>{cleanTitle}</TitleSection>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "95%",
            }}
          >
            <AuthorSection>
              {article.sourceName || article.source?.name || "Unknown source"}
            </AuthorSection>
            <ArchiveToggleButton
              article={article}
              archiveId={archiveId}
              viewOnly={viewOnly}
            />
          </div>
        </DescriptionSection>
      </Wrapper>
    </>
  );
}

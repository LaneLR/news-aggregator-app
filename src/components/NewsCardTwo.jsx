"use client";
import styled from "styled-components";
import ArchiveToggleButton from "./ArchiveToggleButton";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// A simple SVG icon for the bookmark/save feature.
// In a real app, you'd import this from an icon library or an SVG file.
const BookmarkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="20px"
    height="20px"
  >
    <path d="M0 0h24v24H0V0z" fill="none" />
    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
  </svg>
);

// 1. Main Card Container
const CardContainer = styled.div`
  display: flex;
  background-color: var(--white);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  margin: 15px;
  width: 100%;
  max-width: 700px;
  position: relative;

  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }
`;

// 2. Thumbnail Section
const ThumbnailWrapper = styled.div`
  flex-shrink: 0;
  width: 200px;
  height: 200px;
  overflow: hidden;
  position: relative;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

// "NewsBrief" overlay text
const ThumbnailLabel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.4);
  color: #fff;
  padding: 8px 12px;
  font-size: 0.8em;
  font-weight: bold;
  border-bottom-right-radius: 8px;
`;

// 3. Content Area
const ContentWrapper = styled.div`
  flex-grow: 1;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

// 4. Article Title
const ArticleTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--dark-blue);
  line-height: 1.3;
  margin-bottom: 10px;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// 5. Author and Date Container
const ArticleMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: auto;
  gap: 8px;
`;

// 6. Author Name
const ArticleAuthorBadge = styled.span`
  background-color: var(--light-white);
  color: var(--deep-blue);
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
`;

// 7. Article Date
const ArticleDate = styled.span`
  font-size: 0.85rem;
  color: var(--primary-blue);
  opacity: 0.8;
  //   font-weight: 500;
  white-space: nowrap;
`;

// 8. Save Button
const SaveButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  align-self: flex-end;
`;

const SaveButton = styled.button`
  background-color: var(--primary-blue);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;

  &:hover {
    background-color: #173b9e;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    fill: currentColor;
  }
`;

const SaveIconContainer = styled.div`
  color: var(--deep-blue);
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: var(--primary-blue);
  }
`;

export default function NewsCardTwo({
  article,
  archiveId,
  viewOnly = false,
  sessionData,
}) {
  // Assuming 'article' object has:
  // article.thumbnailUrl, article.title, article.author, article.date
  const { data: session, status, update } = useSession({ data: sessionData });

  const [isLiked, setIsLiked] = useState(article.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);

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

  return (
    <CardContainer>
      <ThumbnailWrapper>
        <ThumbnailImage
          onError={handleImageError}
          src={currentImageSrc}
          alt={article.title || "News article image"}
        />
        <ThumbnailLabel>Breaking</ThumbnailLabel>
      </ThumbnailWrapper>
      <ContentWrapper>
        <ArticleTitle>{cleanTitle}</ArticleTitle>
        <ArticleMeta>
          <ArticleAuthorBadge>
            {article.sourceName || article.source?.name || "Unknown source"}
          </ArticleAuthorBadge>
          <ArticleDate>YYYY/MM/DD</ArticleDate>
        </ArticleMeta>
        <SaveButtonWrapper>
          <SaveIconContainer>
            <BookmarkIcon />
          </SaveIconContainer>
          <ArchiveToggleButton
            article={article}
            archiveId={archiveId}
            viewOnly={viewOnly}
          />
        </SaveButtonWrapper>
      </ContentWrapper>
    </CardContainer>
  );
}

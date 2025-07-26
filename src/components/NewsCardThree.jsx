"use client";
import styled from "styled-components";
import ArchiveToggleButton from "./ArchiveToggleButton.jsx";
import { useEffect, useState } from "react";

// 1. Main Card Container
const CardContainer = styled.div`
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  width: 100%;
  max-width: 400px;
//   margin: 15px;
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

const ThumbnailImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
  border-bottom: 1px solid #eee;
`;

const ContentArea = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const NewTag = styled.span`
  background-color: var(--primary-blue);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 10px;
  align-self: flex-start;
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
  padding: 12px 25px;
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
      <CardHeader>
        <BrandText>NewsBrief</BrandText>{" "}
        {/* <MenuIcon>
          <span></span>
          <span></span>
          <span></span>
        </MenuIcon> */}
      </CardHeader>
      <ThumbnailImage
        src={currentImageSrc}
        alt={article.title || "News article image"}
      />
      <ContentArea>
        {/* <NewTag>New</NewTag> */}
        <ArticleTitle>{cleanTitle}</ArticleTitle>
        <ArticleSnippet>
          Source -{" "}
          {article.sourceName || article.source?.name || "Unknown source"}
        </ArticleSnippet>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <ReadMoreButton href={article.url}>READ MORE</ReadMoreButton>
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

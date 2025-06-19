"use client";
import styled from "styled-components";
import Image from "next/image";
import React, { useState, useEffect } from 'react'; 

const Wrapper = styled.div`
  width: 400px;
  flex-flow: column nowrap;
  justify-content: center;
  color: black;
  background-color: white;
  margin: 10px 0;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 20px;
  border-top-left-radius: 20px;
  border-top-right-radius: 10px;
`;

const CardWrapper = styled.div`
  width: 100%;
  height: auto;
  display: flex;
`;

const DescriptionSection = styled.div`
  width: 100%;
  min-height: 70px;
  display: flex;
  flex-flow: column nowrap;
  padding: 5px 7px 7px;
  align-items: center;
  justify-content: space-between;
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

export default function NewsCard({ article }) {
  const FALLBACK_IMAGE_URL = "/images/NoImage.png"; 
  const index = article.title.lastIndexOf(" - ");
  const cleanTitle =
    index !== -1 ? article.title.substring(0, index) : article.title;

  //state to manage the current image source for the Image component
  //initialize it based on whether article.urlToImage is a valid-looking string
  const [currentImageSrc, setCurrentImageSrc] = useState(() => {
    return (article.urlToImage && typeof article.urlToImage === 'string' && article.urlToImage.trim() !== '')
      ? article.urlToImage
      : FALLBACK_IMAGE_URL;
  });

  //reset image source if the article (specifically its image URL) changes
  useEffect(() => {
    setCurrentImageSrc((prevSrc) => {
      const newSrc = (article.urlToImage && typeof article.urlToImage === 'string' && article.urlToImage.trim() !== '')
        ? article.urlToImage
        : FALLBACK_IMAGE_URL;
      //only update if the source actually changed to avoid unnecessary re-renders
      return newSrc !== prevSrc ? newSrc : prevSrc;
    });
  }, [article.urlToImage]);

  //handler for when the image fails to load
  const handleImageError = () => {
    if (currentImageSrc !== FALLBACK_IMAGE_URL) {
      console.warn(`Image failed to load: ${currentImageSrc}. Using fallback.`);
      setCurrentImageSrc(FALLBACK_IMAGE_URL);
    }
  };

  const imageHeight = 250; 
  const imageWidth = 400; 

  return (
    <>
      <Wrapper>
        <CardWrapper>
          <a href={article.url} target="_blank" rel="noopener noreferrer"> 
            <Image
              style={{
                borderTopLeftRadius: "15px",
                borderTopRightRadius: "10px",
                backgroundColor: currentImageSrc === FALLBACK_IMAGE_URL ? "lightgray" : "transparent",
                objectFit: "cover", 
              }}
              src={currentImageSrc} 
              width={imageWidth}
              height={imageHeight}
              alt={article.title || 'News article image'} 
              onError={handleImageError} 
            />
          </a>
        </CardWrapper>
        <DescriptionSection>
          <TitleSection>{cleanTitle}</TitleSection>
          <AuthorSection>{article.source.name}</AuthorSection>
        </DescriptionSection>
      </Wrapper>
    </>
  );
}
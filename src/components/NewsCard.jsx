"use client";
import styled from "styled-components";
import Image from "next/image";

const CardWrapper = styled.div`
  width: 400px;
  height: 300px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  background-color: gray;
  margin: 10px 0;
  border-radius: 5px;
`;

const ImageWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const CardHeaderImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: stretch;
`;

const TitleSection = styled.div`
  width: 100%;
  height: 30%;
`;

export default function NewsCard({ article }) {
  if (!article.urlToImage) return null;
  

  return (
    <>
      <CardWrapper>
        <ImageWrapper>
          <a href={article.url} target="_blank">
            <Image 
            src={article.urlToImage} 
            width={400}
            height={300}
            alt={article.title} />
          </a>
        </ImageWrapper>

        <TitleSection>{article.title}</TitleSection>
      </CardWrapper>
    </>
  );
}

"use client";
import styled from "styled-components";
import Image from "next/image";

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
  const fallback = "/images/NoImage.png";
  const index = article.title.lastIndexOf(" - ");
  const cleanTitle =
    index !== -1 ? article.title.substring(0, index) : article.title;

  return (
    <>
      <Wrapper>
        <CardWrapper>
          <a href={article.url} target="_blank">
            {article.urlToImage ? (
              <Image
                style={{
                  borderTopLeftRadius: "15px",
                  borderTopRightRadius: "10px",
                }}
                src={article.urlToImage}
                width={400}
                height={250}
                alt={article.title}
              />
            ) : (
              <Image
                style={{
                  borderTopLeftRadius: "15px",
                  borderTopRightRadius: "10px",
                  backgroundColor: "lightgray",
                }}
                src={fallback}
                width={400}
                height={300}
                alt={article.title}
              />
            )}
          </a>
        </CardWrapper>{" "}
        <DescriptionSection>
          <TitleSection>{cleanTitle}</TitleSection>
          <AuthorSection>{article.source.name}</AuthorSection>
        </DescriptionSection>
      </Wrapper>
    </>
  );
}

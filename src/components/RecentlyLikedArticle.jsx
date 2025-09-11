"use client";
import { useState } from "react";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";

const ItemLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 5px 0;
  text-decoration: none;
  color: inherit;
  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
`;

const Thumbnail = styled(Image)`
  border-radius: 8px;
  object-fit: cover;
`;

const Info = styled.div`
  flex-grow: 1;
  h4 {
    margin: 0 0 4px 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
  }
  p {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
  }
`;

const FALLBACK_IMAGE_URL = "/images/blurimage.png";

export default function RecentlyLikedItem({ article }) {
  const rawUrl =
    typeof article?.urlToImage === "string" ? article.urlToImage.trim() : "";

  const proxiedImageUrl = rawUrl
    ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`
    : FALLBACK_IMAGE_URL;

  const [imageSrc, setImageSrc] = useState(proxiedImageUrl);
  const handleImageError = () => setImageSrc(FALLBACK_IMAGE_URL);

  return (
    <li>
      <ItemLink href={article.url} target="_blank" rel="noopener noreferrer">
        <Thumbnail
          src={imageSrc}
          width={70}
          height={70}
          alt={article.title}
          onError={handleImageError}
        />
        <Info>
          <h4>{article.title}</h4>
          <p>{article.sourceName}</p>
        </Info>
      </ItemLink>
    </li>
  );
}

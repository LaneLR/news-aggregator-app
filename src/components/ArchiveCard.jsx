"use client";
import styled from "styled-components";
import Link from 'next/link';

// --- Styled Components ---

const CardLink = styled(Link)`
  display: block;
  position: relative;
  width: 100%;
  max-width: 350px;
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  background-color: ${(props) => props.theme.border}; // Fallback for archives with 0 images
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  width: 100%;
  height: 100%;
`;

const GridImage = styled.div`
  width: 100%;
  height: 100%;
  background-image: url(${(props) => props.src});
  background-size: cover;
  background-position: center;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0) 60%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.25rem;
  color: ${(props) => props.theme.text};
  transition: background 0.2s ease-in-out;

  ${CardLink}:hover & {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.1) 60%);
  }
`;

const ArchiveTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
`;

const ArchiveMeta = styled.p`
  font-size: 0.9rem;
  margin: 4px 0 0 0;
  opacity: 0.8;
`;

export default function ArchiveCard2({ archive }) {
  const { name, articleCount, lastUpdated, articleImages = [] } = archive;

  const displayImages = [...articleImages.slice(0, 4), ...Array(4 - articleImages.length).fill(null)];

  return (
    <CardLink href={`/archives/${archive.id}`}>
      <ImageGrid>
        {displayImages.map((src, index) =>
          src ? <GridImage key={index} src={src} /> : <div key={index} />
        )}
      </ImageGrid>
      <Overlay>
        <ArchiveTitle>{name}</ArchiveTitle>
        <ArchiveMeta>{articleCount} Articles • {lastUpdated}</ArchiveMeta>
      </Overlay>
    </CardLink>
  );
}
"use client";
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const ShareWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  color: ${(props) => props.theme.text};
  border-radius: 50%;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${(props) => props.theme.background};
  }
`;

const FallbackMenu = styled.div`
  position: absolute;
  bottom: 100%; 
  right: 0;
  background-color: ${(props) => props.theme.background};
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 10;
  width: 180px;
`;

const FallbackOption = styled.a`
  display: block;
  padding: 12px 16px;
  color: ${(props) => props.theme.text};
  text-decoration: none;
  cursor: pointer;
  font-size: 0.95rem;

  &:hover {
    background-color: ${(props) => props.theme.background};
  }
`;


export default function ShareButton({ article }) {
  const [showFallback, setShowFallback] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const wrapperRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowFallback(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: `Check out this article from ${article.sourceName}:`,
      url: article.url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      setShowFallback(!showFallback);
      setCopySuccess(''); 
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(article.url).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setShowFallback(false), 800); 
    }, (err) => {
      console.error('Failed to copy text: ', err);
      setCopySuccess('Failed');
    });
  };

  const encodedUrl = encodeURIComponent(article.url);
  const encodedText = encodeURIComponent(`Check out this article I found: ${article.url}`);
  const emailSubject = encodeURIComponent(`Interesting Article: ${article.title}`);

  return (
    <ShareWrapper ref={wrapperRef}>
      <Button onClick={handleShare} title="Share article">
        <img src="/images/share2.svg" style={{width: "30px", height: "30px"}} alt='Share this article'/>
      </Button>

      {showFallback && (
        <FallbackMenu>
          <FallbackOption as="button" onClick={handleCopyLink}>
            {copySuccess || '🔗 Copy Link'}
          </FallbackOption>
          <FallbackOption href={`mailto:?subject=${emailSubject}&body=${encodedText}`}>
            ✉️ Share via Email
          </FallbackOption>
          <FallbackOption href={`sms:?&body=${encodedText}`}>
            💬 Share via Text
          </FallbackOption>
        </FallbackMenu>
      )}
    </ShareWrapper>
  );
}
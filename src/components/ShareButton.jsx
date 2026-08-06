"use client";
import { useState, useEffect, useRef } from 'react';
import styles from './ShareButton.module.scss';


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
    <div className={styles.shareWrapper} ref={wrapperRef}>
      <button className={styles.button} onClick={handleShare} title="Share article">
        <img src="/images/share2.svg" style={{width: "30px", height: "30px"}} alt='Share this article'/>
      </button>

      {showFallback && (
        <div className={styles.fallbackMenu}>
          <button className={styles.fallbackOption} onClick={handleCopyLink}>
            {copySuccess || '🔗 Copy Link'}
          </button>
          <a className={styles.fallbackOption} href={`mailto:?subject=${emailSubject}&body=${encodedText}`}>
            ✉️ Share via Email
          </a>
          <a className={styles.fallbackOption} href={`sms:?&body=${encodedText}`}>
            💬 Share via Text
          </a>
        </div>
      )}
    </div>
  );
}
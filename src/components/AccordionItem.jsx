"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./AccordionItem.module.scss";

export default function AccordionItem({ question, answer }) {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef();

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.question} onClick={() => setExpanded(!expanded)}>
        {question} {expanded ? "▲" : "▼"}
      </div>
      <div
        className={styles.answerWrapper}
        style={{ maxHeight: expanded ? `${contentHeight}px` : "0px" }}
      >
        <div
          ref={contentRef}
          className={`${styles.answerInner} ${expanded ? styles.expanded : ""}`}
        >
          {answer}
        </div>
      </div>
    </div>
  );
}

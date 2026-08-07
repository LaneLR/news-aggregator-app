"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
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
    <div className={`${styles.wrapper} ${expanded ? styles.expandedWrapper : ""}`}>
      <button
        type="button"
        className={styles.question}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {question}
        <ChevronDown
          size={18}
          strokeWidth={2}
          className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ""}`}
        />
      </button>
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

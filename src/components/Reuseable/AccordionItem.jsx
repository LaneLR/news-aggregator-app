"use client";
import styled from "styled-components";
import { useState, useRef, useEffect } from "react";

const Wrapper = styled.div`
  width: 100%;
  margin-bottom: 15px;
`;

const Question = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--light-white);
  cursor: pointer;
  padding: 15px 20px;
  background: var(--dark-blue);
  border-radius: 8px;
  user-select: none;
  transition: background-color 0.3s;
`;

const AnswerWrapper = styled.div`
  overflow: hidden;
  max-height: ${({ $expanded, $contentHeight }) =>
    $expanded ? `${$contentHeight}px` : "0px"};
  transition: max-height 0.4s ease;
  will-change: max-height;
`;

const AnswerInner = styled.div`
  padding: 15px 20px;
  opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
  transition: opacity 0.3s ease;
  position: relative;
`;

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
    <Wrapper>
      <Question onClick={() => setExpanded(!expanded)}>
        {question} {expanded ? "▲" : "▼"}
      </Question>
      <AnswerWrapper $expanded={expanded} $contentHeight={contentHeight}>
        <AnswerInner ref={contentRef} $expanded={expanded}>
          {answer}
        </AnswerInner>
      </AnswerWrapper>
    </Wrapper>
  );
}

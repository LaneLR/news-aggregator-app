"use client";
import React from "react";
import styled, { keyframes } from "styled-components";

/* Keyframes: dots rise, peak, then fall */
const rise = keyframes`
  0%   { transform: translateY(0);    opacity: 0.6; }
  50%  { transform: translateY(-10px); opacity: 1;   }
  100% { transform: translateY(0);    opacity: 0.6; }
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 75vh;
  width: 100vw;
  background-color: var(--light-white);
  flex-direction: column;
`;

/* Wrapper keeps dots aligned and reserves vertical space */
const DotsWrapper = styled.div`
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  gap: ${(p) => p.$gap}px;
  height: ${(p) => Math.max(p.size * 3, 24)}px;
`;

/* Single dot; animation delay staggered by nth-child */
const Dot = styled.div`
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
  background: ${(p) => p.color};
  border-radius: 50%;
  opacity: 0.8;
  animation: ${rise} ${(p) => p.$duration}s ease-in-out infinite;

  /* play a little with scale for nicer effect */
  transform-origin: center bottom;

  &:nth-child(1) {
    animation-delay: ${(p) => 0 * p.$stagger}s;
  }
  &:nth-child(2) {
    animation-delay: ${(p) => 1 * p.$stagger}s;
  }
  &:nth-child(3) {
    animation-delay: ${(p) => 2 * p.$stagger}s;
  }
  &:nth-child(4) {
    animation-delay: ${(p) => 3 * p.$stagger}s;
  }
  &:nth-child(5) {
    animation-delay: ${(p) => 4 * p.$stagger}s;
  }
`;

const LoadingText = styled.p`
  color: var(--primary-blue);
  padding: 20px 0 0 0;
  font-size: 2rem;
  font-weight: 500;
`;

/**
 * LoadingDots
 * Props:
 *  - size: diameter of each dot in px (default 10)
 *  - color: dot color (default #0b76ff)
 *  - duration: seconds per animation cycle (default 0.9)
 *  - gap: space between dots in px (default 8)
 *  - stagger: delay step in seconds between dots (default 0.12)
 */
export default function LoadingDots({
  size = 10,
  color = "var(--primary-blue)",
  duration = 0.9,
  gap = 8,
  stagger = 0.12,
  "aria-label": ariaLabel = "Loading",
}) {
  return (
    <Wrapper>
      <DotsWrapper size={size} $gap={gap} aria-label={ariaLabel} role="status">
        <Dot size={size} color={color} $duration={duration} $stagger={stagger} />
        <Dot size={size} color={color} $duration={duration} $stagger={stagger} />
        <Dot size={size} color={color} $duration={duration} $stagger={stagger} />
        <Dot size={size} color={color} $duration={duration} $stagger={stagger} />
        <Dot size={size} color={color} $duration={duration} $stagger={stagger} />
      </DotsWrapper>
      {/* <LoadingText>Loading</LoadingText> */}
    </Wrapper>
  );
}

"use client";
import styled from "styled-components";

const Wrapper = styled.button`
  padding: 8px 15px;
  font-size: 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.15s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export default function Button({ bgColor, clr, wide, children, onClick, disabled, type }) {
  return (
    <Wrapper
      type={type || "button"}
      style={{ backgroundColor: bgColor, color: clr, width: wide }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Wrapper>
  );
}

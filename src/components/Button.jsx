"use client";
import styled from "styled-components";

const Wrapper = styled.button`
  padding: 9px;
  font-size: 1.2rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
`

export default function Button({ bgColor, children }) {
  return (
    <Wrapper style={{ backgroundColor: `${bgColor}` }}>{children}</Wrapper>
  );
}

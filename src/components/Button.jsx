"use client";
import styled from "styled-components";

const Wrapper = styled.button`
  padding: 10px 15px;
  font-size: 1rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
`

export default function Button({ bgColor, clr, children }) {
  return (
    <Wrapper style={{ backgroundColor: `${bgColor}`, color: `${clr}` }}>{children}</Wrapper>
  );
}

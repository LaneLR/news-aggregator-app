'use client';
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  width: 100vw;
  background-color: var(--dark-blue);
  color: white;
`;

export default function Footer() {
  return <Wrapper></Wrapper>;
}

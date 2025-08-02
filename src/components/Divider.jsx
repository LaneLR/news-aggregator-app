'use client';
import styled from "styled-components";

const DividerWrapper = styled.div`
  width: 93%;
  height: 2px;
  border-top: 2px solid #ddd;
  border-radius: 2px;
  margin: 20px 0;
`;

export default function Divider() {
  return (
    <>
      <DividerWrapper />
    </>
  );
}

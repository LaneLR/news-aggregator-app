'use client';
import styled from "styled-components";

const Wrapper = styled.div`
  display: grid;
  column-gap: 30px;
  padding: 20px; 
  max-width: 1300px; 
  margin: 0 auto; 
  background-color: inherit;
  grid-template-columns: repeat(3, 1fr);

  @media (max-width: 1290px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 885px) {
    grid-template-columns: repeat(1, 1fr);
  }
`

export default function NewsGridWrapper({children}){
  return (
    <Wrapper>{children}</Wrapper>
  )
}

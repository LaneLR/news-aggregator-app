'use client'
import styled from "styled-components";

const Wrapper = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: ${(props) => props.theme.primaryContrast};
`;

export default function MainContentWrapper({ children }) {
  return <Wrapper>{children}</Wrapper>;
}

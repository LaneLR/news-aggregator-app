"use client";
import { Suspense } from "react";
import styled from "styled-components";
import Loading from "../loading";
import SideBarNav from "@/components/SideNavBar";

const LayoutRow = styled.div`
  display: flex;
  gap: 15px;
  height: 100%;
  padding: 15px;
  width: 100%;
  box-sizing: border-box;
  background-color: ${(props) => props.theme.layoutBackground};

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Main = styled.main`
  flex-grow: 1;
  min-width: 0;
  width: 100%;
  background-color: ${(props) => props.theme.layoutBackground};
  color: ${(props) => props.theme.text};
`;

export default function AccountLayout({ children }) {
  return (
    <Suspense fallback={<Loading />}>
      <LayoutRow>
        <SideBarNav />
        <Main>{children}</Main>
      </LayoutRow>
    </Suspense>
  );
}

"use client";
import styled from "styled-components";
import NavTab from "./NavTab";

const SideBarNavWrapper = styled.nav`
  width: 200px;
  flex-shrink: 0;
  height: fit-content;
  background-color: ${(props) => props.theme.primary};
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 8px;
  }
`;

export default function SideBarNav() {
  return (
    <SideBarNavWrapper>
      <NavTab href={"/account"}>Manage Account</NavTab>
      <NavTab href={"/account/subscription"}>Subscription</NavTab>
      <NavTab href={"/account/privacy"}>Privacy</NavTab>
      <NavTab href={"/account/payment"}>Payment Details</NavTab>
      <NavTab href={"/archives"}>Archives</NavTab>
    </SideBarNavWrapper>
  );
}

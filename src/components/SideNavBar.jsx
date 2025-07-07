"use client";
import styled from "styled-components";
import NavTab from "./NavTab";

const SideBarNavWrapper = styled.div`
  width: 200px;
  height: 80%;
  margin: 10px;
  background-color: red;
`;

export default function SideBarNav({ href, children }) {
  return (
    <>
      <SideBarNavWrapper>
        <NavTab href={"/account"}>Manage Account</NavTab>
        <NavTab href={"/account/subscription"}>Subscription</NavTab>
        <NavTab href={"/account/privacy"}>Privacy</NavTab>
      </SideBarNavWrapper>
    </>
  );
}

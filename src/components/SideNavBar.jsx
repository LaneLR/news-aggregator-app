"use client";
import styled from "styled-components";
import NavTab from "./NavTab";

const SideBarNavWrapper = styled.div`
  width: 200px;
  height: 100%;
  background-color: ${(props) => props.theme.primary};
  border: 1px solid transparent;
  border-radius: 8px;
`;

export default function SideBarNav({ href, children }) {
  return (
    <>
      <SideBarNavWrapper>
        <div style={{ justifyContent: 'space-evenly'}}>
          <NavTab href={"/account"}>Manage Account</NavTab>
          <NavTab href={"/account/subscription"}>Subscription</NavTab>
          <NavTab href={"/account/privacy"}>Privacy</NavTab>
          <NavTab href={"/account/payment"}>Payment Details</NavTab>
          <NavTab href={"/archives"}>Archives</NavTab>
        </div>
      </SideBarNavWrapper>
    </>
  );
}

"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.background};
  display: flex;
  justify-content: center;
  align-items: center;
  height: auto;
  padding: 10px 15px;
  font-size: 1.2rem;
  color: ${(props) => props.theme.text};
  gap: 25px;
  overflow-x: auto;

  @media (max-width: 1156px) {
    justify-content: left;
  }
`;

const StyledLink = styled(Link)`
  // text-decoration: underline;
`;

const Underline = styled.div`
  border: 1px solid ${(props) => props.theme.text};
`;

export default function HeaderNavBar({ sessionData }) {
  const { data: session, status, update } = useSession({ data: sessionData });

  const isNotSubscribed = session?.user?.tier === "Free";

  return (
    <>
      <Wrapper>
        {isNotSubscribed ? null : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <StyledLink href={"/category/journal"}>Journals</StyledLink>
            {/* <Underline /> */}
          </div>
        )}
        {isNotSubscribed ? null : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <StyledLink href={"/category/market"}>Market</StyledLink>
            {/* <Underline /> */}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/science"}>Science</StyledLink>
          {/* <Underline /> */}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/business"}>Business</StyledLink>
          {/* <Underline /> */}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/health"}>Health</StyledLink>
          {/* <Underline /> */}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/entertainment"}>
            Entertainment
          </StyledLink>
          {/* <Underline /> */}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/tech"}>Tech</StyledLink>
          {/* <Underline /> */}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/politics"}>Politics</StyledLink>
          {/* <Underline /> */}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/sports"}>Sports</StyledLink>
          {/* <Underline /> */}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/world"}>World</StyledLink>
          {/* <Underline /> */}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/us"}>US</StyledLink>
          {/* <Underline /> */}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/finance"}>Finance</StyledLink>
          {/* <Underline /> */}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StyledLink href={"/category/weather"}>Weather</StyledLink>
          {/* <Underline /> */}
        </div>
      </Wrapper>
    </>
  );
}

"use client";
import Link from "next/link";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  align-items: end;
  justify-content: center;
  height: 70px;
  width: 100%;
  background-color: var(--dark-blue);
  color: white;
  font-size: 0.9rem;
`;

const TextContainer = styled.div`
  width: auto;
  gap: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Underline = styled.div`
  margin-top: 2px;
  border-top: 1px solid #fff;
  width: 100%;
`;

export default function Footer() {
  return (
    <Wrapper>
      <TextContainer>
        <p>© 2025</p>
        <p>|</p>
        <div style={{ width: "auto" }}>
          <Link href={"/about"}>Privacy</Link>
          <Underline />
        </div>
        <p> | </p>
        <div style={{ width: "auto" }}>
          <Link href={"/about"}>About us</Link>
          <Underline />
        </div>{" "}
        <p> | </p>
        <div style={{ width: "auto" }}>
          <Link href={"/about"}>Contact us</Link>
          <Underline />
        </div>{" "}
      </TextContainer>
    </Wrapper>
  );
}

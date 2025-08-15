"use client";
import Link from "next/link";
import styled from "styled-components";

const FooterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  color: var(--white);
`;

const LinkWrapper = styled.div`
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

const Disclaimer = styled.p`
  font-size: 0.8rem;
  padding: 0 30px 20px;
  display: flex;
  justify-content: center;
  align-item: center;
  text-align: left;
`;

const Underline = styled.div`
  margin-top: 2px;
  border-top: 1px solid #fff;
  width: 100%;
`;

export default function Footer() {
  return (
    <FooterWrapper>
      <LinkWrapper>
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
          </div>
          <p> | </p>
          <div style={{ width: "auto" }}>
            <Link href={"/about"}>Contact us</Link>
            <Underline />
          </div>
        </TextContainer>
      </LinkWrapper>
      <Disclaimer>
        This site displays publicly available RSS content for informational
        purposes. All articles link to their original publishers and remain the
        intellectual property of their respective owners.
      </Disclaimer>
    </FooterWrapper>
  );
}

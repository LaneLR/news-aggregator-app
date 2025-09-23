"use client";
import Link from "next/link";
import styled from "styled-components";

const FooterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  color: ${(props) => props.theme.text};
`;

const LinkWrapper = styled.div`
  display: flex;
  align-items: end;
  justify-content: center;
  height: 70px;
  width: 100%;
  background: ${(props) => props.theme.cardBackground};
  color: ${(props) => props.theme.text};
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
  border-top: 1px solid ${(props) => props.theme.border};
  width: 100%;
`;

const LinkContainer = styled.div`
  width: auto;
`;

const Paragraph = styled.p``;

export default function Footer() {
  return (
    <FooterWrapper>
      <LinkWrapper>
        <TextContainer>
          <Paragraph>© 2025</Paragraph>
          <Paragraph>|</Paragraph>
          <LinkContainer>
            <Link href={"/privacy"}>Privacy</Link>
            <Underline />
          </LinkContainer>
          <Paragraph> | </Paragraph>
          <LinkContainer>
            <Link href={"/about"}>About us</Link>
            <Underline />
          </LinkContainer>
          <Paragraph> | </Paragraph>
          <LinkContainer>
            <Link href={"/contact-us"}>Contact us</Link>
            <Underline />
          </LinkContainer>
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

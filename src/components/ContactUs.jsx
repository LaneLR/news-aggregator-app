"use client";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  padding: 20px 40px;
  gap: 12px;

  @media (max-width: 440px) {
    padding: 10px 30px;
  }
`;

export default function ContactUsComponent({ contactEmail }) {
  return (
    <Wrapper>
      <h1>Contact Us</h1>
      <p>
        Have a question, found a bug, or want to report an issue with an
        article or feed? We&apos;d love to hear from you.
      </p>
      <p>
        Reach us at{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and
        we&apos;ll get back to you as soon as we can.
      </p>
      <p>
        If your message is about a copyright concern regarding content
        displayed from a third-party source, please include the article URL
        and the publication you represent so we can look into it promptly.
      </p>
    </Wrapper>
  );
}

"use client";
import styled from "styled-components";
import AccordionItem from "./AccordionItem";

const Wrapper = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  text-align: left;
  width: 100%;
  flex-direction: column;
  padding: 20px 40px;
  gap: 8px;

  @media (max-width: 440px) {
    padding: 10px 30px;
  }
`;

export default function AboutRelayNewsPage() {
  return (
    <>
      <Wrapper>
        <AccordionItem
          question="What is Relay News?"

          answer="Relay News is an RSS-powered news aggregator that lets you 
            follow your favorite news sources, read the
            latest headlines, and save articles — all in one personalized
            dashboard. You decide what to follow, and we simply fetch the
            content for you."
        />
        <AccordionItem
          question="Is Relay News free to use?"

          answer="Yes! Relay News is currently free to use.
            We may offer premium features in the future (like enhanced archives
            or advanced search), but the core functionality will always include
            free access to curated news."
        />
        <AccordionItem
          question="What makes Relay News different from other news apps?
"
          answer="Relay News doesn't use an algorithm to
            decide what you see. There's no upvoting, trending scores, or
            clickbait ranking — just direct, real-time content from sources you
            choose. It's fast, focused, and ad-free."
        />
        <AccordionItem
          question="Where does the news come from?"

          answer="All content is fetched directly from the RSS feeds of news websites,
            blogs, and publishers. That means you're seeing the original
            article titles, descriptions, and images — not rewrites or
            summaries."
        />
        <AccordionItem
          question="Can I save articles to read later?"

          answer="Yes! You can archive articles into custom folders to read them later
            or organize them by topic. It's like building your own personal
            library of news."
        />
        <AccordionItem
          question="How often is content updated?"

          answer="RSS feeds are refreshed on a regular schedule (typically every 15–30
            minutes) to ensure your news feed stays up-to-date without putting
            unnecessary load on the source sites."
        />
        <AccordionItem
          question="Do you track what I read or click?"
          
          answer="Nope. Relay News is designed with privacy
            in mind. We don't track your clicks, sell your data, or show
            you targeted ads. What you read is your business."
        />
        <AccordionItem
          question="Is my data secure?"

          answer="Yes. Any saved preferences or archives are tied to your user account
            and stored securely. We do not store or process any sensitive
            personal data like payment information on our servers — if we use
            payment systems like Stripe, they handle that externally."
        />
      </Wrapper>
    </>
  );
}

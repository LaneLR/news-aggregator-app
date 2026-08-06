"use client";

import Link from "next/link";
import styled, { createGlobalStyle, useTheme } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Arial', sans-serif;
  }
  h1, h2, h3, h4 {
    margin: 0;
  }
`;

const HeroSection = styled.div`
  background-color: ${(props) => props.theme.PrimaryDark};
  color: ${(props) => props.theme.TextWhite};
  padding: 50px 5% 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: 640px;
`;

const Headline = styled.h1`
  font-size: 3.5em;
  margin-bottom: 20px;
  line-height: 1.1;
  color: ${(props) => props.theme.TextWhite};
`;

const SubHeadline = styled.p`
  font-size: 1.3em;
  color: ${(props) => props.theme.TextLight};
  margin-bottom: 30px;
`;

const CTAButton = styled(Link)`
  display: inline-block;
  background-color: ${(props) => props.theme.AccentOrange};
  color: ${(props) => props.theme.TextWhite};
  border: none;
  padding: 15px 30px;
  font-size: 1.2em;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => props.theme.AccentHover};
  }
`;

const FeaturesSection = styled.div`
  padding: 60px 5%;
  background-color: ${(props) => props.theme.TextWhite};
  display: flex;
  justify-content: space-around;
  text-align: center;
  gap: 20px;
  flex-wrap: wrap;
`;

const FeatureBlock = styled.div`
  width: 30%;
  min-width: 220px;
  padding: 20px;
  border: 1px solid ${(props) => props.theme.BorderGray};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }

  h3 {
    color: ${(props) => props.theme.PrimaryDark};
    margin-top: 10px;
  }
`;

export default function LandingPage() {
  const theme = useTheme();
  return (
    <>
      <GlobalStyle />
      <HeroSection>
        <HeroContent>
          <Headline>Stay Informed. Your Way.</Headline>
          <SubHeadline>
            Your daily source for News, Journals, & Market Data. Start your
            journey with the solid foundation you need.
          </SubHeadline>
          <CTAButton href="/register">Get Started Free</CTAButton>
          <p
            style={{
              fontSize: "0.9em",
              color: theme.TextLight,
              marginTop: "10px",
            }}
          >
            No credit card required.
          </p>
        </HeroContent>
      </HeroSection>

      <FeaturesSection>
        <FeatureBlock>
          <h3>Curated Feeds</h3>
          <p>
            Tired of noise? We only bring you the most essential articles and
            data streams.
          </p>
        </FeatureBlock>
        <FeatureBlock>
          <h3>Deep Dive Journals</h3>
          <p>
            Access exclusive market analysis and in-depth academic publications.
          </p>
        </FeatureBlock>
        <FeatureBlock>
          <h3>Market Intelligence</h3>
          <p>
            Your trusted lens to spot trends and movements before they become
            headlines.
          </p>
        </FeatureBlock>
      </FeaturesSection>
    </>
  );
}

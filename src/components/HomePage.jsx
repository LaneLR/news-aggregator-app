"use client";
import styled, { useTheme } from "styled-components";
import Button from "./Button";
import Link from "next/link";
import Image from "next/image";
import TierCard from "./TierCard";
import SubscriptionBanner from "./Banner2";
import Banner3 from "./BannerHomePage";

const HomePageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: auto;
  width: 100%;
  min-height: 100vh;
`;

const StyledHomePageSectionOne = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  // Use themed colors for the background and gradient
  background-color: ${(props) => props.theme.secondaryContrast};
  padding: 30px 0;
  gap: 150px;
  background-image: linear-gradient(
    to bottom,
    ${(props) => props.theme.primary},
    ${(props) => props.theme.secondaryContrast}
  );
  @media (max-width: 1210px) {
    gap: 10px;
  }
  @media (max-width: 1520px) {
    padding: 24px 30px 80px 30px;
    flex-direction: column;
    gap: 31px;
  }
  @media (max-width: 440px) {
    padding: 80px 30px;
    flex-direction: column;
    gap: 50px;
  }
`;

const TransitionBox = styled.div`
  // Use themed colors for the background gradient
  background-image: linear-gradient(
    to bottom,
    ${(props) => props.theme.secondaryContrast},
    ${(props) => props.theme.background}
  );
  height: 53px;
  width: 100%;
`;

const StyledHomePageSectionTwo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  // Use themed background color
  background-color: ${(props) => props.theme.background};
  padding: 50px 0;
`;

const StyledHomePageSectionThree = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  // Use themed background color
  background-color: ${(props) => props.theme.background};
  padding: 50px 0;
`;

const SpaceFillerSection = styled.div`
  display: flex;
  flex-grow: 1;
  height: 100%;
  width: 100%;
  // Use themed background color
  background-color: ${(props) => props.theme.background};
`;

const MainHeaderText = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  ${(props) => props.color && `color: ${props.color};`}
`;

const MainHeaderSubText = styled.p`
  text-algin: justify;
  font-size: 1.2rem;
  text-align: center;
  max-width: 600px;
  ${(props) => props.color && `color: ${props.color};`}
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: left;
  line-height: 1.3;
`;

const StyledParagraphLeft = styled.p`
  text-algin: justify;
  font-size: 1.1rem;
  text-align: center;
  max-width: 600px;
  ${(props) => props.color && `color: ${props.color};`}
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: left;
`;

const StyledParagraphRight = styled.p`
  text-algin: justify;
  font-size: 1.1rem;
  text-align: center;
  max-width: 600px;
  ${(props) => props.color && `color: ${props.color};`}
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: right;
  padding: 0 10px;
`;

const StyledParagraphCenter = styled.p`
  text-algin: justify;
  font-size: 1.1rem;
  text-align: center;
  max-width: 600px;
  ${(props) => props.color && `color: ${props.color};`}
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 10px;
`;

const ImageContainer = styled.div`
  display: grid;
  gap: 20px;
  padding: 20px;
  max-width: 1300px;
  margin: 0 auto;
  border-radius: 10px;
  grid-template-columns: repeat(4, 1fr);

  @media (max-width: 1300px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

const ExploreImageContainers = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  max-width: 300px;
  row-gap: 10px;
  margin-bottom: 10px;
`;

const FirstHeaderCTA = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: left;
  width: auto;
  height: 520px;
  padding: 14px;
  column-gap: 20px;
  // Use themed background color
  background-color: ${(props) => props.theme.cardBackground};
  border-radius: 14px;

  @media (max-width: 440px) {
    width: 100%;
    height: 376px;
  }
`;

const HeaderButtonContainer = styled.div`
  display: flex;
  gap: 30px;
  align-items: center;
  @media (max-width: 440px) {
    flex-direction: column;
    width: 100%;
    gap: 18px;
  }
`;

export default function HomePage() {
  const theme = useTheme();

  return (
    <HomePageWrapper>
      <StyledHomePageSectionOne>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <MainHeaderText color={theme.primaryContrast}>
            Stay Informed.
          </MainHeaderText>
          <MainHeaderText color={theme.primaryContrast}>
            Your Way.
          </MainHeaderText>
          <br />
          <MainHeaderSubText color={theme.primaryContrast}>
            {/* Save and discover the latest news from around the web */}
            Find and save all of your favorite news sources, blog posts, science
            journals, and market data and analysis all in one place.*
          </MainHeaderSubText>
          <br />
          {/* <input placeholder="Search articles"/> */}
          <HeaderButtonContainer>
            <Link href={"/register"}>
              <Button
                bgColor={theme.titleContrast}
                clr={theme.primaryContrast}
                wide={"200px"}
              >
                Sign up
              </Button>
            </Link>
            <Link href={"/login"}>
              <Button
                bgColor={theme.titleContrast}
                clr={theme.primaryContrast}
                wide={"200px"}
              >
                Log in
              </Button>
            </Link>
          </HeaderButtonContainer>
        </div>
        <FirstHeaderCTA>
          <Banner3
            title={"Free"}
            features={[
              "Access to articles from hundreds of news sources and blog posts.",
              "3 Archives to save your favorite articles to.",
            ]}
            cost={"Free!"}
          >
            <Button bgColor={theme.titleContrast} clr={theme.primaryContrast}>
              Choose Plan
            </Button>
          </Banner3>
          <Banner3
            title={"Pro"}
            features={[
              "Access to articles from hundreds of news sources and blog posts.",
              "Unlimited number of Archives to save your favorite articles.",
              "Access to journals, daily market data, and podcasts.",
              "Customizable news feed.",
              "Priority support.",
              "Exclusive content and features.",
            ]}
            cost={"$8.99 / mo"}
          >
            <Button bgColor={theme.titleContrast} clr={theme.primaryContrast}>
              Choose Plan
            </Button>
          </Banner3>
          <Banner3
            title={"Pro Annual"}
            features={[
              "Access to articles from hundreds of news sources and blog posts.",
              "Unlimited number of Archives to save your favorite articles.",
              "Access to journals, daily market data, and podcasts.",
              "Customizable news feed.",
              "Priority support.",
              "Exclusive content and features.",
            ]}
            cost={"$79.99 / yr"}
          >
            <Button bgColor={theme.titleContrast} clr={theme.primaryContrast}>
              Choose Plan
            </Button>
          </Banner3>
        </FirstHeaderCTA>
      </StyledHomePageSectionOne>
      <TransitionBox />
      <StyledHomePageSectionTwo>
        <MainHeaderText color={theme.primary}>
          Discover the Latest News
        </MainHeaderText>
        <StyledParagraphCenter>
          <br />
          Explore a wide range of articles from various sources, tailored to
          your interests.
        </StyledParagraphCenter>
        <br />
        <ImageContainer>
          <ExploreImageContainers>
            <Link href={"/login"}>
              <Image
                priority
                height={300}
                width={300}
                src={"/images/tech1.png"}
                alt="Placeholder Image"
                style={{ borderRadius: "14px", objectFit: "cover" }}
              />
            </Link>

            <h3 style={{ color: theme.primary }}>Tech</h3>
            <StyledParagraphLeft>
              Get the latest updates on technology and gadgets.
            </StyledParagraphLeft>
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Link href={"/login"}>
                <Button bgColor={theme.primary} clr={theme.primaryContrast}>
                  Explore Tech News
                </Button>
              </Link>
            </div>
          </ExploreImageContainers>

          <ExploreImageContainers>
            <Link href={"/login"}>
              <Image
                priority
                height={300}
                width={300}
                src={"/images/earth1.png"}
                alt="Placeholder Image"
                style={{ borderRadius: "14px", objectFit: "cover" }}
              />
            </Link>

            <h3 style={{ color: theme.primary }}>World</h3>
            <StyledParagraphLeft>
              Find breaking stories from across the globe.
            </StyledParagraphLeft>
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Link href={"/login"}>
                <Button bgColor={theme.primary} clr={theme.primaryContrast}>
                  Explore World News
                </Button>
              </Link>
            </div>
          </ExploreImageContainers>
          <ExploreImageContainers>
            <Link href={"/login"}>
              <Image
                priority
                height={300}
                width={300}
                src={"/images/band1.png"}
                alt="Placeholder Image"
                style={{ borderRadius: "14px", objectFit: "cover" }}
              />
            </Link>
            <h3 style={{ color: theme.primary }}>Entertainment</h3>
            <StyledParagraphLeft>
              Stay updated on movies, TV shows, and celebrities.
            </StyledParagraphLeft>
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Link href={"/login"}>
                <Button bgColor={theme.primary} clr={theme.primaryContrast}>
                  Explore Entertainment News
                </Button>
              </Link>
            </div>
          </ExploreImageContainers>
          <ExploreImageContainers>
            <Link href={"/login"}>
              <Image
                priority
                height={300}
                width={300}
                src={"/images/weather1.png"}
                alt="Placeholder Image"
                style={{ borderRadius: "14px", objectFit: "cover" }}
              />
            </Link>
            <h3 style={{ color: theme.primary }}>Weather</h3>
            <StyledParagraphLeft>
              Follow developing storms and weather forecasts across the globe.
            </StyledParagraphLeft>
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Link href={"/login"}>
                <Button bgColor={theme.primary} clr={theme.primaryContrast}>
                  Explore Weather News
                </Button>
              </Link>
            </div>
          </ExploreImageContainers>
        </ImageContainer>
      </StyledHomePageSectionTwo>
      <StyledHomePageSectionThree>
        <SubscriptionBanner />
      </StyledHomePageSectionThree>
      <SpaceFillerSection />
      {/* <TierCard title={"Pro"} /> */}
    </HomePageWrapper>
  );
}

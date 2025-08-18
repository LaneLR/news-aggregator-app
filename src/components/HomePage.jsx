"use client";
import styled from "styled-components";
import Button from "./Button";
import Link from "next/link";
import Image from "next/image";
import TierCard from "./TierCard";
import SubscriptionBanner from "./Banner2";
import Banner3 from "./Banner3";

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
  background-color: var(--secondary-blue);
  padding: 30px 0;
  gap: 150px;
  background-image: linear-gradient(
    to bottom,
    var(--dark-blue),
    var(--secondary-blue)
  );
  @media (max-width: 1210px) {
    gap: 10px;
  }
  @media (max-width: 1055px) {
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
  background-image: linear-gradient(
    to bottom,
    var(--secondary-blue),
    var(--white)
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
  background-color: var(--white);
  padding: 50px 0;
`;

const StyledHomePageSectionThree = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: var(--white);
  padding: 50px 0;
`;

const SpaceFillerSection = styled.div`
  display: flex;
  flex-grow: 1;
  height: 100%;
  width: 100%;
  background-color: var(--white);
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
  background-color: var(--white);
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
          <MainHeaderText color={"var(--light-white)"}>
            Stay Informed.
          </MainHeaderText>
          <MainHeaderText color={"var(--light-white)"}>
            Your Way.
          </MainHeaderText>
          <br />
          <MainHeaderSubText color={"var(--light-white)"}>
            {/* Save and discover the latest news from around the web */}
            Find and save all of your favorite news sources, blog posts, science
            journals, and market data and analysis all in one place.*
          </MainHeaderSubText>
          <br />
          {/* <input placeholder="Search articles"/> */}
          <HeaderButtonContainer>
            <Link href={"/register"}>
              <Button
                bgColor={"var(--orange)"}
                clr={"var(--white)"}
                wide={"200px"}
              >
                Sign up
              </Button>
            </Link>
            <Link href={"/login"}>
              <Button
                bgColor={"var(--orange)"}
                clr={"var(--white)"}
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
              "Access to hundreds of news sources and blog posts",
              "3 Archives to save your favorite articles to",
            ]}
            cost={"$0 / mo"}
          />
          <Banner3
            title={"Pro"}
            features={[
              "Access to hundreds of news sources and blog posts",
              "Unlimited number of Archives to save your favorite articles",
              "Access to journals and daily market data",
            ]}
            cost={"$8 / mo"}
          />
          <Banner3
            title={"Pro Annual"}
            features={[
              "Access to hundreds of news sources and blog posts",
              "Unlimited number of Archives to save your favorite articles",
              "Access to journals and hourly market data",
              "Customizable news feed",
              "Priority support",
              "Exclusive content and features",
            ]}
            cost={"$80 / yr"}
          />
        </FirstHeaderCTA>
      </StyledHomePageSectionOne>
      <TransitionBox />
      <StyledHomePageSectionTwo>
        <MainHeaderText color={"var(--deep-blue)"}>
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

            <h3 style={{ color: "var(--dark-blue)" }}>Tech</h3>
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
                <Button bgColor={"var(--primary-blue)"} clr={"var(--white)"}>
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

            <h3 style={{ color: "var(--dark-blue)" }}>World</h3>
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
                <Button bgColor={"var(--primary-blue)"} clr={"var(--white)"}>
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
            <h3 style={{ color: "var(--dark-blue)" }}>Entertainment</h3>
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
                <Button bgColor={"var(--primary-blue)"} clr={"var(--white)"}>
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
            <h3 style={{ color: "var(--dark-blue)" }}>Weather</h3>
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
                <Button bgColor={"var(--primary-blue)"} clr={"var(--white)"}>
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

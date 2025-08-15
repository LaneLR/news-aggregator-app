"use client";
import styled from "styled-components";
import Button from "./Button";
import Link from "next/link";
import Image from "next/image";
import TierCard from "./TierCard";

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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: var(--deep-blue);
  padding: 65px 0;
`;

const StyledHomePageSectionTwo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: var(--white);
  padding: 5% 0;
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
  padding: 0 10px;
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

export default function HomePage() {
  return (
    <HomePageWrapper>
      <StyledHomePageSectionOne>
        <MainHeaderText color={"var(--light-white)"}>
          Stay Informed.
        </MainHeaderText>
        <MainHeaderText color={"var(--light-white)"}>Your Way.</MainHeaderText>
        <br />
        <StyledParagraphCenter color={"var(--light-white)"}>
          {/* Save and discover the latest news from around the web */}
          Find and save all of your favorite news sources in one place
        </StyledParagraphCenter>
        <br />
        {/* <input placeholder="Search articles"/> */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link href={"/register"}>
            <Button bgColor={"var(--primary-blue)"} clr={"var(--white)"}>
              Sign up
            </Button>
          </Link>
          <Link href={"/login"}>
            <Button bgColor={"var(--primary-blue)"} clr={"var(--white)"}>
              Log in
            </Button>
          </Link>
        </div>
      </StyledHomePageSectionOne>
      <StyledHomePageSectionTwo>
        <MainHeaderText color={"var(--deep-blue)"}>Discover the Latest News</MainHeaderText>
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
      <SpaceFillerSection />
      {/* <TierCard title={"Pro"} /> */}
    </HomePageWrapper>
  );
}

"use client";
import styled from "styled-components";
import Button from "./Button";
import Link from "next/link";
import Image from "next/image";

const HomePageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: auto;
  width: 100%;
`;

const StyledHomePageSectionOne = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: #ffefd5;
  padding: 65px 0;
`;

const StyledHomePageSectionTwo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: #fff8e8;
  padding: 5% 0;
`;

const MainHeaderText = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: #333;
  color: #3e2a12;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const StyledParagraphLeft = styled.p`
  font-size: 1.1rem;
  color: #555;
  text-align: center;
  max-width: 600px;
  color: #3e2a12;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: Left;
`;

const StyledParagraphRight = styled.p`
  font-size: 1.1rem;
  color: #555;
  text-align: center;
  max-width: 600px;
  color: #3e2a12;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: right;
`;

const StyledParagraphCenter = styled.p`
  font-size: 1.1rem;
  color: #555;
  text-align: center;
  max-width: 600px;
  color: #3e2a12;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
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
  row-gap: 14px;
`;

export default function HomePage() {
  return (
    <HomePageWrapper>
      <StyledHomePageSectionOne>
        <MainHeaderText>Stay Informed.</MainHeaderText>
        <MainHeaderText>Your Way.</MainHeaderText>
        <br />
        <StyledParagraphCenter>
          Save and discover the latest news from around the web
        </StyledParagraphCenter>
        <br />
        {/* <input placeholder="Search articles"/> */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link href={"/register"}>
            <Button bgColor={"#EE821F"} clr={"#fff"}>
              Sign Up
            </Button>
          </Link>
          <p>or</p>
          <Link href={"/login"}>
            <Button bgColor={"#EE821F"} clr={"#fff"}>
              Log In
            </Button>
          </Link>
        </div>
      </StyledHomePageSectionOne>
      <StyledHomePageSectionTwo>
        <MainHeaderText>Discover the Latest News</MainHeaderText>
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
                height={300}
                width={300}
                src={"/images/tech1.png"}
                alt="Placeholder Image"
                style={{ borderRadius: "14px", objectFit: "cover" }}
              />
            </Link>

            <h3>Tech</h3>
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
                <Button bgColor={"#EE821F"}>Explore Tech News</Button>
              </Link>
            </div>
          </ExploreImageContainers>

          <ExploreImageContainers>
            <Link href={"/login"}>
              <Image
                height={300}
                width={300}
                src={"/images/earth1.png"}
                alt="Placeholder Image"
                style={{ borderRadius: "14px", objectFit: "cover" }}
              />
            </Link>

            <h3>World</h3>
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
                <Button bgColor={"#EE821F"}>Explore World News</Button>
              </Link>
            </div>
          </ExploreImageContainers>
          <ExploreImageContainers>
            <Link href={"/login"}>
              <Image
                height={300}
                width={300}
                src={"/images/band1.png"}
                alt="Placeholder Image"
                style={{ borderRadius: "14px", objectFit: "cover" }}
              />
            </Link>
            <h3>Entertainment</h3>
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
                <Button bgColor={"#EE821F"}>Explore Entertainment News</Button>
              </Link>
            </div>
          </ExploreImageContainers>
          <ExploreImageContainers>
            <Link href={"/login"}>
              <Image
                height={300}
                width={300}
                src={"/images/weather1.png"}
                alt="Placeholder Image"
                style={{ borderRadius: "14px", objectFit: "cover" }}
              />
            </Link>
            <h3>Weather</h3>
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
                <Button bgColor={"#EE821F"}>Explore Weather News</Button>
              </Link>
            </div>
          </ExploreImageContainers>
        </ImageContainer>
      </StyledHomePageSectionTwo>
    </HomePageWrapper>
  );
}

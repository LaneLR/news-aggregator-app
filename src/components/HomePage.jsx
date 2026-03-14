// "use client";
// import styled, { useTheme } from "styled-components";
// import Button from "./Button";
// import Link from "next/link";
// import Image from "next/image";
// import SubscriptionBanner from "./Banner2";
// import Banner3 from "./BannerHomePage";

// const HomePageWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   height: auto;
//   width: 100%;
//   min-height: 100vh;
// `;

// const StyledHomePageSectionOne = styled.div`
//   display: flex;
//   flex-direction: row;
//   justify-content: center;
//   align-items: center;
//   height: 100%;
//   width: 100%;
//   background-color: ${(props) => props.theme.secondaryBlue};
//   padding: 30px 0;
//   gap: 150px;
//   background-image: linear-gradient(
//     to bottom,
//     ${(props) => props.theme.darkBlue},
//     ${(props) => props.theme.secondaryBlue}
//   );
//   @media (max-width: 1210px) {
//     gap: 10px;
//   }
//   @media (max-width: 1520px) {
//     padding: 24px 30px 80px 30px;
//     flex-direction: column;
//     gap: 31px;
//   }
//   @media (max-width: 440px) {
//     padding: 80px 30px;
//     flex-direction: column;
//     gap: 50px;
//   }
// `;

// const TransitionBox = styled.div`
//   background-image: linear-gradient(
//     to bottom,
//     ${(props) => props.theme.secondaryContrast},
//     ${(props) => props.theme.cardBackground}
//   );
//   height: 53px;
//   width: 100%;
// `;

// const StyledHomePageSectionTwo = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   height: 100%;
//   width: 100%;
//   background-color: ${(props) => props.theme.background};
//   padding: 50px 0;
// `;

// const StyledHomePageSectionThree = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   height: 100%;
//   width: 100%;
//   background-color: ${(props) => props.theme.background};
//   padding: 50px 0;
// `;

// const SpaceFillerSection = styled.div`
//   display: flex;
//   flex-grow: 1;
//   height: 100%;
//   width: 100%;
//   background-color: ${(props) => props.theme.background};
// `;

// const MainHeaderText = styled.h1`
//   font-size: 3rem;
//   font-weight: 700;
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   text-align: center;
//   ${(props) => props.color && `color: ${props.color};`}
// `;

// const MainHeaderSubText = styled.p`
//   text-algin: justify;
//   font-size: 1.2rem;
//   text-align: center;
//   max-width: 600px;
//   ${(props) => props.color && `color: ${props.color};`}
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   text-align: left;
//   line-height: 1.3;
// `;

// const StyledParagraphLeft = styled.p`
//   text-algin: justify;
//   font-size: 1.1rem;
//   text-align: center;
//   max-width: 600px;
//   ${(props) => props.color && `color: ${props.color};`}
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   text-align: left;
// `;

// const StyledParagraphRight = styled.p`
//   text-algin: justify;
//   font-size: 1.1rem;
//   text-align: center;
//   max-width: 600px;
//   ${(props) => props.color && `color: ${props.color};`}
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   text-align: right;
//   padding: 0 10px;
// `;

// const StyledParagraphCenter = styled.p`
//   text-algin: justify;
//   font-size: 1.1rem;
//   text-align: center;
//   max-width: 600px;
//   ${(props) => props.color && `color: ${props.color};`}
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   text-align: center;
//   padding: 0 10px;
// `;

// const ImageContainer = styled.div`
//   display: grid;
//   gap: 20px;
//   padding: 20px;
//   max-width: 1300px;
//   margin: 0 auto;
//   border-radius: 10px;
//   grid-template-columns: repeat(4, 1fr);

//   @media (max-width: 1300px) {
//     grid-template-columns: repeat(3, 1fr);
//   }

//   @media (max-width: 1024px) {
//     grid-template-columns: repeat(2, 1fr);
//   }

//   @media (max-width: 768px) {
//     grid-template-columns: repeat(1, 1fr);
//   }
// `;

// const ExploreImageContainers = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: flex-start;
//   height: 100%;
//   width: 100%;
//   max-width: 300px;
//   row-gap: 10px;
//   margin-bottom: 10px;
// `;

// const FirstHeaderCTA = styled.div`
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   text-align: left;
//   width: auto;
//   height: 520px;
//   padding: 14px;
//   column-gap: 20px;
//   background-color: ${(props) => props.theme.background};
//   border-radius: 14px;

//   @media (max-width: 440px) {
//     width: 100%;
//     height: 376px;
//   }
// `;

// const HeaderButtonContainer = styled.div`
//   display: flex;
//   gap: 30px;
//   align-items: center;
//   @media (max-width: 440px) {
//     flex-direction: column;
//     width: 100%;
//     gap: 18px;
//   }
// `;

// export default function HomePage() {
//   const theme = useTheme();

//   return (
//     <HomePageWrapper>
//       <StyledHomePageSectionOne>
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//           }}
//         >
//           <MainHeaderText color={theme.primaryContrast}>
//             Stay Informed.
//           </MainHeaderText>
//           <MainHeaderText color={theme.primaryContrast}>
//             Your Way.
//           </MainHeaderText>
//           <br />
//           <MainHeaderSubText color={theme.primaryContrast}>
//             {/* Save and discover the latest news from around the web */}
//             Find and save all of your favorite news sources, blog posts, science
//             journals, and market data and analysis all in one place.*
//           </MainHeaderSubText>
//           <br />
//           {/* <input placeholder="Search articles"/> */}
//           <HeaderButtonContainer>
//             <Link href={"/register"}>
//               <Button
//                 bgColor={theme.titleContrast}
//                 clr={theme.buttonText}
//                 wide={"200px"}
//               >
//                 Sign up
//               </Button>
//             </Link>
//             <Link href={"/login"}>
//               <Button
//                 bgColor={theme.titleContrast}
//                 clr={theme.buttonText}
//                 wide={"200px"}
//               >
//                 Log in
//               </Button>
//             </Link>
//           </HeaderButtonContainer>
//         </div>
//         <FirstHeaderCTA>
//           <Banner3
//             title={"Free"}
//             features={[
//               "Access to articles from hundreds of news sources and blog posts.",
//               "3 Archives to save your favorite articles to.",
//             ]}
//             cost={"Free!"}
//           >
//             <Button bgColor={theme.titleContrast} clr={theme.buttonText}>
//               Choose Plan
//             </Button>
//           </Banner3>
//           <Banner3
//             title={"Pro"}
//             features={[
//               "Access to articles from hundreds of news sources and blog posts.",
//               "Unlimited number of Archives to save your favorite articles.",
//               "Access to journals, daily market data, and podcasts.",
//               "Customizable news feed.",
//               "Priority support.",
//               "Exclusive content and features.",
//             ]}
//             cost={"$8.99 / mo"}
//           >
//             <Button bgColor={theme.titleContrast} clr={theme.buttonText}>
//               Choose Plan
//             </Button>
//           </Banner3>
//           <Banner3
//             title={"Pro Annual"}
//             features={[
//               "Access to articles from hundreds of news sources and blog posts.",
//               "Unlimited number of Archives to save your favorite articles.",
//               "Access to journals, daily market data, and podcasts.",
//               "Customizable news feed.",
//               "Priority support.",
//               "Exclusive content and features.",
//             ]}
//             cost={"$79.99 / yr"}
//           >
//             <Button bgColor={theme.titleContrast} clr={theme.buttonText}>
//               Choose Plan
//             </Button>
//           </Banner3>
//         </FirstHeaderCTA>
//       </StyledHomePageSectionOne>
//       <TransitionBox />
//       <StyledHomePageSectionTwo>
//         <MainHeaderText color={theme.darkBlue}>
//           Discover the Latest News
//         </MainHeaderText>
//         <StyledParagraphCenter>
//           <br />
//           Explore a wide range of articles from various sources, tailored to
//           your interests.
//         </StyledParagraphCenter>
//         <br />
//         <ImageContainer>
//           <ExploreImageContainers>
//             <Link href={"/login"}>
//               <Image
//                 priority
//                 height={300}
//                 width={300}
//                 src={"/images/tech1.png"}
//                 alt="Placeholder Image"
//                 style={{ borderRadius: "14px", objectFit: "cover" }}
//               />
//             </Link>

//             <h3 style={{ color: theme.darkBlue }}>Tech</h3>
//             <StyledParagraphLeft>
//               Get the latest updates on technology and gadgets.
//             </StyledParagraphLeft>
//             <div
//               style={{
//                 display: "flex",
//                 width: "100%",
//                 justifyContent: "center",
//                 alignItems: "center",
//               }}
//             >
//               <Link href={"/login"}>
//                 <Button bgColor={theme.titleContrast} clr={theme.buttonText}>
//                   Explore Tech News
//                 </Button>
//               </Link>
//             </div>
//           </ExploreImageContainers>

//           <ExploreImageContainers>
//             <Link href={"/login"}>
//               <Image
//                 priority
//                 height={300}
//                 width={300}
//                 src={"/images/earth1.png"}
//                 alt="Placeholder Image"
//                 style={{ borderRadius: "14px", objectFit: "cover" }}
//               />
//             </Link>

//             <h3 style={{ color: theme.darkBlue }}>World</h3>
//             <StyledParagraphLeft>
//               Find breaking stories from across the globe.
//             </StyledParagraphLeft>
//             <div
//               style={{
//                 display: "flex",
//                 width: "100%",
//                 justifyContent: "center",
//                 alignItems: "center",
//               }}
//             >
//               <Link href={"/login"}>
//                 <Button bgColor={theme.titleContrast} clr={theme.buttonText}>
//                   Explore World News
//                 </Button>
//               </Link>
//             </div>
//           </ExploreImageContainers>
//           <ExploreImageContainers>
//             <Link href={"/login"}>
//               <Image
//                 priority
//                 height={300}
//                 width={300}
//                 src={"/images/band1.png"}
//                 alt="Placeholder Image"
//                 style={{ borderRadius: "14px", objectFit: "cover" }}
//               />
//             </Link>
//             <h3 style={{ color: theme.darkBlue }}>Entertainment</h3>
//             <StyledParagraphLeft>
//               Stay updated on movies, TV shows, and celebrities.
//             </StyledParagraphLeft>
//             <div
//               style={{
//                 display: "flex",
//                 width: "100%",
//                 justifyContent: "center",
//                 alignItems: "center",
//               }}
//             >
//               <Link href={"/login"}>
//                 <Button bgColor={theme.titleContrast} clr={theme.buttonText}>
//                   Explore Entertainment News
//                 </Button>
//               </Link>
//             </div>
//           </ExploreImageContainers>
//           <ExploreImageContainers>
//             <Link href={"/login"}>
//               <Image
//                 priority
//                 height={300}
//                 width={300}
//                 src={"/images/weather1.png"}
//                 alt="Placeholder Image"
//                 style={{ borderRadius: "14px", objectFit: "cover" }}
//               />
//             </Link>
//             <h3 style={{ color: theme.darkBlue }}>Weather</h3>
//             <StyledParagraphLeft>
//               Follow developing storms and weather forecasts across the globe.
//             </StyledParagraphLeft>
//             <div
//               style={{
//                 display: "flex",
//                 width: "100%",
//                 justifyContent: "center",
//                 alignItems: "center",
//               }}
//             >
//               <Link href={"/login"}>
//                 <Button bgColor={theme.titleContrast} clr={theme.buttonText}>
//                   Explore Weather News
//                 </Button>
//               </Link>
//             </div>
//           </ExploreImageContainers>
//         </ImageContainer>
//       </StyledHomePageSectionTwo>
//       <StyledHomePageSectionThree>
//         <SubscriptionBanner />
//       </StyledHomePageSectionThree>
//       <SpaceFillerSection />
//       {/* <TierCard title={"Pro"} /> */}
//     </HomePageWrapper>
//   );
// }

"use client";

import Image from "next/image";
import React from "react";
import styled, { createGlobalStyle, useTheme } from "styled-components";

// const props.COLORS = {
//   PrimaryDark: "#1A2333",
//   AccentOrange: "#FF7A00",
//   AccentHover: "#E66F00",
//   TextLight: "#E0E0E0",
//   TextWhite: "#FFFFFF",
//   SectionGray: "#F7F7F7",
//   BorderGray: "#CCCCCC",
// };

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Arial', sans-serif;
    color: ${(props) => props.theme.TextLight};
    background-color: ${(props) => props.theme.TextWhite};
  }
  h1, h2, h3, h4 {
    color: ${(props) => props.theme.TextWhite};
    margin: 0;
  }
`;

const Header = styled.header`
  background-color: ${(props) => props.theme.PrimaryDark};
  color: ${(props) => props.theme.TextWhite};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 5%;
  font-size: 1.1em;
`;

const Logo = styled.div`
  font-size: 1.5em;
  font-weight: bold;
  color: ${(props) => props.theme.TextWhite};
`;

const NavLink = styled.a`
  color: ${(props) => props.theme.TextWhite};
  text-decoration: none;
  margin-left: 20px;
  &:hover {
    color: ${(props) => props.theme.AccentOrange};
  }
`;

const HeroSection = styled.div`
  background-color: ${(props) => props.theme.PrimaryDark};
  color: ${(props) => props.theme.TextWhite};
  padding: 50px 5% 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Use a subtle background image or overlay similar to the design */
  // background-image: url("/images/morningfeeds-logo1.png");
  background-size: cover;
  background-position: center;
`;

const HeroContent = styled.div`
  max-width: 50%;
`;

const HeroImage = styled.div`
  width: 40%;
  /* This is where your image placeholder or graphic goes */
`;

const Headline = styled.h1`
  font-size: 3.5em;
  margin-bottom: 20px;
  line-height: 1.1;
`;

const SubHeadline = styled.p`
  font-size: 1.3em;
  color: ${(props) => props.theme.TextLight};
  margin-bottom: 30px;
`;

const CTAButton = styled.button`
  background-color: ${(props) => props.theme.AccentOrange};
  color: ${(props) => props.theme.TextWhite};
  border: none;
  padding: 15px 30px;
  font-size: 1.2em;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
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
`;

const FeaturesSectionBlack = styled.div`
  padding: 60px 5%;
  background-color: ${(props) => props.theme.PrimaryDark};
  display: flex;
  justify-content: space-around;
  text-align: center;
`;

const FeaturesSectionWhite = styled.div`
  padding: 60px 5%;
  background-color: ${(props) => props.theme.TextWhite};
  display: flex;
  justify-content: space-around;
  text-align: center;
`;

const FeatureBlock = styled.div`
  width: 30%;
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

const Footer = styled.footer`
  background-color: ${(props) => props.theme.PrimaryDark};
  color: ${(props) => props.theme.TextLight};
  padding: 40px 5%;
  text-align: center;
  border-top: 5px solid ${(props) => props.theme.AccentOrange};
`;

export default function LandingPage({}) {
  const theme = useTheme();
  return (
    <>
      <HeroSection>
        <HeroContent>
          <Headline>Stay Informed. Your Way.</Headline>
          <SubHeadline>
            Your daily source for News, Journals, & Market Data. Start your
            journey with the solid foundation you need.
          </SubHeadline>
          <CTAButton>Start Free Trial</CTAButton>
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
        <HeroImage>
          {/* <Image fill src={"/images/morningfeeds-logo1.png"} alt={"image"}/> */}
        </HeroImage>
      </HeroSection>

      <FeaturesSection>
        <FeatureBlock>
          {/* Placeholder Icon */}
          <h3>Curated Feeds</h3>
          <p>
            Tired of noise? We only bring you the most essential articles and
            data streams.
          </p>
        </FeatureBlock>
        <FeatureBlock>
          {/* Placeholder Icon */}
          <h3>Deep Dive Journals</h3>
          <p>
            Access exclusive market analysis and in-depth academic publications.
          </p>
        </FeatureBlock>
        <FeatureBlock>
          {/* Placeholder Icon */}
          <h3>Market Intelligence</h3>
          <p>
            Your trusted lens to spot trends and movements before they become
            headlines.
          </p>
        </FeatureBlock>
      </FeaturesSection>

      <FeaturesSectionWhite></FeaturesSectionWhite>

      {/* <FeaturesSection>
        <FeatureBlock>
          <h3>Curated Feeds</h3>
          <p>
            Tired of noise? We only bring you the most essential articles and
            data streams.
          </p>
        </FeatureBlock>
        <FeatureBlock>
          Placeholder Icon
          <h3>Deep Dive Journals</h3>
          <p>
            Access exclusive market analysis and in-depth academic publications.
          </p>
        </FeatureBlock>
        <FeatureBlock>
          Placeholder Icon
          <h3>Market Intelligence</h3>
          <p>
            Your trusted lens to spot trends and movements before they become
            headlines.
          </p>
        </FeatureBlock>
      </FeaturesSection> */}

      {/* 4. REMAINING SECTIONS (Testimonials, Articles, Sign-up Block) */}
      {/* ... (These would be similar styled components for structure and layout) ... */}

      {/* 5. FOOTER */}
    </>
  );
}

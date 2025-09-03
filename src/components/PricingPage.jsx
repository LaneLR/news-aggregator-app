"use client";

import { useState, useEffect } from "react";
import BannerHomePage from "@/components/BannerHomePage";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";
import SubscribeButton from "@/components/SubscribeButton";
import { useSession } from "next-auth/react";
import ResumeSubscriptionButton from "./ResumeSubscriptionButton";
import styled from "styled-components";
import Loading from "@/app/loading";
import ManageSubscriptionButton from "./ManageSubscriptionButton";

const SmallTextBottom = styled.div`
  font-size: 0.95rem;
  color: var(--light-white);
  margin-left: -3px;
  padding-bottom: 3px;
`;

const SmallTextTop = styled.div`
  font-size: 0.95rem;
  color: var(--light-white);
  // margin-left: -3px;
  padding-bottom: 10px;
`;

const PriceText = styled.span`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  font-weight: 500;
`;

const ButtonWrapper = styled.div`
  padding: 10px 15px;
  font-size: 1rem;
  border-radius: 5px;
  border: none;
  font-weight: 600;
  background-color: #757575;
  user-select: none;
`;

const PromoCodeWrapper = styled.div`
display: flex;
justify-content: left:
align-items: center;
flex-direction: row;
`

const PromoCodeText = styled.div`
  font-size: 0.9rem;
  padding: 10px 0 0 0;
  text-align: left;
  width: 100%;
`;

const PromotionCode = styled.div`
  font-weight: 600;
`;

export default function PricingPageComponent({ sessionData }) {
  const { data: session, status, update } = useSession({ data: sessionData });

  useEffect(() => {
    const interval = setInterval(() => update(), 1000 * 60 * 5); // Refreshes every 5 minutes
    return () => clearInterval(interval);
  }, [update]);

  const stripeSubscriptionStatus = session?.user?.stripeSubscriptionStatus;
  const stripeSubscriptionEndsAt = session?.user?.stripeSubscriptionEndsAt;
  const isSubscriptionActive =
    session?.user?.stripeSubscriptionStatus === "active";
  const isCancellationScheduled = !!session?.user?.stripeSubscriptionEndsAt;

  const userIsFreeTier = session?.user?.tier === "Free";
  const userHasProSubscription = session?.user?.tier === "Pro";
  const userHasProAnnualSubscription = session?.user?.tier === "Pro Annual";

  const annualSubscripton = "price_1Ry0oNFlSQA8kdoEdZzVvegu";
  const monthSubscription = "price_1Ry0mKFlSQA8kdoEj98uKzPj";
  const daySubscription = "price_1RyeGSFlSQA8kdoEl5aQc8hK";

  const one = 1;

  if (status === "loading") {
    return <Loading />;
  }

  return (
    <>
      <>
        {(session?.user?.tier === "Pro" ||
          session?.user?.tier === "Pro Annual") && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {isCancellationScheduled ? (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexDirection: "column",
                }}
              >
                <p>Cancel or manage your subscription</p>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <ResumeSubscriptionButton updateSession={update} />
                  <ManageSubscriptionButton />
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexDirection: "column",
                }}
              >
                <p>Cancel or manage your subscription</p>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <CancelSubscriptionButton
                    updateSession={update}
                    subscriptionEndDate={stripeSubscriptionEndsAt}
                  />
                  <ManageSubscriptionButton />
                </div>
              </div>
            )}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "flex-start",
            margin: "auto",
            gap: "50px",
            padding: "50px",
          }}
        >
          <BannerHomePage
            title={"Pro"}
            features={[
              "Access to articles from hundreds of news sources and blog posts.",
              "Unlimited number of Archives to save your favorite articles.",
              "Access to journals, daily market data, and podcasts.",
              "Customizable news feed.",
              "Priority support.",
              "Exclusive content and features.",
            ]}
            cost={
              <PriceText>
                {"$8"}
                <SmallTextBottom>.99 / mo</SmallTextBottom>
              </PriceText>
            }
          >
            {userHasProSubscription || userHasProAnnualSubscription ? (
              <ButtonWrapper>Subscribe</ButtonWrapper>
            ) : (
              <SubscribeButton
                bgColor={"var(--orange)"}
                clr={"var(--white)"}
                priceId={monthSubscription}
                updateSession={update}
              >
                Subscribe
              </SubscribeButton>
            )}
          </BannerHomePage>
          <BannerHomePage
            title={"Pro Annual"}
            features={[
              "Access to articles from hundreds of news sources and blog posts.",
              "Unlimited number of Archives to save your favorite articles.",
              "Access to journals, daily market data, and podcasts.",
              "Customizable news feed.",
              "Priority support.",
              "Exclusive content and features.",
            ]}
            cost={
              <PriceText>
                {"$79"}
                <SmallTextBottom>.99 / yr</SmallTextBottom>
              </PriceText>
            }
            // promoCode={<PromoCodeWrapper><PromoCodeText>"Use code"<PromoCodeText></PromoCodeText>ABCDE<PromotionCode>a</PromotionCode></PromoCodeText></PromoCodeWrapper>}
          >
            {userHasProSubscription || userHasProAnnualSubscription ? (
              <ButtonWrapper>Subscribe</ButtonWrapper>
            ) : (
              <SubscribeButton
                bgColor={"var(--orange)"}
                clr={"var(--white)"}
                priceId={annualSubscripton}
                updateSession={update}
              >
                Subscribe
              </SubscribeButton>
            )}
          </BannerHomePage>
        </div>
      </>
    </>
  );
}

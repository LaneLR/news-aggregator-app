"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import styled, { useTheme } from "styled-components";
import Button from "./Button";
import Loading from "@/app/loading";
import { MONTHLY_PRICE_ID, ANNUAL_PRICE_ID } from "@/lib/stripePrices";

const PricingWrapper = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Headline = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: ${(props) => props.theme.text};
`;

const Subheadline = styled.p`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
  max-width: 600px;
  margin: 0.5rem auto 0;
`;

const IntervalToggle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin: 1.5rem 0 2.5rem;
`;

const ToggleOption = styled.button`
  padding: 8px 18px;
  border-radius: 20px;
  border: 2px solid ${(props) => props.theme.border};
  background: ${(props) =>
    props.$active ? props.theme.primary : props.theme.background};
  color: ${(props) => (props.$active ? props.theme.buttonText : props.theme.text)};
  font-weight: 600;
  cursor: pointer;
`;

const SavingsBadge = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${(props) => props.theme.success};
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  align-items: stretch;
`;

const PricingCard = styled.div`
  background: ${(props) => props.theme.background};
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  border: 2px solid ${(props) => props.theme.border};
  display: flex;
  flex-direction: column;
  height: 100%;
  color: ${(props) => props.theme.darkBlue};
  ${(props) =>
    props.$highlighted &&
    `
    border-color: ${props.theme.primary};
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  `}
`;

const PlanName = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
`;

const Price = styled.p`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0.5rem 0;
  color: ${(props) => props.theme.darkBlue};

  span {
    font-size: 1rem;
    font-weight: 400;
    color: ${(props) => props.theme.textSecondary};
  }
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  text-align: left;
  flex-grow: 1;

  li {
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
  }

  span {
    margin-right: 10px;
  }
`;

const ReferralWrapper = styled.div`
  max-width: 500px;
  margin: 0 auto 3rem;
  text-align: center;
`;
const ReferralInputContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 1rem;
`;
const ReferralMessage = styled.p`
  margin-top: 0.5rem;
  font-weight: 500;
  color: ${(props) => (props.type === "success" ? props.theme.success : props.theme.darkBlue)};
`;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

const FREE_FEATURES = [
  { included: true, text: "Articles from hundreds of news sources and blogs" },
  { included: true, text: "Unlimited archives to save your favorite articles" },
  { included: false, text: "Market, Finance & Journal coverage" },
  { included: false, text: "Custom feeds built from your own sources" },
  { included: false, text: "Referral discounts on future billing" },
];

const SUBSCRIBED_FEATURES = [
  { included: true, text: "Everything in Free" },
  { included: true, text: "Full Market, Finance & Journal coverage" },
  { included: true, text: "Create and customize your own news feeds" },
  { included: true, text: "Earn referral credit when friends subscribe" },
];

export default function PricingPage({ sessionData }) {
  const { data: session, status, update } = useSession({ data: sessionData });
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [referralCode, setReferralCode] = useState("");
  const [promotionCodeId, setPromotionCodeId] = useState(null);
  const [referralMessage, setReferralMessage] = useState({
    type: "",
    text: "",
  });
  const theme = useTheme();

  const userTier = session?.user?.tier;
  const selectedPriceId =
    billingInterval === "annual" ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;

  if (status === "loading") {
    return <Loading />;
  }

  const handleApplyReferral = async () => {
    setIsLoading(true);
    setReferralMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPromotionCodeId(data.promotionCodeId);
      setReferralMessage({
        type: "success",
        text: "Success! Discount has been applied.",
      });
    } catch (err) {
      setPromotionCodeId(null);
      setReferralMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPriceId,
          referralCode,
          promotionCodeId,
        }),
      });
      const { sessionId, error } = await res.json();
      if (error) throw new Error(error);
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId });
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      setIsLoading(false);
    }
  };

  const handleManage = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/manage-subscription", {
        method: "POST",
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Error: Could not manage subscription.");
    } finally {
      setIsLoading(false);
      update();
    }
  };

  const renderSubscribedButton = () => {
    if (userTier === "Subscribed") {
      return (
        <Button
          onClick={handleManage}
          disabled={isLoading}
          bgColor={theme.primary}
          clr={theme.buttonText}
        >
          Manage Subscription
        </Button>
      );
    }
    return (
      <Button
        onClick={handleSubscribe}
        disabled={isLoading}
        bgColor={theme.primary}
        clr={theme.buttonText}
      >
        Subscribe
      </Button>
    );
  };

  return (
    <PricingWrapper>
      <Header>
        <Headline>Unlock Your Personalized News Experience</Headline>
        <Subheadline>
          Subscribe for full Market, Finance & Journal coverage, custom feeds
          built from your own sources, and referral credit toward future
          bills.
        </Subheadline>
      </Header>

      <IntervalToggle>
        <ToggleOption
          type="button"
          $active={billingInterval === "monthly"}
          onClick={() => setBillingInterval("monthly")}
        >
          Monthly
        </ToggleOption>
        <ToggleOption
          type="button"
          $active={billingInterval === "annual"}
          onClick={() => setBillingInterval("annual")}
        >
          Annual <SavingsBadge>Save ~26%</SavingsBadge>
        </ToggleOption>
      </IntervalToggle>

      {userTier === "Free" && (
        <ReferralWrapper>
          <h4>Have a referral code?</h4>
          <ReferralInputContainer>
            <input
              type="text"
              placeholder="Enter code here"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              disabled={!!promotionCodeId}
              style={{ flexGrow: 1, padding: "10px", borderRadius: "6px" }}
            />
            <Button
              onClick={handleApplyReferral}
              disabled={isLoading || !!promotionCodeId}
            >
              {promotionCodeId ? "Applied!" : "Apply"}
            </Button>
          </ReferralInputContainer>
          {referralMessage.text && (
            <ReferralMessage type={referralMessage.type}>
              {referralMessage.text}
            </ReferralMessage>
          )}
        </ReferralWrapper>
      )}

      <PricingGrid>
        <PricingCard>
          <PlanName>Free</PlanName>
          <Price>
            $0 <span>/ month</span>
          </Price>
          <FeatureList>
            {FREE_FEATURES.map((feature) => (
              <li key={feature.text}>
                <span
                  style={{
                    color: feature.included ? theme.primary : theme.warning,
                    fontSize: "1.5rem",
                  }}
                >
                  {feature.included ? "✔" : "✖"}
                </span>
                <p>{feature.text}</p>
              </li>
            ))}
          </FeatureList>
          <Button disabled>
            {userTier === "Free" ? "Your Current Plan" : "Free Plan"}
          </Button>
        </PricingCard>

        <PricingCard $highlighted>
          <PlanName>Subscribed</PlanName>
          <Price>
            {billingInterval === "annual" ? (
              <>
                $79.99 <span>/ year</span>
              </>
            ) : (
              <>
                $8.99 <span>/ month</span>
              </>
            )}
          </Price>
          <FeatureList>
            {SUBSCRIBED_FEATURES.map((feature) => (
              <li key={feature.text}>
                <span style={{ color: theme.primary, fontSize: "1.5rem" }}>
                  ✔
                </span>
                <p>{feature.text}</p>
              </li>
            ))}
          </FeatureList>
          {renderSubscribedButton()}
        </PricingCard>
      </PricingGrid>
    </PricingWrapper>
  );
}

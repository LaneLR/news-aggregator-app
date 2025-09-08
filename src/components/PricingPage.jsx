"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import styled from "styled-components";
import Button from "./Button";
import Loading from "@/app/loading";

const PricingWrapper = styled.div`
  max-width: 1100px;
  margin: 2rem auto;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Headline = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: var(--dark-blue);
`;

const Subheadline = styled.p`
  font-size: 1.2rem;
  color: #555;
  max-width: 600px;
  margin: 0.5rem auto 0;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  align-items: center;
`;

const PricingCard = styled.div`
  background: var(--white);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  border: 2px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--dark-blue);
  ${(props) =>
    props.$highlighted &&
    `
    border-color: var(--primary-blue);
    transform: scale(1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    padding-top: 12px;
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
  color: var(--dark-blue);

  span {
    font-size: 1rem;
    font-weight: 400;
    color: #666;
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
  color: ${(props) => (props.type === "success" ? "#28a745" : "#dc3545")};
`;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);
const MONTHLY_PRICE_ID = "price_1Ry0mKFlSQA8kdoEj98uKzPj";
const ANNUAL_PRICE_ID = "price_1Ry0oNFlSQA8kdoEdZzVvegu";

export default function PricingPage({ sessionData }) {
  const { data: session, status, update } = useSession({ data: sessionData });
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [promotionCodeId, setPromotionCodeId] = useState(null);
  const [referralMessage, setReferralMessage] = useState({
    type: "",
    text: "",
  });
  const userTier = session?.user?.tier;

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

  const handleSubscribe = async (priceId) => {
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, referralCode, promotionCodeId }),
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

  const renderButton = (planTier, priceId) => {
    // Already subscribed to this plan
    if (userTier === planTier) {
      return (
        <>
          <div>
            <input
              type="text"
              placeholder="Referral Code (Optional)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              style={{ padding: "8px", marginRight: "10px" }}
            />
            <Button onClick={() => handleSubscribe(YOUR_PRICE_ID)}>
              Subscribe
            </Button>
          </div>
          <Button onClick={handleManage} disabled={isLoading}>
            Manage Subscription
          </Button>{" "}
        </>
      );
    }
    // Free user looking to upgrade
    if (userTier === "Free") {
      return (
        <Button
          onClick={() => handleSubscribe(priceId)}
          disabled={isLoading}
          bgColor="var(--primary-blue)"
          clr="white"
        >
          Upgrade to Pro
        </Button>
      );
    }
    // Already subscribed, wants to switch plans (handled by portal)
    return (
      <Button onClick={handleManage} disabled={isLoading}>
        Switch Plan
      </Button>
    );
  };

  return (
    <PricingWrapper>
      <Header>
        <Headline>Unlock Your Personalized News Experience</Headline>
        <Subheadline>
          Go Pro to create custom feeds, save unlimited articles, and enjoy an
          ad-free experience.
        </Subheadline>
      </Header>

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
        {/* Free Plan */}
        <PricingCard>
          <PlanName>Free</PlanName>
          <Price>
            $0 <span>/ month</span>
          </Price>
          <FeatureList>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>
                Access to articles from hundreds of news sources and blog posts
              </p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>Unlimited number of Archives to save your favorite articles</p>
            </li>
            <li>
              <span style={{ color: "#e20000ff", fontSize: "1.5rem" }}>✖</span>
              <p>Access to journals, daily market data, and podcasts</p>
            </li>
            <li>
              <span style={{ color: "#e20000ff", fontSize: "1.5rem" }}>✖</span>
              <p> Create and customize your own news feeds</p>
            </li>
            <li>
              <span style={{ color: "#e20000ff", fontSize: "1.5rem" }}>✖</span>
              <p>Priority support</p>
            </li>
            <li>
              <span style={{ color: "#e20000ff", fontSize: "1.5rem" }}>✖</span>
              <p>Exclusive content and features</p>
            </li>
          </FeatureList>
          {userTier === "Free" ? (
            <Button disabled>Your Current Plan</Button>
          ) : (
            <Button disabled>Free Plan</Button> // Or a 'downgrade' button handled in Stripe portal
          )}
        </PricingCard>

        {/* Pro Monthly Plan */}
        <PricingCard>
          <PlanName>Pro</PlanName>
          <Price>
            $8.99 <span>/ month</span>
          </Price>
          <FeatureList>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>
                Access to articles from hundreds of news sources and blog posts
              </p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>Unlimited number of Archives to save your favorite articles</p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>Access to journals, daily market data, and podcasts</p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p> Create and customize your own news feeds</p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>Priority support</p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>Exclusive content and features</p>
            </li>
          </FeatureList>
          {renderButton("Pro", MONTHLY_PRICE_ID)}
        </PricingCard>

        {/* Pro Annual Plan */}
        <PricingCard $highlighted>
          <span
            style={{
              color: "var(--primary-blue)",
              fontWeight: "800",
              fontSize: "2rem",
            }}
          >
            BEST VALUE
          </span>
          <PlanName>Pro Annual</PlanName>
          <Price>
            $79.99 <span>/ year</span>
          </Price>
          <FeatureList>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>
                Access to articles from hundreds of news sources and blog posts
              </p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>Unlimited number of Archives to save your favorite articles</p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>Access to journals, daily market data, and podcasts</p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p> Create and customize your own news feeds</p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>Priority support</p>
            </li>
            <li>
              <span
                style={{ color: "var(--primary-blue)", fontSize: "1.5rem" }}
              >
                ✔
              </span>
              <p>Exclusive content and features</p>
            </li>
          </FeatureList>
          {renderButton("Pro Annual", ANNUAL_PRICE_ID)}
        </PricingCard>
      </PricingGrid>
    </PricingWrapper>
  );
}

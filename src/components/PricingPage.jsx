"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import { Sparkles, Check, X, Gift } from "lucide-react";
import Button from "./Button";
import Loading from "@/app/loading";
import { MONTHLY_PRICE_ID, ANNUAL_PRICE_ID } from "@/lib/stripePrices";
import { useToast } from "./ToastProvider";
import styles from "./PricingPage.module.scss";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

const FREE_FEATURES = [
  { included: true, text: "Articles from hundreds of news sources and blogs" },
  { included: true, text: "Unlimited archives to save your favorite articles" },
  { included: false, text: "Market, Finance & Journal coverage" },
  { included: false, text: "Custom feeds built from your own sources" },
  { included: false, text: '"For You" recommendations based on your reading habits' },
  { included: false, text: "Referral discounts on future billing" },
];

const SUBSCRIBED_FEATURES = [
  { included: true, text: "Everything in Free" },
  { included: true, text: "Full Market, Finance & Journal coverage" },
  { included: true, text: "Create and customize your own news feeds" },
  { included: true, text: '"For You" recommendations based on your reading habits' },
  { included: true, text: "Earn referral credit when friends subscribe" },
];

export default function PricingPage() {
  const { data: session, status, update } = useSession();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [referralCode, setReferralCode] = useState("");
  const [promotionCodeId, setPromotionCodeId] = useState(null);
  const [referralMessage, setReferralMessage] = useState({
    type: "",
    text: "",
  });

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
      toast.error(err.message || "Something went wrong starting checkout.");
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
      toast.error("Could not open the subscription management page. Please try again.");
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
          bgColor={"var(--theme-primary)"}
          clr={"var(--theme-primary-contrast)"}
          wide={"100%"}
        >
          Manage Subscription
        </Button>
      );
    }
    return (
      <Button
        onClick={handleSubscribe}
        disabled={isLoading}
        bgColor={"var(--theme-primary)"}
        clr={"var(--theme-primary-contrast)"}
        wide={"100%"}
      >
        Subscribe
      </Button>
    );
  };

  return (
    <div className={styles.pricingWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageTitle} headline`}>
          <Sparkles size={26} strokeWidth={2} />
          Simple, Transparent Pricing
        </h1>
        <p className={styles.pageSubtitle}>
          Subscribe for full Market, Finance &amp; Journal coverage, custom
          feeds built from your own sources, a &quot;For You&quot; feed that
          learns what you like, and referral credit toward future bills.
        </p>
      </div>

      <div className={styles.intervalToggle}>
        <button
          type="button"
          className={`${styles.toggleOption} ${billingInterval === "monthly" ? styles.active : ""}`}
          onClick={() => setBillingInterval("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`${styles.toggleOption} ${billingInterval === "annual" ? styles.active : ""}`}
          onClick={() => setBillingInterval("annual")}
        >
          Annual <span className={styles.savingsBadge}>Save ~26%</span>
        </button>
      </div>

      {userTier === "Free" && (
        <div className={styles.referralCard}>
          <h4 className={styles.referralTitle}>
            <Gift size={16} strokeWidth={2} />
            Have a referral code?
          </h4>
          <div className={styles.referralInputContainer}>
            <input
              className={styles.referralInput}
              type="text"
              placeholder="Enter code here"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              disabled={!!promotionCodeId}
            />
            <Button
              onClick={handleApplyReferral}
              disabled={isLoading || !!promotionCodeId}
              bgColor={"var(--theme-primary)"}
              clr={"var(--theme-primary-contrast)"}
            >
              {promotionCodeId ? "Applied!" : "Apply"}
            </Button>
          </div>
          {referralMessage.text && (
            <p
              className={`${styles.referralMessage} ${referralMessage.type === "success" ? styles.success : ""}`}
            >
              {referralMessage.text}
            </p>
          )}
        </div>
      )}

      <div className={styles.pricingGrid}>
        <div className={styles.pricingCard}>
          <h2 className={styles.planName}>Free</h2>
          <p className={styles.price}>
            $0 <span>/ month</span>
          </p>
          <ul className={styles.featureList}>
            {FREE_FEATURES.map((feature) => (
              <li key={feature.text}>
                <span
                  className={`${styles.featureIcon} ${feature.included ? styles.included : styles.excluded}`}
                >
                  {feature.included ? (
                    <Check size={13} strokeWidth={3} />
                  ) : (
                    <X size={13} strokeWidth={3} />
                  )}
                </span>
                <p>{feature.text}</p>
              </li>
            ))}
          </ul>
          <Button
            disabled
            bgColor={"var(--theme-layout-background)"}
            clr={"var(--theme-text-secondary)"}
            wide={"100%"}
          >
            {userTier === "Free" ? "Your Current Plan" : "Free Plan"}
          </Button>
        </div>

        <div className={`${styles.pricingCard} ${styles.highlighted}`}>
          <span className={styles.popularBadge}>Most Popular</span>
          <h2 className={styles.planName}>Subscribed</h2>
          <p className={styles.price}>
            {billingInterval === "annual" ? (
              <>
                $79.99 <span>/ year</span>
              </>
            ) : (
              <>
                $8.99 <span>/ month</span>
              </>
            )}
          </p>
          <ul className={styles.featureList}>
            {SUBSCRIBED_FEATURES.map((feature) => (
              <li key={feature.text}>
                <span className={`${styles.featureIcon} ${styles.included}`}>
                  <Check size={13} strokeWidth={3} />
                </span>
                <p>{feature.text}</p>
              </li>
            ))}
          </ul>
          {renderSubscribedButton()}
        </div>
      </div>
    </div>
  );
}

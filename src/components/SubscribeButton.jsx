// src/components/SubscribeButton.js
"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import Button from "./Button";
import { useSession } from "next-auth/react";
import { useTheme } from "styled-components";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function SubscribeButton({
  priceId,
  clr,
  bgColor,
  sessionData,
}) {
  const { data: session, update: updateSession } = useSession({
    data: sessionData,
  });
  const theme = useTheme();
  const [error, setError] = useState(null);

  const handleSubscribe = async () => {
    setError(null);

    if (!priceId) {
      setError("Error: Price ID is missing. Please check the component props.");
      return;
    }

    try {
      const hasExistingSubscription = !!session?.user?.stripeSubscriptionId;

      if (hasExistingSubscription) {
        const response = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update subscription.");
        }

        await updateSession();
      } else {
        const response = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId }),
        });

        const { sessionId, error: apiError } = await response.json();

        if (apiError || !sessionId) {
          throw new Error(apiError || "Failed to create a session.");
        }

        const stripe = await stripePromise;
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }
    } catch (err) {
      setError(err.message);
      console.error("Subscription error:", err);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (sessionId) {
      updateSession();
    }
  }, [updateSession]);

  const isCurrentPlan = session?.user?.stripePriceId === priceId;

  return (
    <div>
      <Button
        bgColor={isCurrentPlan ? theme.textSecondary : bgColor}
        clr={clr || theme.text}
        onClick={handleSubscribe}
      >
        {isCurrentPlan ? "Current Plan" : "Subscribe"}
      </Button>
      {error && <p style={{ color: theme.warning, marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

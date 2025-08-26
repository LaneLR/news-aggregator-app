// src/components/SubscribeButton.js
"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import Button from "./Button";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function SubscribeButton({
  priceId,
  clr,
  bgColor,
  updateSession,
}) {
  const [error, setError] = useState(null);

  const handleSubscribe = async () => {
    setError(null);

    if (!priceId) {
      setError("Error: Price ID is missing. Please check the component props.");
      return;
    }

    try {
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
    } catch (err) {
      setError(err.message);
      console.error("Subscription error:", err);
    }
  };

  return (
    <div>
      <Button
        bgColor={bgColor}
        clr={clr}
        priceId={priceId}
        onClick={handleSubscribe}
      >
        Subscribe
      </Button>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

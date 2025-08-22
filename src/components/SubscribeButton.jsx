"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import Button from "./Button";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function SubscribeButton({ priceId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    // *** DEBUGGING STEP ***
    // This will show the value of priceId in your browser's developer console.
    console.log("Attempting to subscribe with Price ID:", priceId);

    // If the log above shows 'undefined', the API call will fail.
    if (!priceId) {
      setError("Error: Price ID is missing. Please check the component props.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const { sessionId, error } = await response.json();

      if (error || !sessionId) {
        throw new Error(error || "Failed to create a session.");
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* I've added "Subscribe" as the default text for your button */}
      <Button priceId={priceId} onClick={handleSubscribe} disabled={isLoading}>
        Subscribe
      </Button>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

// src/components/CancelSubscriptionButton.js
"use client";

import { useState } from "react";
import Button from "./Button"; // Assuming you have a generic Button component

export default function CancelSubscriptionButton({
  subscriptionEndDate,
  updateSession,
}) {
  const [error, setError] = useState(null);

  const handleCancel = async () => {
    setError(null);

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription.");
      }

      await updateSession();

      alert("Your subscription has been scheduled for cancellation.");
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  if (subscriptionEndDate) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <p>
          Your plan is active and will be canceled at the end of your billing
          period.
        </p>
        <strong>
          Access ends on: {new Date(subscriptionEndDate).toLocaleDateString()}
        </strong>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={handleCancel} bgColor={"purple"} clr={"var(--white)"}>
        Cancel Subscription
      </Button>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

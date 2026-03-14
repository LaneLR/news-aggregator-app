"use client";

import { useState } from "react";
import Button from "./Button"; 
import { useSession } from "next-auth/react";
import { useTheme } from "styled-components";

export default function CancelSubscriptionButton({
  subscriptionEndDate,
  updateSession,
  sessionData,
}) {
  const { data: session, status, update } = useSession({ data: sessionData });

  const [error, setError] = useState(null);
  const theme = useTheme();

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
      <Button onClick={handleCancel} bgColor={"#b40000"} clr={"var(--white)"}>
        Cancel Subscription
      </Button>
      {error && <p style={{ color: theme.warning, marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import Button from "./Button";
import { useSession } from "next-auth/react";

export default function ResumeSubscriptionButton({ subscriptionEndDate }) {
  const { update } = useSession();
  const [error, setError] = useState(null);

  const handleResume = async () => {
    setError(null);

    try {
      const response = await fetch("/api/stripe/resume-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resume subscription.");
      }

      await update();
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        color: "var(--theme-dark-blue)",
        padding: "10px 50px",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <p style={{ padding: "0 0 5px 0" }}>
          <i>
            You have scheduled your subscription to cancel. You can resume it
            at any time before the period ends.
          </i>
        </p>
        {subscriptionEndDate && (
          <strong>
            Access ends on: {new Date(subscriptionEndDate).toLocaleDateString()}
          </strong>
        )}
      </div>
      <Button onClick={handleResume} bgColor={"var(--theme-primary)"} clr={"var(--theme-button-text)"}>
        Resume Subscription
      </Button>
      {error && <p style={{ color: "var(--theme-warning)", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

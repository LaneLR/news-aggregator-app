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
    <div>
      <p style={{ color: "var(--theme-text-secondary)", marginBottom: "0.75rem" }}>
        Your subscription is set to cancel
        {subscriptionEndDate &&
          ` on ${new Date(subscriptionEndDate).toLocaleDateString()}`}
        . You can resume it any time before then.
      </p>
      <Button
        onClick={handleResume}
        bgColor={"var(--theme-primary)"}
        clr={"var(--theme-primary-contrast)"}
      >
        Resume Subscription
      </Button>
      {error && (
        <p style={{ color: "var(--theme-warning)", marginTop: "10px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Button from "./Button";
import { useSession } from "next-auth/react";

export default function ResumeSubscriptionButton({
  updateSession,
  subscriptionEndDate,
  sessionData,
}) {
  const [error, setError] = useState(null);

  const { data: session, status, update } = useSession({ data: sessionData });

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

      await updateSession();
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        color: "var(--dark-blue)",
        padding: "10px 50px",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <p style={{padding: "0 0 5px 0"}}>
          <i>
            You have scheduled your subscription to cancel. You can resume it at
            any time before the period ends.{" "}
          </i>
        </p>
        <strong>
          {" "}
          Access ends on:{" "}
          {new Date(
            session?.user?.stripeSubscriptionEndsAt
          ).toLocaleDateString()}
        </strong>{" "}
      </div>
      <Button
        onClick={handleResume}
        bgColor="var(--deep-blue)"
        clr={"var(--white)"}
      >
        Resume Subscription
      </Button>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

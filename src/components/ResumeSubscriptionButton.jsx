"use client";

import { useState } from "react";
import Button from "./Button";

export default function ResumeSubscriptionButton({ updateSession }) {
  const [isLoading, setIsLoading] = useState(false);
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

      await updateSession();
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ marginBottom: "1rem" }}>
        You have scheduled your subscription to cancel. You can resume it at any
        time before the period ends.
      </p>
      <Button onClick={handleResume} bgColor="var(--deep-blue)" clr={"var(--white)"}>
        Resume Subscription
      </Button>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

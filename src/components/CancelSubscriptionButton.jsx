"use client";

import { useState } from "react";
import Button from "./Button";
import { useSession } from "next-auth/react";

export default function CancelSubscriptionButton() {
  const { update } = useSession();

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

      await update();
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <div>
      <Button
        onClick={handleCancel}
        bgColor={"var(--theme-warning)"}
        clr={"var(--theme-button-text)"}
      >
        Cancel Subscription
      </Button>
      {error && <p style={{ color: "var(--theme-warning)", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

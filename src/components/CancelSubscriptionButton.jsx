// src/components/CancelSubscriptionButton.js
"use client";
import { useState } from "react";

export default function CancelSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/cancel-subscription", {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);

    if (data.success) {
      alert(
        "✅ Subscription will cancel at the end of your billing period. Refreshing the page to reflect changes."
      );
    } else {
      alert("❌ " + (data.error || "Failed to cancel subscription"));
    }
  };

  return (
    <button onClick={handleCancel} disabled={loading}>
      {loading ? "Processing..." : "Cancel Subscription"}
    </button>
  );
}

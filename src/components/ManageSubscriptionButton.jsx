"use client";

import { useState } from "react";
import Button from "./Button";

export default function ManageSubscriptionButton() {
  const handleManage = async () => {
    try {
      const response = await fetch("/api/stripe/manage-subscription", {
        method: "POST",
      });
      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Error: Could not manage subscription.");
    }
  };

  return (
    <div>
      <Button
        wide={"fit-content"}
        bgColor={"green"}
        clr={"var(--white)"}
        onClick={handleManage}
      >
        Manage Subscription
      </Button>
    </div>
  );
}

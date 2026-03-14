"use client";
import Button from "./Button";
import { useTheme } from "styled-components";

export default function ManageSubscriptionButton() {
  const theme = useTheme();
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
        bgColor={theme.primary}
        clr={theme.text}
        onClick={handleManage}
      >
        Manage Subscription
      </Button>
    </div>
  );
}

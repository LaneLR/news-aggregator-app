"use client";
import Button from "./Button";
import { openPaymentUrl } from "@/lib/nativeApp";
import { useToast } from "./ToastProvider";

export default function ManageSubscriptionButton() {
  const toast = useToast();
  const handleManage = async () => {
    try {
      const response = await fetch("/api/stripe/manage-subscription", {
        method: "POST",
      });
      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      await openPaymentUrl(url);
    } catch (err) {
      console.error(err);
      toast.error("Could not open the subscription management page. Please try again.");
    }
  };

  return (
    <div>
      <Button
        wide={"fit-content"}
        bgColor={"var(--theme-primary)"}
        clr={"var(--theme-primary-contrast)"}
        onClick={handleManage}
      >
        Manage Subscription
      </Button>
    </div>
  );
}

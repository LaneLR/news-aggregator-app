"use client";

import { useState, useEffect } from "react";
import BannerHomePage from "@/components/BannerHomePage";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";
import SubscribeButton from "@/components/SubscribeButton";
import { useSession } from "next-auth/react";
import ResumeSubscriptionButton from "./ResumeSubscriptionButton";

export default function PricingPageComponent({ sessionData }) {
  const { data: session, status, update } = useSession({ data: sessionData });

  useEffect(() => {
    const interval = setInterval(() => update(), 1000 * 60 * 5); // Refreshes every 5 minutes
    return () => clearInterval(interval);
  }, [update]);

  const stripeSubscriptionStatus = session?.user?.stripeSubscriptionStatus;
  const stripeSubscriptionEndsAt = session?.user?.stripeSubscriptionEndsAt;
  const isSubscriptionActive = session?.user?.stripeSubscriptionStatus === "active";
  const isCancellationScheduled = !!session?.user?.stripeSubscriptionEndsAt;

  const monthSubscription = "price_1Ry0mKFlSQA8kdoEj98uKzPj";
  const daySubscription = "price_1RyeGSFlSQA8kdoEl5aQc8hK";

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isSubscriptionActive ? (
        <div>
          {isCancellationScheduled ? (
            <ResumeSubscriptionButton updateSession={update} />
          ) : (
            <CancelSubscriptionButton
              updateSession={update}
              subscriptionEndDate={stripeSubscriptionEndsAt}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "flex-start",
            margin: "auto",
            gap: "50px",
          }}
        >
          <BannerHomePage title={"Pro"} features={["..."]} cost={"$8 / mo"}>
            <SubscribeButton
              bgColor={"var(--orange)"}
              clr={"var(--white)"}
              priceId={monthSubscription}
              updateSession={update}
            >
              Choose Plan
            </SubscribeButton>
          </BannerHomePage>
        </div>
      )}
    </>
  );
}

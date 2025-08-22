// src/app/pricing/page.js
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";
import SubscribeButton from "@/components/SubscribeButton";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const proTierPriceId = "price_1Ry0mKFlSQA8kdoEj98uKzPj";

  // Use the session data to display the status and end date
  const isSubscriptionActive =
    session.user.stripeSubscriptionStatus === "active";
  const subscriptionWillCancel =
    session.user.stripeSubscriptionStatus === "canceled";
  const subscriptionEndDate = session.user.stripeSubscriptionEndsAt;

  return (
    <div>
      <h1>Pro Tier - $8.99/month</h1>
      {(session.user.tier === "Pro" || session.user.tier === "Pro Annual") && (
        <CancelSubscriptionButton subscriptionEndDate={subscriptionEndDate} />
      )}
      {session.user.tier === "Free" && (
        <SubscribeButton priceId={proTierPriceId} />
      )}
      <br />
      {isSubscriptionActive && <p>Your subscription is active.</p>}
      {subscriptionWillCancel && (
        <p>
          Your subscription is set to be canceled at the end of the current
          billing period.
        </p>
      )}
    </div>
  );
}

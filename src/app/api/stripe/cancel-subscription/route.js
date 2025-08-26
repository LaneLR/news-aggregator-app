// src/app/api/stripe/cancel-subscription/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);

    if (!user || !user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "User or subscription not found." },
        { status: 404 }
      );
    }

    const updatedSubscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    let subscriptionEndDate = null;
    const endDateTimestamp = updatedSubscription.cancel_at;

    if (typeof endDateTimestamp === "number") {
      subscriptionEndDate = new Date(endDateTimestamp * 1000);
    } else {
      const fallbackTimestamp = updatedSubscription.current_period_end;
      if (typeof fallbackTimestamp === "number") {
        subscriptionEndDate = new Date(fallbackTimestamp * 1000);
      }
    }

    if (subscriptionEndDate) {
      await user.update({
        stripeSubscriptionStatus: updatedSubscription.status,
        stripeSubscriptionEndsAt: subscriptionEndDate,
      });

      console.log(
        `User ${user.email} scheduled subscription for cancellation on ${subscriptionEndDate}`
      );
    } else {
      console.error(
        "Could not determine subscription end date after cancellation request."
      );
    }

    return NextResponse.json({
      message: "Subscription cancellation scheduled successfully.",
      subscriptionEndDate,
    });
  } catch (err) {
    console.error("Error canceling subscription:", err);
    return NextResponse.json(
      { error: "Could not cancel subscription." },
      { status: 500 }
    );
  }
}

// src/app/api/stripe/resume-subscription/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  // 1. Authenticate the user
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

    await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    await user.update({
      stripeSubscriptionEndsAt: null,
    });

    return NextResponse.json({
      message: "Subscription resumed successfully.",
    });
  } catch (err) {
    console.error("Error resuming subscription:", err);
    return NextResponse.json(
      { error: "Could not resume subscription." },
      { status: 500 }
    );
  }
}
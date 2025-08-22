// src/app/api/stripe/cancel-subscription/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { User } = await initializeDbAndModels();
  const user = await User.findByPk(session.user.id);

  if (!user || !user.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 }
    );
  }

  try {
    const canceledSubscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    await user.update({
      stripeSubscriptionStatus: canceledSubscription.status,
    });

    revalidatePath("/subscription-page");

    return NextResponse.json({
      success: true,
      subscription: canceledSubscription,
    });
  } catch (err) {
    console.error("Error canceling subscription:", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

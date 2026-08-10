import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import getStripe from "@/lib/stripe";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);

    if (!user || !user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "User or subscription not found." },
        { status: 404 }
      );
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return NextResponse.json({
      message: "Subscription resume request sent to Stripe successfully.",
    });
  } catch (err) {
    console.error("Error resuming subscription:", err);
    return NextResponse.json(
      { error: "Could not resume subscription." },
      { status: 500 }
    );
  }
}

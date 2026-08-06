import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId, referralCode, promotionCodeId } = await req.json();
  if (!priceId) {
    return NextResponse.json(
      { error: "Price ID is required" },
      { status: 400 }
    );
  }

  const { User } = await initializeDbAndModels();
  const user = await User.findByPk(session.user.id);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.tier !== "Free") {
    return NextResponse.json(
      {
        error:
          "You already have an active subscription. Please manage it in your account settings.",
      },
      { status: 400 }
    );
  }

  let discountOptions = {};
  let metadata = {};
  let referrer = null;

  if (referralCode) {
    if (user.usedReferralCode) {
      return NextResponse.json(
        { error: "Referral code can only be used once." },
        { status: 400 }
      );
    }

    referrer = await User.findOne({ where: { referralCode } });
    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code." },
        { status: 400 }
      );
    }

    if (referrer.id === user.id) {
      return NextResponse.json(
        { error: "You cannot use your own referral code." },
        { status: 400 }
      );
    }

    if (!promotionCodeId) {
      return NextResponse.json(
        { error: "Please apply your referral code before subscribing." },
        { status: 400 }
      );
    }

    discountOptions = { discounts: [{ promotion_code: promotionCodeId }] };
    metadata = { usedReferralCode: referralCode, referrerId: referrer.id };
  }

  try {
    const origin = headers().get("origin") || "http://localhost:3000";

    const sessionParams = {
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/account?subscription_success=true`,
      cancel_url: `${origin}/pricing`,
      client_reference_id: user.id,
      ...discountOptions, // Apply the discount if a valid code was used
      metadata, // Pass referral info to the webhook
    };

    // Reuse the existing Stripe customer for returning subscribers instead
    // of creating a duplicate customer object on every resubscribe.
    if (user.stripeCustomerId) {
      sessionParams.customer = user.stripeCustomerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const stripeSession = await stripe.checkout.sessions.create(sessionParams);

    revalidatePath("/pricing");
    return NextResponse.json({ sessionId: stripeSession.id });
  } catch (err) {
    console.error("Error creating Stripe session:", err);
    return NextResponse.json(
      { error: "Could not create checkout session" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { revalidatePath } from "next/cache";
import getStripe from "@/lib/stripe";
import { MONTHLY_PRICE_ID, ANNUAL_PRICE_ID } from "@/lib/stripePrices";

const ALLOWED_PRICE_IDS = [MONTHLY_PRICE_ID, ANNUAL_PRICE_ID];

export async function POST(req) {
  const stripe = getStripe();
  const session = await auth();
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
  if (!ALLOWED_PRICE_IDS.includes(priceId)) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
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
    // headers() returns a Promise in this Next.js version (App Router
    // Route Handlers) — calling .get() on it directly without awaiting
    // throws "headers(...).get is not a function", which broke checkout
    // session creation outright (every request hit the catch block below
    // and returned a 500 instead of ever reaching Stripe).
    const origin = (await headers()).get("origin") || "http://localhost:3000";

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
    // `url` is only consumed by the mobile app wrapper's native-app branch
    // (see src/lib/nativeApp.js) — normal web checkout still uses sessionId
    // with stripe.redirectToCheckout, unchanged.
    return NextResponse.json({ sessionId: stripeSession.id, url: stripeSession.url });
  } catch (err) {
    console.error("Error creating Stripe session:", err);
    return NextResponse.json(
      { error: "Could not create checkout session" },
      { status: 500 }
    );
  }
}

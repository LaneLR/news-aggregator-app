import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db.js";
import { auth } from "@/lib/auth";
import { authRateLimitMiddleware } from "@/lib/rate-limiter";
import getStripe from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const stripe = getStripe();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await authRateLimitMiddleware(req);
    } catch (err) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status || 429 }
      );
    }

    const { referralCode } = await req.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: "Referral code is required." },
        { status: 400 }
      );
    }

    const db = await initializeDbAndModels();
    const { User } = db;

    const referringUser = await User.findOne({ where: { referralCode } });

    if (!referringUser) {
      return NextResponse.json(
        { error: "Invalid referral code." },
        { status: 404 }
      );
    }

    if (referringUser.tier === "Free") {
      return NextResponse.json(
        { error: "This referral code is not from an active subscriber." },
        { status: 400 }
      );
    }

    if (referringUser.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot use your own referral code." },
        { status: 400 }
      );
    }

    const couponName = "Referral Discount";
    const allCoupons = await stripe.coupons.list();
    const coupon = allCoupons.data.find((c) => c.name === couponName);

    if (!coupon) {
      console.error(`Coupon with name "${couponName}" not found in Stripe.`);
      return NextResponse.json(
        { error: "Internal server error." },
        { status: 500 }
      );
    }

    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      max_redemptions: 1,
      restrictions: {
        first_time_transaction: true,
      },
    });
    return NextResponse.json(
      {
        message: "Referral code applied!",
        promotionCodeId: promotionCode.id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/apply-referral:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

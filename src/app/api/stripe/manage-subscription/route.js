// src/app/api/stripe/manage-subscription/route.js
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

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: "User or Stripe customer not found." },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account`, 
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Error creating Stripe portal session:", err);
    return NextResponse.json(
      { error: "Could not create billing portal session." },
      { status: 500 }
    );
  }
}
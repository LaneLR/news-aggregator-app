import { NextResponse } from "next/server";
import { headers } from "next/headers"; // <-- Import headers here
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await req.json();
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

  try {
    const origin = headers().get("origin") || "http://localhost:3000";

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/account`,
      cancel_url: `${origin}/news`,
      client_reference_id: user.id,
      customer_email: user.email,
    });

    return NextResponse.json({ sessionId: stripeSession.id });
  } catch (err) {
    console.error("Error creating Stripe session:", err);
    return NextResponse.json(
      { error: "Could not create checkout session" },
      { status: 500 }
    );
  }
}

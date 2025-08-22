import { NextResponse } from "next/server";
import Stripe from "stripe";
import initializeDbAndModels from "@/lib/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const { User } = await initializeDbAndModels();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(
          "Processing checkout.session.completed for session:",
          session.id
        );

        const userId = session.client_reference_id;
        if (!userId) {
          console.error(
            "Webhook Error: Missing client_reference_id in session."
          );
          return NextResponse.json(
            { error: "Missing user ID" },
            { status: 400 }
          );
        }

        const user = await User.findByPk(userId);
        if (!user) {
          console.error(`Webhook Error: User not found with ID: ${userId}`);
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription
        );
        const priceId = subscription.items.data[0].price.id;

        let newTier = "Free";
        if (priceId === "price_1Ry0mKFlSQA8kdoEj98uKzPj") newTier = "Pro";
        else if (priceId === "price_1Ry0oNFlSQA8kdoEdZzVvegu")
          newTier = "Pro Annual";

        await user.update({
          tier: newTier,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          stripeSubscriptionStatus: subscription.status,
        });

        console.log(`User ${user.email} upgraded to ${newTier}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const user = await User.findOne({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!user) break;

        const updateFields = {
          stripeSubscriptionStatus: subscription.status,
        };

        if (subscription.current_period_end) {
          updateFields.stripeSubscriptionEndsAt = new Date(
            subscription.current_period_end * 1000
          );
        }

        await user.update(updateFields);

        console.log(
          `Subscription updated for ${user.email}: ${subscription.status}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const user = await User.findOne({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!user) break;

        await user.update({
          tier: "Free",
          stripeSubscriptionStatus: "canceled",
          // stripeSubscriptionEndsAt: new Date(
          //   subscription.current_period_end * 1000
          // ),
          stripeSubscriptionId: null,
          stripePriceId: null,
        });

        console.log(`Subscription canceled for ${user.email}`);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (dbError) {
    console.error("Database update failed:", dbError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

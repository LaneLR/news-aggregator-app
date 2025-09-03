import { NextResponse } from "next/server";
import Stripe from "stripe";
import initializeDbAndModels from "@/lib/db";
import { sendEmail } from "@/utils/emailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const buf = await req.arrayBuffer();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(buf),
      signature,
      webhookSecret
    );
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
        const user = await User.findByPk(session.client_reference_id);

        if (user) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          const priceId = subscription.items.data[0].price.id;

          let newTier = "Free";
          if (priceId === "price_1Ry0mKFlSQA8kdoEj98uKzPj") newTier = "Pro";
          else if (priceId === "price_1Ry0oNFlSQA8kdoEdZzVvegu")
            newTier = "Pro Annual";

          const updateFields = {
            tier: newTier,
            stripeCustomerId: subscription.customer,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            stripeSubscriptionStatus: subscription.status,
            stripeSubscriptionEndsAt: null,
          };

          const periodEndTimestamp = subscription.cancel_at_period_end;
          if (typeof periodEndTimestamp === "number") {
            updateFields.stripeSubscriptionEndsAt = new Date(
              periodEndTimestamp * 1000
            );
          }

          await user.update(updateFields);

          await sendEmail({
            to: user.email,
            subject: `Welcome to Your ${newTier} Subscription!`,
            html: `<p>You are receiving this email because you have subscribed to the ${newTier} plan. Your account has been upgraded, and you now have access to all premium features.</p><p>If this was a mistake, please reach out to us at ---EmailForInquires@domain.com---.</p>`,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const user = await User.findOne({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!user) break;

        const priceId = subscription.items.data[0].price.id;
        let newTier = user.tier;
        if (priceId === "price_1Ry0mKFlSQA8kdoEj98uKzPj") newTier = "Pro";
        else if (priceId === "price_1Ry0oNFlSQA8kdoEdZzVvegu")
          newTier = "Pro Annual";

        const updateFields = {
          tier: newTier,
          stripeSubscriptionStatus: subscription.status,
          stripePriceId: priceId,
          stripeSubscriptionEndsAt: null,
        };

        if (subscription.cancel_at_period_end) {
          updateFields.stripeSubscriptionEndsAt = new Date(
            subscription.cancel_at * 1000
          );
        }

        await user.update(updateFields);

        console.log(
          `Subscription updated for ${user.email}: ${subscription.status}`
        );

        const previousAttributes = event.data.previous_attributes;

        if (previousAttributes.items && user.tier !== previousAttributes.tier) {
          await sendEmail({
            to: user.email,
            subject: "Your Subscription Has Been Updated",
            html: `<p>Your subscription has been successfully updated to the ${newTier} plan.</p><p>- RelayNews Team</p>`,
          });
        } else if (
          subscription.cancel_at_period_end &&
          !previousAttributes.cancel_at_period_end
        ) {
          const endDate = new Date(
            subscription.cancel_at * 1000
          ).toLocaleDateString();
          await sendEmail({
            to: user.email,
            subject: "Your Subscription Cancellation is Confirmed",
            html: `<p>We've received your request to cancel your subscription. You will continue to have access until ${endDate}.</p><p>- RelayNews Team</p>`,
          });
        } else if (
          !subscription.cancel_at_period_end &&
          previousAttributes.cancel_at_period_end
        ) {
          await sendEmail({
            to: user.email,
            subject: "Your Subscription Has Been Resumed",
            html: `<p>Your subscription has been successfully resumed. You now have full, uninterrupted access.</p><p>- RelayNews Team</p>`,
          });
        }
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
    console.error("Database or email update failed:", dbError);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

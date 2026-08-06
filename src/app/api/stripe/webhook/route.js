import { NextResponse } from "next/server";
import Stripe from "stripe";
import initializeDbAndModels from "@/lib/db";
import { sendEmail } from "@/utils/emailer";
import { billingIntervalForPrice } from "@/lib/stripePrices";

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

  const { User, ProcessedStripeEvent } = await initializeDbAndModels();

  // Stripe retries webhook deliveries and may send the same event more than
  // once; recording the event ID before processing keeps retries/duplicates
  // from double-crediting referrals or double-sending emails.
  try {
    await ProcessedStripeEvent.create({ id: event.id, type: event.type });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Failed to record webhook event:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const user = await User.findByPk(session.client_reference_id);

        if (user) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          // Correctly get the subscription item from the data array
          const subscriptionItem = subscription.items.data[0];
          const priceId = subscriptionItem.price.id;

          // Stripe moved current_period_end from the subscription object to
          // the subscription item in newer API versions; support either.
          const periodEnd =
            subscriptionItem.current_period_end ??
            subscription.current_period_end;

          const updateFields = {
            tier: "Subscribed",
            stripeCustomerId: subscription.customer,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            stripeSubscriptionStatus: subscription.status,
            stripeSubscriptionEndsAt: periodEnd ? new Date(periodEnd * 1000) : null,
          };

          const { usedReferralCode, referrerId } = session.metadata;

          if (usedReferralCode) {
            updateFields.usedReferralCode = usedReferralCode;
          }

          await user.update(updateFields);

          if (referrerId) {
            const referrer = await User.findByPk(referrerId);
            if (referrer) {
              await referrer.increment("referralCount");
              await stripe.customers.createBalanceTransaction(
                referrer.stripeCustomerId,
                {
                  amount: -400, // -400 cents = $4.00 credit
                  currency: "usd",
                  description: `Referral credit for ${user.email}`,
                }
              );
            }
          }

          const interval = billingIntervalForPrice(priceId);
          await sendEmail({
            to: user.email,
            subject: "Welcome to MorningFeeds Subscribed!",
            html: `<p>You are receiving this email because you have subscribed to MorningFeeds${interval ? ` (${interval} billing)` : ""}. Your account has been upgraded, and you now have access to Market, Finance, and Journal content plus custom feeds.</p><p>If this was a mistake, please reach out to us at ${process.env.CONTACT_EMAIL}.</p>`,
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

        const periodEnd =
          subscription.items.data[0].current_period_end ??
          subscription.current_period_end;

        const updateFields = {
          tier: "Subscribed",
          stripeSubscriptionStatus: subscription.status,
          stripePriceId: priceId,
          subscriptionWillCancel: subscription.cancel_at_period_end,
          stripeSubscriptionEndsAt: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000)
            : periodEnd
            ? new Date(periodEnd * 1000)
            : null,
        };

        await user.update(updateFields);

        console.log(
          `Subscription updated for ${user.email}: ${subscription.status}`
        );

        const previousAttributes = event.data.previous_attributes;
        const newInterval = billingIntervalForPrice(priceId);

        if (previousAttributes.items) {
          await sendEmail({
            to: user.email,
            subject: "Your Subscription Has Been Updated",
            html: `<p>Your subscription billing has been successfully updated${newInterval ? ` to ${newInterval} billing` : ""}.</p><p>- MorningFeeds Team</p>`,
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
            html: `<p>We've received your request to cancel your subscription. You will continue to have access until ${endDate}.</p><p>- MorningFeeds Team</p>`,
          });
        } else if (
          !subscription.cancel_at_period_end &&
          previousAttributes.cancel_at_period_end
        ) {
          await sendEmail({
            to: user.email,
            subject: "Your Subscription Has Been Resumed",
            html: `<p>Your subscription has been successfully resumed. You now have full, uninterrupted access.</p><p>- MorningFeeds Team</p>`,
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
          stripeSubscriptionEndsAt: null,
        });

        console.log(`Subscription canceled for ${user.email}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const user = await User.findOne({
          where: { stripeSubscriptionId: invoice.subscription },
        });
        if (!user) break;

        // Don't downgrade immediately — Stripe's Smart Retries will keep
        // trying the card, and a subscription that ultimately fails for good
        // triggers customer.subscription.deleted, which already downgrades
        // the user. This just warns them so they can fix their payment method.
        await sendEmail({
          to: user.email,
          subject: "We couldn't process your payment",
          html: `<p>We were unable to process your latest payment. Please update your payment method to avoid losing access to your subscription.</p><p>- MorningFeeds Team</p>`,
        });

        console.log(`Payment failed for ${user.email}`);
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

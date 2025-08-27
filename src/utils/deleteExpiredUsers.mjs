import dotenv from "dotenv";
dotenv.config();

import { Op } from "sequelize";
import Stripe from "stripe";
import initializeDbAndModels from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function deleteExpiredUsers() {
  const { User } = await initializeDbAndModels();

  const deletionThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const usersToDeactivate = await User.findAll({
    where: {
      isPendingDeletion: true,
      deletionRequestedAt: { [Op.lt]: deletionThreshold },
    },
  });

  if (usersToDeactivate.length === 0) {
    console.log(`[CRON] No users to deactivate at ${new Date().toISOString()}`);
    return 0;
  }

  let successCount = 0;

  for (const user of usersToDeactivate) {
    try {
      if (user.stripeSubscriptionId) {
        console.log(
          `[CRON] Canceling Stripe subscription for user ${user.id}...`
        );
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        console.log(
          `[CRON] Subscription ${user.stripeSubscriptionId} scheduled for cancellation.`
        );
      }

      await user.update({
        status: "inactive",
        isPendingDeletion: false,
        deletionRequestedAt: null,
      });

      successCount++;
    } catch (error) {
      console.error(
        `[CRON] Failed to process deactivation for user ${user.id}:`,
        error
      );
    }
  }

  console.log(
    `[CRON] Successfully set ${successCount} user(s) to INACTIVE at ${new Date().toISOString()}`
  );
  return successCount;
}

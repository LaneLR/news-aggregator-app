import dotenv from "dotenv";
dotenv.config();

import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";

//users who request account deletion will have their accounts deleted on midnight the following day
export async function deleteExpiredUsers() {
  const { User } = await initializeDbAndModels();

  const twentyFourHours = new Date(Date.now() - 24 * 60 * 60 * 1000); //24hrs

  const deleted = await User.destroy({
    where: {
      pendingDeletion: true,
      deletionRequestedAt: { [Op.lt]: twentyFourHours },
    },
  });

  console.log(
    `[CRON] Deleted ${deleted} expired user(s) at ${new Date().toISOString()}`
  );
}

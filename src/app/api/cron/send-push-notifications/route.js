import initializeDbAndModels from "@/lib/db";
import { getFollowedArticles } from "@/lib/digest";
import { sendPushToUser } from "@/lib/webPush";

const DAY_MS = 24 * 60 * 60 * 1000;

// Daily-batch by design, not real-time — see the conversation this was
// scoped from: article ingestion happens entirely outside this repo, so
// there's no "new article arrived" event to hook into, and this project's
// only cron capacity is once-daily. A user who follows "Trump" gets one
// notification a day summarizing what matched, not a ping per article.
function isDue(user, now) {
  if (!user.lastPushSentAt) return true;
  return now - new Date(user.lastPushSentAt).getTime() >= 20 * 60 * 60 * 1000;
}

async function handler(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const { User, Article, PushSubscription } = await initializeDbAndModels();

    const subscriptionRows = await PushSubscription.findAll({
      attributes: ["userId"],
      group: ["userId"],
    });
    const subscribedUserIds = subscriptionRows.map((r) => r.userId);
    if (subscribedUserIds.length === 0) {
      return Response.json({ status: "ok", eligible: 0, sent: 0 });
    }

    const users = await User.findAll({ where: { id: subscribedUserIds, status: "active" } });
    const now = Date.now();
    const dueUsers = users.filter(
      (user) => user.followedKeywords?.length > 0 && isDue(user, now)
    );

    let sent = 0;
    let failed = 0;

    for (const user of dueUsers) {
      try {
        const isSubscribed = user.tier && user.tier !== "Free";
        const matches = await getFollowedArticles(Article, {
          isSubscribed,
          mutedKeywords: user.mutedKeywords,
          followedKeywords: user.followedKeywords,
          days: 1,
        });

        if (matches.length > 0) {
          const title =
            matches.length === 1
              ? "1 new article you're following"
              : `${matches.length} new articles you're following`;
          await sendPushToUser(PushSubscription, user.id, {
            title,
            body: matches[0].title,
            url: `${baseUrl}/following`,
          });
        }

        await user.update({ lastPushSentAt: new Date() });
        sent++;
      } catch (err) {
        console.error(`Failed to send push notification to ${user.email}:`, err);
        failed++;
      }
    }

    return Response.json({ status: "ok", eligible: dueUsers.length, sent, failed });
  } catch (err) {
    console.error("[API] Error sending push notifications:", err);
    return Response.json({ error: "Push notification send failed" }, { status: 500 });
  }
}

export { handler as GET, handler as POST };

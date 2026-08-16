import initializeDbAndModels from "@/lib/db";
import { sendEmail } from "@/utils/emailer";
import {
  getTrendingArticles,
  getFeedScopedArticles,
  getDigestArticles,
  buildDigestHtml,
} from "@/lib/digest";

const DIGEST_ARTICLE_LIMIT = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

function isDue(user, now) {
  if (!user.lastDigestSentAt) return true;
  const elapsed = now - new Date(user.lastDigestSentAt).getTime();
  if (user.digestFrequency === "daily") return elapsed >= 20 * 60 * 60 * 1000;
  return elapsed >= 6.5 * DAY_MS; // weekly
}

// Vercel Cron triggers via GET (and automatically sends CRON_SECRET as the
// Authorization header when that env var is set on the project); POST is
// kept too in case this is triggered manually or from a different scheduler.
async function handler(req) {
  if (!process.env.CRON_SECRET) {
    console.error("CRON_SECRET is not set — refusing to run send-digests.");
    return new Response("Unauthorized", { status: 401 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const db = await initializeDbAndModels();
    const { User, Feed, Article } = db;

    const subscribers = await User.findAll({
      where: { digestEnabled: true, status: "active" },
    });

    const now = Date.now();
    const dueUsers = subscribers.filter((user) => isDue(user, now));

    // Trending (Free-tier visibility) is the same for every Free user —
    // compute once instead of re-querying it per user in the loop below.
    // Subscribed users don't use this: getDigestArticles routes them
    // through the same real "For You" ranking the site itself uses, which
    // does its own trending fallback internally when a user has no
    // engagement signal yet.
    const trendingFree = await getTrendingArticles(Article, { isSubscribed: false });

    let sent = 0;
    let failed = 0;

    for (const user of dueUsers) {
      const isSubscribed = user.tier && user.tier !== "Free";
      try {
        // A subscriber can scope their digest to one of their own custom
        // Feeds instead of general trending/personalized content.
        let feed = null;
        if (isSubscribed && user.digestFeedId) {
          feed = await Feed.findOne({
            where: { id: user.digestFeedId, userId: user.id },
          });
        }

        let picks;
        if (feed) {
          const feedArticles = await getFeedScopedArticles(Article, feed, {
            mutedKeywords: user.mutedKeywords,
            limit: DIGEST_ARTICLE_LIMIT,
          });
          picks = feedArticles.map((article) => ({ article, reason: null }));
        } else {
          picks = await getDigestArticles(db, user, {
            isSubscribed,
            limit: DIGEST_ARTICLE_LIMIT,
            days: user.digestFrequency === "daily" ? 1 : 7,
            trendingPool: trendingFree,
          });
        }

        // Nothing worth sending — still mark as processed so it isn't
        // retried every run until fresh content shows up.
        if (picks.length === 0) {
          await user.update({ lastDigestSentAt: new Date() });
          continue;
        }

        const html = buildDigestHtml({
          picks,
          feedTitle: feed?.title,
          frequency: user.digestFrequency,
          baseUrl,
        });

        await sendEmail({
          to: user.email,
          subject:
            user.digestFrequency === "daily"
              ? "Your daily MochaReads digest"
              : "Your weekly MochaReads digest",
          html,
        });

        await user.update({ lastDigestSentAt: new Date() });
        sent++;
      } catch (err) {
        console.error(`Failed to send digest to ${user.email}:`, err);
        failed++;
      }
    }

    return Response.json({ status: "ok", eligible: dueUsers.length, sent, failed });
  } catch (err) {
    console.error("[API] Error sending digests:", err);
    return Response.json({ error: "Digest send failed" }, { status: 500 });
  }
}

export { handler as GET, handler as POST };

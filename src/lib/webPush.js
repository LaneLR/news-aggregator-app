import webpush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(
    `mailto:${process.env.CONTACT_EMAIL || "support@example.com"}`,
    publicKey,
    privateKey
  );
  configured = true;
  return true;
}

// Sends to every device this user has subscribed (phone, laptop, etc. all
// get the same notification). A subscription that the browser has
// unregistered comes back as 404/410 — that's expected churn (uninstalled
// PWA, cleared browser data), not a real failure, so those rows are pruned
// automatically rather than logged as errors on every send.
export async function sendPushToUser(PushSubscription, userId, payload) {
  if (!ensureConfigured()) return { sent: 0, skipped: "not_configured" };

  const subscriptions = await PushSubscription.findAll({ where: { userId } });
  if (subscriptions.length === 0) return { sent: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await sub.destroy();
        } else {
          console.error(`Push send failed for subscription ${sub.id}:`, err.message);
        }
      }
    })
  );

  return { sent };
}

// src/app/api/cron/delete-users/route.js
import { deleteExpiredUsers } from "@/utils/deleteExpiredUsers.mjs";

// Vercel Cron triggers via GET (and automatically sends CRON_SECRET as the
// Authorization header when that env var is set on the project); POST is
// kept too in case this is triggered manually or from a different scheduler.
async function handler(req) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await deleteExpiredUsers();
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[API] Error deleting expired users:", err);
    return new Response(JSON.stringify({ error: "Deletion failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export { handler as GET, handler as POST };

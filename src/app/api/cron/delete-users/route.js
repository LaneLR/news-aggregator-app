// src/app/api/cron/delete-users/route.js
import { deleteExpiredUsers } from "@/app/utils/deleteExpiredUsers.mjs";

export async function POST(req) {
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

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { endpoint, keys } = await req.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    }

    const { PushSubscription } = await initializeDbAndModels();
    // A given browser/device's endpoint is globally unique — re-subscribing
    // (e.g. after clearing site data) just refreshes the same row rather
    // than erroring on the unique constraint.
    await PushSubscription.upsert({
      endpoint,
      userId: session.user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error saving push subscription:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

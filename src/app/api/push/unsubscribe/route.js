import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint is required." }, { status: 400 });
    }

    const { PushSubscription } = await initializeDbAndModels();
    await PushSubscription.destroy({ where: { endpoint, userId: session.user.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error removing push subscription:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

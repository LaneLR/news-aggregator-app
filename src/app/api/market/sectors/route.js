import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { getSectorQuotes } from "@/lib/marketData";

export async function GET() {
  const session = await auth();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  if (!isSubscribed) {
    return NextResponse.json({ error: "Subscribed feature" }, { status: 403 });
  }

  try {
    const { MarketQuote } = await initializeDbAndModels();
    const data = await getSectorQuotes(MarketQuote);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching sector quotes:", err);
    return NextResponse.json({ error: "Could not fetch sector data" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { getMarketQuotes } from "@/lib/marketData";

// The Market category page itself already hard-redirects non-subscribers
// server-side (see app/category/market/page.js), but this endpoint is
// reachable directly, so it checks tier itself too rather than relying
// solely on that page-level redirect.
export async function GET() {
  const session = await auth();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  if (!isSubscribed) {
    return NextResponse.json({ error: "Subscribed feature" }, { status: 403 });
  }

  try {
    const { MarketQuote, MarketQuoteHistory } = await initializeDbAndModels();
    const data = await getMarketQuotes(MarketQuote, MarketQuoteHistory);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching market indices:", err);
    return NextResponse.json({ error: "Could not fetch market data" }, { status: 500 });
  }
}

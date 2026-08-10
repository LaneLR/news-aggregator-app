import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { TRACKED_INDICES } from "@/lib/marketData";
import { getChartRange, CHART_RANGES } from "@/lib/chartData";

export async function GET(req) {
  const session = await auth();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  if (!isSubscribed) {
    return NextResponse.json({ error: "Subscribed feature" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "SPY").toUpperCase();
  const range = searchParams.get("range") || "1mo";

  if (!TRACKED_INDICES.some((idx) => idx.symbol === symbol)) {
    return NextResponse.json({ error: "Unknown index symbol" }, { status: 400 });
  }
  if (!CHART_RANGES[range]) {
    return NextResponse.json({ error: "Unknown range" }, { status: 400 });
  }

  try {
    const { MarketChartCache } = await initializeDbAndModels();
    const data = await getChartRange(MarketChartCache, symbol, range);
    return NextResponse.json({ symbol, range, ...data });
  } catch (err) {
    console.error("Error fetching chart history:", err);
    return NextResponse.json({ error: "Could not fetch chart history" }, { status: 500 });
  }
}

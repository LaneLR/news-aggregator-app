import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { getWatchlistQuotes } from "@/lib/marketData";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSubscribed = session.user.tier && session.user.tier !== "Free";
  if (!isSubscribed) {
    return NextResponse.json({ error: "Subscribed feature" }, { status: 403 });
  }

  try {
    const { User, MarketQuote } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id, { attributes: ["watchlistSymbols"] });
    const symbols = user?.watchlistSymbols || [];
    const data = await getWatchlistQuotes(MarketQuote, symbols);
    return NextResponse.json({ symbols, ...data });
  } catch (err) {
    console.error("Error fetching watchlist quotes:", err);
    return NextResponse.json({ error: "Could not fetch watchlist data" }, { status: 500 });
  }
}

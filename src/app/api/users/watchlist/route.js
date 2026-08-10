import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

const MAX_SYMBOLS = 8;
// Plain tickers (AAPL) plus the dotted share-class form (BRK.B) — anything
// else isn't a real ticker shape, so reject it before it ever reaches
// Finnhub rather than silently caching a failed lookup.
const SYMBOL_PATTERN = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;

export async function PATCH(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSubscribed = session.user.tier && session.user.tier !== "Free";
  if (!isSubscribed) {
    return NextResponse.json({ error: "Subscribed feature" }, { status: 403 });
  }

  try {
    const { symbols } = await req.json();

    if (!Array.isArray(symbols)) {
      return NextResponse.json({ error: "symbols must be an array." }, { status: 400 });
    }

    const cleaned = Array.from(
      new Set(
        symbols
          .map((s) => (typeof s === "string" ? s.trim().toUpperCase() : ""))
          .filter((s) => SYMBOL_PATTERN.test(s))
      )
    ).slice(0, MAX_SYMBOLS);

    const { User } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await user.update({ watchlistSymbols: cleaned });

    return NextResponse.json({ success: true, symbols: cleaned });
  } catch (err) {
    console.error("Error updating watchlist:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

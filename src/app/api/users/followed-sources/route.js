import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { User } = await initializeDbAndModels();
  const user = await User.findByPk(session.user.id, {
    attributes: ["followedSources"],
  });
  return NextResponse.json({ followedSources: user?.followedSources || [] });
}

// Toggles a single source's membership rather than replacing the whole
// array (unlike /api/users/followed-keywords) — the caller is always a
// per-article follow button that only knows the one source it was clicked
// on, not the user's full followed list.
export async function POST(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sourceName } = await req.json();
    if (!sourceName || typeof sourceName !== "string") {
      return NextResponse.json(
        { error: "sourceName is required." },
        { status: 400 }
      );
    }

    const { sequelize, User } = await initializeDbAndModels();

    // Same lock-the-row pattern as /api/articles/like — without it, two
    // rapid toggles for the same source (a double-click, or a slow response
    // to the first request overlapping the second) can both read the array
    // before either write lands, so the second toggle silently loses.
    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(session.user.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user) return null;

      const current = user.followedSources || [];
      const wasFollowing = current.includes(sourceName);
      const next = wasFollowing
        ? current.filter((s) => s !== sourceName)
        : [...current, sourceName];

      await user.update({ followedSources: next }, { transaction });
      return { following: !wasFollowing, followedSources: next };
    });

    if (!result) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Error updating followed sources:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

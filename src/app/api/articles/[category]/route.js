import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SUBSCRIBER_ONLY_CATEGORIES } from "@/lib/subscriberOnlyCategories";
import { getCategoryArticles } from "@/lib/categoryArticles";

export async function GET(req, { params }) {
  const { category } = await params;
  const session = await auth();
  const isSubscribed = !!(session?.user?.tier && session.user.tier !== "Free");

  // Market/Journal are fully subscriber-only. This mirrors the page-level
  // teaser in src/app/category/{market,journal}/page.js, but has to be
  // enforced here too — otherwise the paywall is just a UI thing that
  // anyone can bypass by calling this endpoint directly. Every other
  // category (including Finance) is reachable by anyone; getCategoryArticles
  // itself filters out premium-tier articles for non-subscribers.
  if (SUBSCRIBER_ONLY_CATEGORIES.has(category.toLowerCase()) && !isSubscribed) {
    return NextResponse.json(
      { error: "This content is for subscribers only." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const sort = searchParams.get("sort") || "latest";

  // Anonymous visitors get a fixed, page-1/"latest"-only teaser of a
  // category (see ANONYMOUS_ARTICLE_LIMIT in categoryArticles.js) — Trending
  // and Most Liked reflect this app's own click/like activity, and paging
  // past the teaser, both require an account. Reject either directly here
  // too, not just in the UI, for the same reason as the 403 above.
  if (!session && (sort !== "latest" || page > 1)) {
    return NextResponse.json(
      { error: "Sign in to view this content." },
      { status: 401 }
    );
  }

  try {
    const data = await getCategoryArticles({
      category: category.toLowerCase(),
      sort,
      userId: session?.user?.id,
      page,
      isSubscribed,
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error(`Failed to fetch content for category "${category}":`, err);

    return NextResponse.json(
      { error: "Failed to fetch content from the database." },
      { status: 500 }
    );
  }
}

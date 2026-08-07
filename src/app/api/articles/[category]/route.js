import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SUBSCRIBER_ONLY_CATEGORIES } from "@/lib/subscriberOnlyCategories";
import { getCategoryArticles } from "@/lib/categoryArticles";

export async function GET(req, { params }) {
  const { category } = await params;
  const session = await auth();

  // Market/Finance/Journal are subscriber-only. This mirrors the page-level
  // redirect in src/app/category/{market,finance,journal}/page.js, but has
  // to be enforced here too — otherwise the paywall is just a UI redirect
  // that anyone can bypass by calling this endpoint directly.
  if (SUBSCRIBER_ONLY_CATEGORIES.has(category.toLowerCase())) {
    if (!session || session.user.tier === "Free") {
      return NextResponse.json(
        { error: "This content is for subscribers only." },
        { status: 403 }
      );
    }
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const sort = searchParams.get("sort") || "latest";

  try {
    const data = await getCategoryArticles({
      category: category.toLowerCase(),
      sort,
      userId: session?.user?.id,
      page,
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

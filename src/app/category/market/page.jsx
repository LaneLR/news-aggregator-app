import CategoryPageComponent from "@/components/CategoryPage";
import GatedCategoryTeaser from "@/components/GatedCategoryTeaser";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

// Fully subscriber-only — Free/anonymous visitors get an upsell teaser
// instead of the real dashboard/article list, not a redirect, so the nav
// entry and this page can stay genuinely reachable (see HeaderNavBar's
// `gated` flag) rather than bouncing people to /pricing with no context.
export const metadata = {
  title: "Market News",
  description: "A live market dashboard and full market-news coverage — for MochaReads Pro.",
};

export default async function MarketNewsPage() {
  const session = await auth();
  const isSubscribed = !!(session?.user?.tier && session.user.tier !== "Free");

  if (!isSubscribed) {
    return <GatedCategoryTeaser category="Market" />;
  }

  let initialArticles;
  let initialTotalPages;
  try {
    ({ articles: initialArticles, totalPages: initialTotalPages } = await getCategoryArticles({
      category: "market",
      userId: session.user.id,
      isSubscribed,
    }));
  } catch (err) {
    console.error("Failed to load initial Market articles:", err);
  }

  return (
    <>
      <CategoryPageComponent
        category={"Market"}
        initialArticles={initialArticles}
        initialTotalPages={initialTotalPages}
      />
    </>
  );
}

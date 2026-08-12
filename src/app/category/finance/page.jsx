import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

// Finance is no longer fully subscriber-only — it shows a curated free
// selection of sources to everyone, with the rest gated per-article via
// Article.tier (see src/lib/subscriberOnlyCategories.js). Market and
// Journal are the only two categories still fully locked.
export const metadata = {
  title: "Finance News",
  description: "Personal finance, markets, and money news from a curated set of sources.",
};

export default async function FinanceNewsPage() {
  const session = await auth();
  const isSubscribed = !!(session?.user?.tier && session.user.tier !== "Free");
  let initialArticles;
  let initialTotalPages;
  try {
    ({ articles: initialArticles, totalPages: initialTotalPages } = await getCategoryArticles({
      category: "finance",
      userId: session?.user?.id,
      isSubscribed,
    }));
  } catch (err) {
    console.error("Failed to load initial Finance articles:", err);
  }

  return (
    <>
      <CategoryPageComponent
        category={"Finance"}
        initialArticles={initialArticles}
        initialTotalPages={initialTotalPages}
      />
    </>
  );
}

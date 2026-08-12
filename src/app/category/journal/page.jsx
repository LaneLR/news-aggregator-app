import CategoryPageComponent from "@/components/CategoryPage";
import GatedCategoryTeaser from "@/components/GatedCategoryTeaser";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

// Fully subscriber-only — Free/anonymous visitors get an upsell teaser
// instead of the real article list, not a redirect, so the nav entry and
// this page can stay genuinely reachable (see HeaderNavBar's `gated` flag)
// rather than bouncing people to /pricing with no context.
export const metadata = {
  title: "Journals",
  description: "Peer-reviewed research and long-form analysis — for Subscribers.",
};

export default async function JournalNewsPage() {
  const session = await auth();
  const isSubscribed = !!(session?.user?.tier && session.user.tier !== "Free");

  if (!isSubscribed) {
    return <GatedCategoryTeaser category="Journal" />;
  }

  let initialArticles;
  let initialTotalPages;
  try {
    ({ articles: initialArticles, totalPages: initialTotalPages } = await getCategoryArticles({
      category: "journal",
      userId: session.user.id,
      isSubscribed,
    }));
  } catch (err) {
    console.error("Failed to load initial Journal articles:", err);
  }

  return (
    <>
      <CategoryPageComponent
        category={"Journal"}
        initialArticles={initialArticles}
        initialTotalPages={initialTotalPages}
      />
    </>
  );
}

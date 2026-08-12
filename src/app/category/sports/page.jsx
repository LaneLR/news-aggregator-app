import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "Sports News",
  description: "Scores, highlights, and sports news from around the world.",
};

export default async function SportsNewsPage() {
  const session = await auth();
  const isSubscribed = !!(session?.user?.tier && session.user.tier !== "Free");
  let initialArticles;
  let initialTotalPages;
  try {
    ({ articles: initialArticles, totalPages: initialTotalPages } = await getCategoryArticles({
      category: "sports",
      userId: session?.user?.id,
      isSubscribed,
    }));
  } catch (err) {
    console.error("Failed to load initial Sports articles:", err);
  }

  return (
    <>
      <CategoryPageComponent
        category={"Sports"}
        initialArticles={initialArticles}
        initialTotalPages={initialTotalPages}
      />
    </>
  );
}

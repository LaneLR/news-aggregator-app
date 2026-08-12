import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "Entertainment News",
  description: "Movies, TV, music, and celebrity news from your favorite sources.",
};

export default async function EntertainmentNewsPage() {
  const session = await auth();
  const isSubscribed = !!(session?.user?.tier && session.user.tier !== "Free");
  let initialArticles;
  let initialTotalPages;
  try {
    ({ articles: initialArticles, totalPages: initialTotalPages } = await getCategoryArticles({
      category: "entertainment",
      userId: session?.user?.id,
      isSubscribed,
    }));
  } catch (err) {
    console.error("Failed to load initial Entertainment articles:", err);
  }

  return (
    <>
      <CategoryPageComponent
        category={"Entertainment"}
        initialArticles={initialArticles}
        initialTotalPages={initialTotalPages}
      />
    </>
  );
}

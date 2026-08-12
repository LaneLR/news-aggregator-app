import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "Podcasts",
  description: "Episodes from finance, tech, and news podcasts, all in one place.",
};

export default async function PodcastPage() {
  const session = await auth();
  const isSubscribed = !!(session?.user?.tier && session.user.tier !== "Free");
  let initialArticles;
  let initialTotalPages;
  try {
    ({ articles: initialArticles, totalPages: initialTotalPages } = await getCategoryArticles({
      category: "podcast",
      userId: session?.user?.id,
      isSubscribed,
    }));
  } catch (err) {
    console.error("Failed to load initial Podcast articles:", err);
  }

  return (
    <>
      <CategoryPageComponent
        category={"Podcast"}
        initialArticles={initialArticles}
        initialTotalPages={initialTotalPages}
      />
    </>
  );
}

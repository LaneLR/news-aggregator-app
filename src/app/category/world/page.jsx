import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "World News",
  description: "World and international news from a range of sources.",
};

export default async function WorldNewsPage() {
  const session = await auth();
  let initialArticles;
  let initialTotalPages;
  try {
    ({ articles: initialArticles, totalPages: initialTotalPages } = await getCategoryArticles({
      category: "world",
      userId: session?.user?.id,
    }));
  } catch (err) {
    console.error("Failed to load initial World articles:", err);
  }

  return (
    <>
      <CategoryPageComponent
        category={"World"}
        initialArticles={initialArticles}
        initialTotalPages={initialTotalPages}
      />
    </>
  );
}

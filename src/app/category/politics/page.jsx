import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "Politics News",
  description: "Political news and analysis from a range of sources.",
};

export default async function PoliticsNewsPage() {
  const session = await auth();
  let initialArticles;
  let initialTotalPages;
  try {
    ({ articles: initialArticles, totalPages: initialTotalPages } = await getCategoryArticles({
      category: "politics",
      userId: session?.user?.id,
    }));
  } catch (err) {
    console.error("Failed to load initial Politics articles:", err);
  }

  return (
    <>
      <CategoryPageComponent
        category={"Politics"}
        initialArticles={initialArticles}
        initialTotalPages={initialTotalPages}
      />
    </>
  );
}

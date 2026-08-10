import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "Science News",
  description: "Science news, discoveries, and breakthroughs.",
};

export default async function ScienceNewsPage() {
  const session = await auth();
  let initialArticles;
  let initialTotalPages;
  try {
    ({ articles: initialArticles, totalPages: initialTotalPages } = await getCategoryArticles({
      category: "science",
      userId: session?.user?.id,
    }));
  } catch (err) {
    console.error("Failed to load initial Science articles:", err);
  }

  return (
    <>
      <CategoryPageComponent
        category={"Science"}
        initialArticles={initialArticles}
        initialTotalPages={initialTotalPages}
      />
    </>
  );
}

import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "Tech News",
  description: "The latest in technology and innovation.",
};

export default async function TechNewsPage() {
  const session = await auth();
  let initialArticles;
  try {
    ({ articles: initialArticles } = await getCategoryArticles({
      category: "tech",
      userId: session?.user?.id,
    }));
  } catch (err) {
    console.error("Failed to load initial Tech articles:", err);
  }

  return (
    <>
      <CategoryPageComponent category={"Tech"} initialArticles={initialArticles} />
    </>
  );
}

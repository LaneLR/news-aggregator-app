import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "Health News",
  description: "Health, wellness, and medical news from trusted sources.",
};

export default async function HealthNewsPage() {
  const session = await auth();
  let initialArticles;
  try {
    ({ articles: initialArticles } = await getCategoryArticles({
      category: "health",
      userId: session?.user?.id,
    }));
  } catch (err) {
    console.error("Failed to load initial Health articles:", err);
  }

  return (
    <>
      <CategoryPageComponent category={"Health"} initialArticles={initialArticles} />
    </>
  );
}

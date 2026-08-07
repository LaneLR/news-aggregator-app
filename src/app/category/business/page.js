import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "Business News",
  description: "The latest business news, markets, and company updates, all in one place.",
};

export default async function BusinessNewsPage() {
  const session = await auth();
  let initialArticles;
  try {
    ({ articles: initialArticles } = await getCategoryArticles({
      category: "business",
      userId: session?.user?.id,
    }));
  } catch (err) {
    console.error("Failed to load initial Business articles:", err);
  }

  return (
    <>
      <CategoryPageComponent category={"Business"} initialArticles={initialArticles} />
    </>
  );
}

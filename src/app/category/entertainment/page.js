import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "Entertainment News",
  description: "Movies, TV, music, and celebrity news from your favorite sources.",
};

export default async function EntertainmentNewsPage() {
  const session = await auth();
  let initialArticles;
  try {
    ({ articles: initialArticles } = await getCategoryArticles({
      category: "entertainment",
      userId: session?.user?.id,
    }));
  } catch (err) {
    console.error("Failed to load initial Entertainment articles:", err);
  }

  return (
    <>
      <CategoryPageComponent category={"Entertainment"} initialArticles={initialArticles} />
    </>
  );
}

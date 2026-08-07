import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "US News",
  description: "The latest US national news, all in one place.",
};

export default async function USNewsPage() {
  const session = await auth();
  let initialArticles;
  try {
    ({ articles: initialArticles } = await getCategoryArticles({
      category: "us",
      userId: session?.user?.id,
    }));
  } catch (err) {
    console.error("Failed to load initial US articles:", err);
  }

  return (
    <>
      <CategoryPageComponent category={"US"} initialArticles={initialArticles} />
    </>
  );
}

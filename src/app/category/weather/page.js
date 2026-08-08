import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { getCategoryArticles } from "@/lib/categoryArticles";

export const metadata = {
  title: "Weather News",
  description: "Weather news, forecasts, and alerts.",
};

export default async function WeatherNewsPage() {
  const session = await auth();
  let initialArticles;
  let initialTotalPages;
  try {
    ({ articles: initialArticles, totalPages: initialTotalPages } = await getCategoryArticles({
      category: "weather",
      userId: session?.user?.id,
    }));
  } catch (err) {
    console.error("Failed to load initial Weather articles:", err);
  }

  return (
    <>
      <CategoryPageComponent
        category={"Weather"}
        initialArticles={initialArticles}
        initialTotalPages={initialTotalPages}
      />
    </>
  );
}

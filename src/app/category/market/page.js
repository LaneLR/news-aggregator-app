import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategoryArticles } from "@/lib/categoryArticles";

// Subscriber-only — redirects anonymous/Free visitors to /pricing, so a
// crawler never sees real content here (also disallowed in robots.js).
export const metadata = {
  title: "Market News",
  robots: { index: false, follow: false },
};

export default async function MarketNewsPage() {
  const session = await auth();
  const isNotSubscribed = session?.user?.tier === "Free" || !session;
  if (isNotSubscribed) {
    return redirect("/pricing");
  }

  let initialArticles;
  try {
    ({ articles: initialArticles } = await getCategoryArticles({
      category: "market",
      userId: session.user.id,
    }));
  } catch (err) {
    console.error("Failed to load initial Market articles:", err);
  }

  return (
    <>
      <CategoryPageComponent category={"Market"} initialArticles={initialArticles} />
    </>
  );
}

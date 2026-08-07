import CategoryPageComponent from "@/components/CategoryPage";

export const metadata = {
  title: "Sports News",
  description: "Scores, highlights, and sports news from around the world.",
};

export default function SportsNewsPage() {
  return (
    <>
      <CategoryPageComponent category={"Sports"}/>
    </>
  );
}

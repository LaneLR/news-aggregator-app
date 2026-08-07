import CategoryPageComponent from "@/components/CategoryPage";

export const metadata = {
  title: "Science News",
  description: "Science news, discoveries, and breakthroughs.",
};

export default function ScienceNewsPage() {
  return (
    <>
      <CategoryPageComponent category={"Science"}/>
    </>
  );
}

import CategoryPageComponent from "@/components/CategoryPage";

export const metadata = {
  title: "Politics News",
  description: "Political news and analysis from a range of sources.",
};

export default function PoliticsNewsPage() {
  return (
    <>
      <CategoryPageComponent category={"Politics"}/>
    </>
  );
}

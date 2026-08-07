import CategoryPageComponent from "@/components/CategoryPage";

export const metadata = {
  title: "World News",
  description: "World and international news from a range of sources.",
};

export default function WorldNewsPage() {
  return (
    <>
      <CategoryPageComponent category={"World"}/>
    </>
  );
}

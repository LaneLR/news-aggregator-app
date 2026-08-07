import CategoryPageComponent from "@/components/CategoryPage";

export const metadata = {
  title: "Business News",
  description: "The latest business news, markets, and company updates, all in one place.",
};

export default function BusinessNewsPage() {
  return (
    <>
      <CategoryPageComponent category={"Business"}/>
    </>
  );
}

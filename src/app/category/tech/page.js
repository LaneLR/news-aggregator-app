import CategoryPageComponent from "@/components/CategoryPage";

export const metadata = {
  title: "Tech News",
  description: "The latest in technology and innovation.",
};

export default function TechNewsPage() {
  return (
    <>
      <CategoryPageComponent category={"Tech"}/>
    </>
  );
}

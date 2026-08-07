import CategoryPageComponent from "@/components/CategoryPage";

export const metadata = {
  title: "US News",
  description: "The latest US national news, all in one place.",
};

export default function USNewsPage() {
  return (
    <>
      <CategoryPageComponent category={"US"}/>
    </>
  );
}

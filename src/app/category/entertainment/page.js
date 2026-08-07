import CategoryPageComponent from "@/components/CategoryPage";

export const metadata = {
  title: "Entertainment News",
  description: "Movies, TV, music, and celebrity news from your favorite sources.",
};

export default function EntertainmentNewsPage() {
  return (
    <>
      <CategoryPageComponent category={"Entertainment"}/>
    </>
  );
}

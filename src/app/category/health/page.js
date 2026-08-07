import CategoryPageComponent from "@/components/CategoryPage";

export const metadata = {
  title: "Health News",
  description: "Health, wellness, and medical news from trusted sources.",
};

export default function HealthNewsPage() {
  return (
    <>
      <CategoryPageComponent category={"Health"}/>
    </>
  );
}

import CategoryPageComponent from "@/components/CategoryPage";

export const metadata = {
  title: "Weather News",
  description: "Weather news, forecasts, and alerts.",
};

export default function WeatherNewsPage() {
  return (
    <>
      <CategoryPageComponent category={"Weather"}/>
    </>
  );
}

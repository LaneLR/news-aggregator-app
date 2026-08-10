// src/app/pricing/page.js (Server Component)
import PricingPageComponent from "@/components/PricingPage";

export const metadata = {
  title: "Pricing",
  description: "Compare MorningFeeds' Free and Subscribed plans and choose the one that fits you.",
};

export default function PricingPage() {
  return <PricingPageComponent />;
}

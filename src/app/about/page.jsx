import LegalInfoPage from "@/components/LegalInfoPage";

export const metadata = {
  title: "About",
  description: "Learn about MochaReads, a fast, customizable RSS feed reader and news aggregator.",
};

export default function AboutPage() {
  return <LegalInfoPage activeTab="about" contactEmail={process.env.CONTACT_EMAIL} />;
}

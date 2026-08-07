import LegalInfoPage from "@/components/LegalInfoPage";

export const metadata = {
  title: "Privacy Policy",
  description: "Read the MorningFeeds privacy policy.",
};

export default function PrivacyPage() {
  return <LegalInfoPage activeTab="privacy" contactEmail={process.env.CONTACT_EMAIL} />;
}

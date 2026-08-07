import LegalInfoPage from "@/components/LegalInfoPage";

export default function PrivacyPage() {
  return <LegalInfoPage activeTab="privacy" contactEmail={process.env.CONTACT_EMAIL} />;
}

import LegalInfoPage from "@/components/LegalInfoPage";

export const metadata = {
  title: "Privacy Policy",
  description: "Read the MochaReads privacy policy.",
};

export default function PrivacyPage() {
  return <LegalInfoPage activeTab="privacy" contactEmail={process.env.CONTACT_EMAIL} />;
}

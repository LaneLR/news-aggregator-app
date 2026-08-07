import LegalInfoPage from "@/components/LegalInfoPage";

export default function TermsOfServicePage() {
  return <LegalInfoPage activeTab="terms" contactEmail={process.env.CONTACT_EMAIL} />;
}

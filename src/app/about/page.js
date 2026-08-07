import LegalInfoPage from "@/components/LegalInfoPage";

export default function AboutPage() {
  return <LegalInfoPage activeTab="about" contactEmail={process.env.CONTACT_EMAIL} />;
}

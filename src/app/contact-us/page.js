import LegalInfoPage from "@/components/LegalInfoPage";

export default function ContactUsPage() {
  return <LegalInfoPage activeTab="contact" contactEmail={process.env.CONTACT_EMAIL} />;
}

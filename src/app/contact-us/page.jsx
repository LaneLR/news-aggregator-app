import LegalInfoPage from "@/components/LegalInfoPage";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the MorningFeeds team.",
};

export default function ContactUsPage() {
  return <LegalInfoPage activeTab="contact" contactEmail={process.env.CONTACT_EMAIL} />;
}

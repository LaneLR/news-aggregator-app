import LegalInfoPage from "@/components/LegalInfoPage";

export const metadata = {
  title: "Terms of Service",
  description: "Read the MochaReads terms of service.",
};

export default function TermsOfServicePage() {
  return <LegalInfoPage activeTab="terms" contactEmail={process.env.CONTACT_EMAIL} />;
}

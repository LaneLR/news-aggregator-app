import TermsOfServiceComponent from "@/components/TermsOfService";

export default function TermsOfServicePage() {
  return (
    <>
      <TermsOfServiceComponent contactEmail={process.env.CONTACT_EMAIL} />
    </>
  );
}

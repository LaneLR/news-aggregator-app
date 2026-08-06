import PrivacyPageComponent from "@/components/Privacy";

export default function PrivacyPage() {
  return (
    <>
      <PrivacyPageComponent contactEmail={process.env.CONTACT_EMAIL} />
    </>
  );
}

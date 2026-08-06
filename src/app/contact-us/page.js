import ContactUsComponent from "@/components/ContactUs";

export default function ContactUsPage() {
  return (
    <>
      <ContactUsComponent contactEmail={process.env.CONTACT_EMAIL} />
    </>
  );
}

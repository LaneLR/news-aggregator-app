import ForgotPasswordComponent from "@/components/ForgotPassword";

export const metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <ForgotPasswordComponent />
    </>
  );
}
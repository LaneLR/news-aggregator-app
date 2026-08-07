import ResetPasswordComponent from "@/components/ResetPasswordForm";

export const metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function PasswordResetPage() {
  return (
    <>
      <ResetPasswordComponent />
    </>
  );
}

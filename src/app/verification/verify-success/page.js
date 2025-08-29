import VerifyEmailSuccessComponent from "@/components/VerifyEmailSuccess";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function VerifyEmailSuccessPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect("/");
  }
  if (session.user.emailIsVerified) {
    setTimeout(() => {
      redirect("/");
    }, 5000);
  }

  return (
    <>
      <VerifyEmailSuccessComponent />
    </>
  );
}

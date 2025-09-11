import VerifyEmailSuccessComponent from "@/components/VerifyEmailSuccess";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function VerifyEmailSuccessPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.emailIsVerified) {
    setTimeout(() => {
      redirect("/login");
    }, 3000);
  }
  if (!session) {
    return redirect("/login");
  }
  return (
    <>
      <VerifyEmailSuccessComponent />
    </>
  );
}

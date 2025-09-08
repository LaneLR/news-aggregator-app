import VerifyEmailComponent from "@/components/VerifyEmail";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage() {
  const session = await getServerSession(authOptions);
  if (session && session?.user?.emailIsVerified) {
    setTimeout(() => {
      redirect("/login");
    }, 3000);
  }

  return (
    <>
      <VerifyEmailComponent />
    </>
  );
}

import LoadingDots from "@/components/Loading";
import LoginPage from "@/components/LoginForm";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "../loading";

export default async function Login() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/news");
  }

  return (
    <>
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    </>
  );
}

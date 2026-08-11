import LoadingDots from "@/components/Loading";
import LoginPage from "@/components/LoginForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "../loading";

export const metadata = {
  title: "Log In",
  description: "Log in to MochaReads to access your personalized news feed.",
};

export default async function Login() {
  const session = await auth();

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

import LoadingDots from "@/components/Loading";
import LoginPage from "@/components/LoginForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "../loading";

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

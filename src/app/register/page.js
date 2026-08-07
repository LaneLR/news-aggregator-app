import RegisterPage from "@/components/RegisterPage";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "../loading";

export const metadata = {
  title: "Sign Up",
  description: "Create a free MorningFeeds account to start building your personalized news feed.",
};

export default async function Register() {
  const session = await auth();

  if (session) {
    redirect("/news");
  }
  return (
    <>
      <Suspense fallback={<Loading />}>
        <RegisterPage />
      </Suspense>
    </>
  );
}

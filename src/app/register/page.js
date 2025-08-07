import LoadingComponent from "@/components/Loading";
import RegisterPage from "@/components/RegisterPage";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Register() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/news");
  }
  return (
    <>
      <Suspense fallback={<LoadingComponent />}>
        <RegisterPage />
      </Suspense>
    </>
  );
}

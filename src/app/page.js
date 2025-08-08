import HomePage from "@/components/HomePage";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    return redirect("/news");
  }

  return (
    <Suspense fallback={<Loading />}>
      <HomePage />
    </Suspense>
  );
}

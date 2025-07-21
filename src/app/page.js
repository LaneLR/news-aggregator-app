import HomePage from "@/components/HomePage";
import LoadingComponent from "@/components/Loading";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function LandingPage() {
const session = await getServerSession(authOptions);
if (session) {
  return redirect("/news");
}

  return (
    <Suspense fallback={<LoadingComponent />}>
      <HomePage />
    </Suspense>
  );
}
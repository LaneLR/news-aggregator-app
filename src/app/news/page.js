export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Suspense } from "react";
import Loading from "../loading";
import NewsPage from "@/components/NewNewsPage";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  if (!session.user.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <Suspense fallback={<Loading />}>
      <NewsPage />
    </Suspense>
  );
}

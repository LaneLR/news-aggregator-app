export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Suspense } from "react";
import Loading from "../loading";
import NewsPage from "@/components/NewNewsPage";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <Suspense fallback={<Loading />}>
      <NewsPage />
    </Suspense>
  );
}

export const dynamic = "force-dynamic"; // <-- ADD THIS LINE TEMPORARILY

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import LoadingComponent from "@/components/Global/Loading";
import { Suspense } from "react";
import News from "@/components/NewsFeed";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }
  return (
    <>
      <Suspense fallback={<LoadingComponent />}>
        <News />
      </Suspense>
    </>
  );
}

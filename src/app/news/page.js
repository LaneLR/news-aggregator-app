export const dynamic = "force-dynamic"; // <-- ADD THIS LINE TEMPORARILY

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Suspense } from "react";
import News from "@/components/NewsFeed";
import Loading from "../loading";
import FeedManager from "@/components/FeedManager";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <Suspense fallback={<Loading />}>
        {/* <News /> */}
        <FeedManager />
      </Suspense>
    </>
  );
}

import FeedManager from "@/components/FeedManager";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "My Feeds",
  robots: { index: false, follow: false },
};

export default async function FeedsPage() {
  const session = await auth();
  const isNotSubscribed = session?.user?.tier === "Free" || !session;
  if (isNotSubscribed) {
    return redirect("/pricing");
  }

  return <FeedManager />;
}

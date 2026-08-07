import FeedManager from "@/components/FeedManager";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function FeedsPage() {
  const session = await getServerSession(authOptions);
  const isNotSubscribed = session?.user?.tier === "Free" || !session;
  if (isNotSubscribed) {
    return redirect("/pricing");
  }

  return <FeedManager />;
}

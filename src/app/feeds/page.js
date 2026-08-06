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

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>My Feeds</h2>
      <p style={{ textAlign: "center" }}>
        Build a feed from specific sources or categories — pick a feed below or create a new one.
      </p>
      <FeedManager />
    </div>
  );
}

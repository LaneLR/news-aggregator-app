import ForYouFeed from "@/components/ForYouFeed";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ForYouPage() {
  const session = await getServerSession(authOptions);
  const isNotSubscribed = session?.user?.tier === "Free" || !session;
  if (isNotSubscribed) {
    return redirect("/pricing");
  }

  return <ForYouFeed />;
}

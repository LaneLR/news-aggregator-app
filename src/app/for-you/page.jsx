import ForYouFeed from "@/components/ForYouFeed";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "For You",
  robots: { index: false, follow: false },
};

export default async function ForYouPage() {
  const session = await auth();
  const isNotSubscribed = session?.user?.tier === "Free" || !session;
  if (isNotSubscribed) {
    return redirect("/pricing");
  }

  return <ForYouFeed />;
}

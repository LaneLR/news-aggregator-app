import FollowingPage from "@/components/FollowingPage";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Following",
  robots: { index: false, follow: false },
};

export default async function Following() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <FollowingPage />;
}

import TodayPage from "@/components/TodayPage";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Today's News",
  robots: { index: false, follow: false },
};

export default async function TodayNewsPage() {
  const session = await auth();
  if (!session) {
    return redirect("/");
  }

  return <TodayPage />;
}

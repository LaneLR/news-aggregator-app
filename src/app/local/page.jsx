import LocalPage from "@/components/LocalPage";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Local News",
  robots: { index: false, follow: false },
};

export default async function LocalNewsPage() {
  const session = await auth();
  if (!session) {
    return redirect("/");
  }

  return <LocalPage />;
}

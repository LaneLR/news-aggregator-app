import LikedArticlesPage from "@/components/LikedArticlesPage";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Liked Articles",
  robots: { index: false, follow: false },
};

export default async function LikedPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <LikedArticlesPage />;
}

import LikedArticlesPage from "@/components/LikedArticlesPage";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LikedPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <LikedArticlesPage />;
}

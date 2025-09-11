import LikedArticlesPage from "@/components/LikedArticlesPage";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <LikedArticlesPage sessionData={session} />;
}

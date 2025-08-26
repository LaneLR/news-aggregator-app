// src/app/pricing/page.js (Server Component)
import PricingPageComponent from "@/components/PricingPage";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <PricingPageComponent sessionData={session} />;
}

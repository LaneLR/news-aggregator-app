import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import HomePage from "@/components/HomePage";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/news");
  return <HomePage />;
}

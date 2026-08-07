import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import OnboardingFlow from "@/components/OnboardingFlow";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.onboardingCompleted) {
    redirect("/news");
  }

  return <OnboardingFlow />;
}

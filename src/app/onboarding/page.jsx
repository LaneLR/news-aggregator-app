import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import OnboardingFlow from "@/components/OnboardingFlow";

export const metadata = {
  title: "Get Started",
  robots: { index: false, follow: false },
};

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

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import HomePage from "@/components/HomePage";
import { isNativeAppRequest } from "@/lib/isNativeAppRequest";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/news");
  // The marketing landing page is a web-only surface — a real browser visit
  // (Safari, Chrome) is exactly who it's for. The wrapped iOS app has no use
  // for it: the visitor already knows what app they opened, so they should
  // land straight on the sign-in form instead of a page selling them the app
  // they're already inside.
  if (await isNativeAppRequest()) redirect("/login");
  return <HomePage />;
}

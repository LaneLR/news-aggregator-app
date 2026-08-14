import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import AuthTabs from "@/components/AuthTabs";

// Shared by /login and /register (see the sibling login/ and register/
// folders) — this route group exists specifically so Next.js keeps
// AuthLayout (the brand panel + tab row) mounted across navigation between
// those two routes instead of tearing it down and rebuilding it on every
// switch, which is what caused a visible loading flash between the two
// tabs. Route groups don't affect the URL, so /login and /register stay
// exactly as they were. The auth()-redirect-if-logged-in check also lives
// here now instead of being duplicated in both page.jsx files, since it's
// identical for both routes.
export default async function AuthGroupLayout({ children }) {
  const session = await auth();
  if (session) redirect("/news");

  return <AuthLayout tabs={<AuthTabs />}>{children}</AuthLayout>;
}

import ProfilePage from "@/components/ProfilePage";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <ProfilePage />;
}

import Divider from "@/components/Reuseable/Divider";
import SideBarNav from "@/components/SideNavBar";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div
      style={{
        color: "var(--dark-blue)",
        display: "flex",
        justifyContent: "center",
        width: "100%",
        height: "auto",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <h1>Profile</h1>
      <p>Your email: {session.user.email}</p>
      <Divider />
      <p>Subscription stuff</p>
    </div>
  );
}

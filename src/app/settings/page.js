import Divider from "@/components/Divider";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <>
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
        <h1>Settings</h1>
        <p>Security, password resets, etc.</p>
        <Divider />
        <p>Privacy stuff</p>
      </div>
    </>
  );
}

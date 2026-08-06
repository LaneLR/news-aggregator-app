import Divider from "@/components/Divider";
import DigestSettings from "@/components/DigestSettings";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        height: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px", padding: "0 1rem" }}>
        <h1>Settings</h1>

        <Divider />

        <DigestSettings sessionData={session} />

        <Divider />

        <p>
          Need to change your password? Use the{" "}
          <Link href="/forgot-password">
            <u>reset password</u>
          </Link>{" "}
          flow.
        </p>
      </div>
    </div>
  );
}

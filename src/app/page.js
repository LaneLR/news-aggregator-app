import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LandingPage() {
const session = await getServerSession(authOptions);
if (session) {
  return redirect("/news");
}

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Welcome to NewsHub</h1>
      <p>Stay informed with the latest articles curated for you.</p>
      <Link href="/api/auth/signin">Sign In</Link> 
    </main>
  );
}
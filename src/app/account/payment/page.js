import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";

export default async function PaymentInfoPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        Your saved payment details:
      </div>
    </>
  );
}

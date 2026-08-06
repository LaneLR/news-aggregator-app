import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";

export default async function PaymentInfoPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        width: "100%",
        textAlign: "center",
      }}
    >
      <p>Payment methods and billing history are managed securely through Stripe.</p>
      {session.user.tier === "Free" ? (
        <p>Subscribe to a paid plan to add a payment method.</p>
      ) : (
        <ManageSubscriptionButton />
      )}
    </div>
  );
}

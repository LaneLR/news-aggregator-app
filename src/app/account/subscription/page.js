import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  const isSubscribed = user.tier !== "Free";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        width: "100%",
      }}
    >
      <p>Your subscription status:</p>
      {isSubscribed ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <p>
            <b>Subscribed</b>
          </p>
          <CancelSubscriptionButton
            subscriptionEndDate={
              user.subscriptionWillCancel ? user.stripeSubscriptionEndsAt : null
            }
            sessionData={session}
          />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p>
            <b>Free tier</b>
          </p>
          <p>
            Want to upgrade?{" "}
            <Link href="/pricing">
              <u>View plans</u>
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

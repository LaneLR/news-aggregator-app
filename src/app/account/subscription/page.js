import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";
import ResumeSubscriptionButton from "@/components/ResumeSubscriptionButton";
import styles from "../AccountCard.module.scss";

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  const isSubscribed = user.tier !== "Free";

  return (
    <div className={styles.card}>
      <h2 className={styles.cardHeader}>
        <span className={styles.cardHeaderIcon}>
          <CreditCard size={17} />
        </span>
        Subscription
      </h2>
      <div className={styles.cardContent}>
        {isSubscribed ? (
          <>
            <div className={styles.infoRow}>
              <span>Current Plan</span>
              <strong>{user.tier}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Status</span>
              <strong style={{ textTransform: "capitalize" }}>
                {user.stripeSubscriptionStatus}
              </strong>
            </div>
            {user.stripeSubscriptionEndsAt && (
              <div className={styles.infoRow}>
                <span>
                  {user.subscriptionWillCancel ? "Cancels on" : "Renews on"}
                </span>
                <strong>
                  {new Date(user.stripeSubscriptionEndsAt).toLocaleDateString()}
                </strong>
              </div>
            )}
            {user.subscriptionWillCancel && (
              <ResumeSubscriptionButton
                subscriptionEndDate={user.stripeSubscriptionEndsAt}
              />
            )}
          </>
        ) : (
          <>
            <div className={styles.infoRow}>
              <span>Current Plan</span>
              <strong>Free</strong>
            </div>
            <p className={styles.helperText}>
              Want to upgrade? <Link href="/pricing">View plans</Link>
            </p>
          </>
        )}
      </div>
      {isSubscribed && !user.subscriptionWillCancel && (
        <div className={styles.cardFooter}>
          <CancelSubscriptionButton />
        </div>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";
import ResumeSubscriptionButton from "@/components/ResumeSubscriptionButton";
import styles from "../AccountCard.module.scss";

export const metadata = {
  title: "Subscription & Billing",
  robots: { index: false, follow: false },
};

// Combines what used to be two separate one-card pages (Subscription,
// Payment Details) — both ultimately point at the same Stripe customer
// portal for payment methods/invoices, so splitting them across a sidebar
// nav entry each was more navigation than the content justified.
export default async function SubscriptionPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  const isSubscribed = user.tier !== "Free";

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <h2 className={styles.cardHeader}>
          <span className={styles.cardHeaderIcon}>
            <CreditCard size={17} />
          </span>
          Subscription &amp; Billing
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
              <p className={styles.helperText}>
                Payment methods and billing history are managed securely
                through Stripe.
              </p>
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
        {isSubscribed && (
          <div className={styles.cardFooter}>
            <ManageSubscriptionButton />
            {!user.subscriptionWillCancel && <CancelSubscriptionButton />}
          </div>
        )}
      </div>
    </div>
  );
}

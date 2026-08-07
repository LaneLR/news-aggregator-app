import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import styles from "../AccountCard.module.scss";

export default async function PaymentInfoPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const isSubscribed = session.user.tier !== "Free";

  return (
    <div className={styles.card}>
      <h2 className={styles.cardHeader}>
        <span className={styles.cardHeaderIcon}>
          <Wallet size={17} />
        </span>
        Payment Details
      </h2>
      <div className={styles.cardContent}>
        <p className={styles.helperText}>
          Payment methods and billing history are managed securely through
          Stripe.
        </p>
        {!isSubscribed && (
          <p className={styles.helperText}>
            Subscribe to a paid plan to add a payment method.
          </p>
        )}
      </div>
      {isSubscribed && (
        <div className={styles.cardFooter}>
          <ManageSubscriptionButton />
        </div>
      )}
    </div>
  );
}

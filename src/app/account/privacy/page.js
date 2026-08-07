import Link from "next/link";
import { Shield } from "lucide-react";
import styles from "../AccountCard.module.scss";

export const metadata = {
  title: "Privacy Settings",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardHeader}>
        <span className={styles.cardHeaderIcon}>
          <Shield size={17} />
        </span>
        Privacy
      </h2>
      <div className={styles.cardContent}>
        <p className={styles.helperText}>
          See our <Link href="/privacy">Privacy Policy</Link> for details on
          what data we collect and how it&apos;s used.
        </p>
        <p className={styles.helperText}>
          You can request deletion of your account and all associated data
          from the <Link href="/account">Manage Account</Link> page at any
          time.
        </p>
      </div>
    </div>
  );
}

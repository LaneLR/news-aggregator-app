import Link from "next/link";
import { Lock } from "lucide-react";
import styles from "./SignInGate.module.scss";

export default function SignInGate({ message, compact = false }) {
  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ""}`}>
      <Lock size={compact ? 16 : 28} strokeWidth={1.5} />
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Link href="/login" className={styles.primaryLink}>
          Sign In
        </Link>
        <Link href="/register" className={styles.secondaryLink}>
          Create Account
        </Link>
      </div>
    </div>
  );
}

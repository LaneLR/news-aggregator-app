"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import Loading from "@/app/loading";
import AuthLayout from "./AuthLayout";
import styles from "./VerifyEmail.module.scss";

export default function VerifyEmailComponent() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session && session.user.emailIsVerified) {
      window.location.replace("/account");
    }
  }, [session]);

  if (status === "loading") {
    return <Loading />;
  }

  return (
    <AuthLayout>
      <div className={styles.formBody}>
        <div className={styles.successIcon}>
          <MailCheck size={22} strokeWidth={2} />
        </div>
        <h2 className={styles.formTitle}>Check Your Email</h2>
        <p className={styles.helperText}>
          We&apos;ve sent a verification link to your email address. Click
          the link to verify your account, then sign in below.
        </p>
        <p className={styles.helperText}>
          Don&apos;t see it? Check your spam folder — the link expires in 24
          hours.
        </p>
        <Link href="/login" className={styles.backLink}>
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import Button from "./Button";
import AuthLayout from "./AuthLayout";
import styles from "./ForgotPassword.module.scss";

export default function ForgotPasswordComponent() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <AuthLayout>
        <div className={styles.formBody}>
          <div className={styles.successIcon}>
            <MailCheck size={22} strokeWidth={2} />
          </div>
          <h2 className={styles.formTitle}>Check Your Email</h2>
          <p className={styles.helperText}>{message}</p>
          <Link href="/login" className={styles.backLink}>
            <ArrowLeft size={15} strokeWidth={2} />
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className={styles.formBody}>
        <Link href="/login" className={styles.backLink}>
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Sign In
        </Link>
        <h2 className={styles.formTitle}>Forgot Your Password?</h2>
        <p className={styles.helperText}>
          Enter the email address on your account and we&apos;ll send you a
          link to reset your password.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email Address</span>
            <div className={styles.inputGroup}>
              <Mail size={17} strokeWidth={2} className={styles.inputIcon} />
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          {error && <p className={styles.errorText}>{error}</p>}

          <Button
            bgColor={"var(--theme-primary)"}
            clr={"var(--theme-primary-contrast)"}
            type="submit"
            disabled={loading}
            wide={"100%"}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

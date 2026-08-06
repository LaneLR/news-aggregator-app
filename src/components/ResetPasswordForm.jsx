"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "./Button";
import styles from "./ResetPasswordForm.module.scss";

export default function ResetPasswordComponent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing token. Please request a new reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>Your password has been reset</div>
        <div style={{ textAlign: "center" }}>
          <p>You can now log in with your new password.</p>
          <br />
          <Link href="/login">
            <Button bgColor={"var(--theme-primary)"} clr={"var(--theme-text)"}>
              Go to Log in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>Reset Your Password</div>
      <form className={styles.formWrapper} onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <input
            className={styles.resetPasswordFormInput}
            type="password"
            id="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className={styles.resetPasswordFormInput}
            type="password"
            id="confirmPassword"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button
          bgColor={"var(--theme-primary)"}
          clr={"var(--theme-text)"}
          type="submit"
          disabled={loading}
        >
          Reset password
        </Button>
        {error && (
          <>
            <br />
            <p style={{ color: "var(--theme-warning)" }}>{error}</p>
          </>
        )}
      </form>
    </div>
  );
}

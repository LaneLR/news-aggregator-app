"use client";

import { useState } from "react";
import Button from "./Button";
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
      <div className={styles.wrapper}>
        <div className={styles.header}>Check Your Email</div>
        <p style={{ textAlign: "center", maxWidth: "350px" }}>{message}</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>Forgot Your Password?</div>
      <p style={{ color: "var(--theme-slate)", }}>
        Enter the email address of the account
      </p>

      <form className={styles.formWrapper} onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <input
            className={styles.formInput}
            type="email"
            id="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button
          bgColor={"var(--theme-primary)"}
          clr={"var(--theme-text)"}
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        {error && <p style={{ color: "var(--theme-warning)", marginTop: "20px" }}>{error}</p>}
      </form>
    </div>
  );
}

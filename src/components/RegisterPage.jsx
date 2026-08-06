"use client";
import Button from "@/components/Button";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./RegisterPage.module.scss";

export default function RegisterPage() {
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleCreateUser(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

      router.push("/verification/verify-email"); // or home
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    }
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.formWrapper} onSubmit={handleCreateUser}>
        <div className={styles.header}>Create an account!</div>
        <div className={styles.inputWrapper}>
          <input
            className={styles.registerFormInput}
            name="email"
            type="email"
            placeholder="Email"
            required
          />
          <input
            className={styles.registerFormInput}
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <input
            className={styles.registerFormInput}
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            required
          />
        </div>

        <div className={styles.checkboxWrapper}>
          <input
            className={styles.styledInput}
            type="checkbox"
            id="tos"
            name="tos"
            required
          />
          <label htmlFor="tos">
            I agree to the{" "}
            <Link
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
            .
          </label>
        </div>
        <Button
          bgColor={"var(--theme-primary)"}
          clr={"var(--theme-button-text)"}
          type="submit"
        >
          Create Account
        </Button>

        {error && (
          <>
            <br />
            <p style={{ color: "var(--theme-warning)" }}>{error}</p>
          </>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontWeight: "600",
            fontSize: "0.83rem",
          }}
        >
          <br />
          <div
            style={{
              display: "flex",
              gap: "5px",
              color: "var(--theme-text)",
              textAlign: "center",
            }}
          >
            <p>Already have an account?</p>
            <Link href="/login">
              <u>Log in!</u>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";
import Button from "@/components/Button";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthLayout from "./AuthLayout";
import styles from "./RegisterPage.module.scss";

export default function RegisterPage() {
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <AuthLayout activeTab="register">
      <div className={styles.formBody}>
        <h2 className={styles.formTitle}>Create Account</h2>
        <form className={styles.form} onSubmit={handleCreateUser}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email Address</span>
            <div className={styles.inputGroup}>
              <Mail size={17} strokeWidth={2} className={styles.inputIcon} />
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Password</span>
            <div className={styles.inputGroup}>
              <Lock size={17} strokeWidth={2} className={styles.inputIcon} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                className={styles.togglePasswordButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Confirm Password</span>
            <div className={styles.inputGroup}>
              <Lock size={17} strokeWidth={2} className={styles.inputIcon} />
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                required
              />
              <button
                type="button"
                className={styles.togglePasswordButton}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

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

          {error && <p className={styles.errorText}>{error}</p>}

          <Button
            bgColor={"var(--theme-primary)"}
            clr={"var(--theme-button-text)"}
            type="submit"
            wide={"100%"}
          >
            Create Account
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

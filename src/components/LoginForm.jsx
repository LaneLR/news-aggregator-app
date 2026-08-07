"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Button from "@/components/Button";
import Loading from "@/app/loading";
import GoogleSignInButton from "./GoogleSignInButton";
import AuthLayout from "./AuthLayout";
import styles from "./LoginForm.module.scss";

export default function LoginPage() {
  const [user, setUser] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: session, status } = useSession();

  useEffect(() => {
    // Safety net for landing on /login while already signed in (e.g. via
    // back/forward navigation serving a cached page). A hard navigation
    // here avoids Next's client router cache showing stale logged-out
    // content — see handleLoginUser below for why that matters.
    if (status === "authenticated") {
      window.location.href = "/news";
    }
  }, [status]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  async function handleLoginUser(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email: user.email,
      password: user.password,
      redirect: false,
    });

    if (res.error) {
      setLoading(false);
      setError(`${res.error}`);
      return;
    }

    // A full navigation (not router.push) so the freshly-set session
    // cookie is guaranteed to be picked up on the next request, instead
    // of Next's client-side router cache potentially serving a
    // pre-login cached version of the page.
    window.location.href = "/news";
  }

  if (status === "loading") {
    return <Loading />;
  }

  return (
    <AuthLayout activeTab="signin">
      <div className={styles.formBody}>
        <h2 className={styles.formTitle}>Sign In</h2>
        <form className={styles.form} onSubmit={handleLoginUser}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email Address</span>
            <div className={styles.inputGroup}>
              <Mail size={17} strokeWidth={2} className={styles.inputIcon} />
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                value={user.email}
                onChange={handleChange}
              />
            </div>
          </label>

          <label className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <span className={styles.fieldLabel}>Password</span>
              <Link href="/forgot-password" className={styles.inlineLink}>
                Forgot Password?
              </Link>
            </div>
            <div className={styles.inputGroup}>
              <Lock size={17} strokeWidth={2} className={styles.inputIcon} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                value={user.password}
                onChange={handleChange}
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

          {error && <p className={styles.errorText}>{error}</p>}

          <Button
            bgColor={"var(--theme-primary)"}
            clr={"var(--theme-primary-contrast)"}
            type="submit"
            disabled={loading}
            wide={"100%"}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>Or continue with</span>
        </div>

        <div className={styles.socialRow}>
          <GoogleSignInButton
            onClick={() => signIn("google", { callbackUrl: "/news" })}
          />
        </div>
      </div>
    </AuthLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Button from "@/components/Button";
import Loading from "@/app/loading";
import GoogleSignInButton from "./GoogleSignInButton";
import styles from "./LoginForm.module.scss";

// Keyed on the custom `code` each CredentialsSignin subclass sets in
// src/lib/auth.js — res.error itself is always just the generic
// "CredentialsSignin" string for every credentials failure, so it can't
// distinguish these on its own (see auth.js's comment for why).
const ERROR_MESSAGES = {
  "no-account": "No account found with that email.",
  "account-inactive": "This account is inactive or deleted.",
  "google-only": "This account uses Google sign-in — try the button below instead.",
  "invalid-password": "Incorrect password.",
  "email-not-verified": "Please verify your email address before logging in.",
};
const DEFAULT_ERROR_MESSAGE = "Something went wrong signing in. Please try again.";

// Google sign-in (unlike the credentials form) does a full redirect back to
// /login?error=<type> on failure rather than resolving a promise here, so
// it's handled separately by reading the URL instead of a signIn() result.
const OAUTH_ERROR_MESSAGES = {
  OAuthAccountNotLinked:
    "That email is already registered with a password — sign in with your password instead, or use the same method you originally signed up with.",
  AccessDenied: "Google sign-in was cancelled.",
  AccountInactive: "This account is inactive or deleted.",
};

export default function LoginPage() {
  const [user, setUser] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(OAUTH_ERROR_MESSAGES[oauthError] || DEFAULT_ERROR_MESSAGE);
    }
  }, [searchParams]);

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
      setError(ERROR_MESSAGES[res.code] || DEFAULT_ERROR_MESSAGE);
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
    <div className={styles.formBody}>
      <h2 className={styles.formTitle}>Sign In</h2>

      {justVerified && (
        <div className={styles.verifiedBanner}>
          <CheckCircle2 size={16} strokeWidth={2} />
          Email verified — you can now sign in.
        </div>
      )}

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
  );
}

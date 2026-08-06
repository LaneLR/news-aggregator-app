"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";
import Loading from "@/app/loading";
import GoogleSignInButton from "./GoogleSignInButton";
import styles from "./LoginForm.module.scss";

export default function LoginPage() {
  const [user, setUser] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
    <div className={styles.pageWrapper}>
      <div className={styles.signInButtonWrapper}>
        {/* <div className={styles.ssoText}>Sign in with</div> */}
        <GoogleSignInButton
          onClick={() => signIn("google", { callbackUrl: "/news" })}
        />
      </div>
      <div className={styles.wrapper}>
        <div className={styles.header}>Login</div>
        <form className={styles.formWrapper} onSubmit={handleLoginUser}>
          <div className={styles.inputWrapper}>
            <input
              className={styles.loginFormInput}
              name="email"
              type="email"
              placeholder="Email"
              required
              value={user.email}
              onChange={handleChange}
            />
            <input
              className={styles.loginFormInput}
              name="password"
              type="password"
              placeholder="Password"
              required
              value={user.password}
              onChange={handleChange}
            />
          </div>
          <Button
            bgColor={"var(--theme-primary)"}
            clr={"var(--theme-primary-contrast)"}
            type="submit"
            disabled={loading}
          >
            Log in
          </Button>

          {error && (
            <>
              <br />
              <p style={{ color: "var(--theme-warning)" }}>{error}</p>
            </>
          )}

          <h5
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "20px",
            }}
          >
            <br />
            <div
              style={{
                color: "var(--theme-text)",
                textAlign: "center",
                display: "flex",
                gap: "5px",
              }}
            >
              <p>Don&apos;t have an account?</p>
              <Link href="/register">
                <u>Create one!</u>
              </Link>
            </div>
          </h5>
          <h5
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "20px",
            }}
          >
            <br />
            <div
              style={{
                color: "var(--theme-text)",
                textAlign: "center",
                display: "flex",
                gap: "5px",
              }}
            >
              <p>Forgot your password?</p>
              <Link href="/forgot-password">
                <u>Reset password</u>
              </Link>
            </div>
          </h5>
        </form>
        <br />
        <br />
      </div>
    </div>
  );
}

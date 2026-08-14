"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AuthLayout.module.scss";

// Self-determines the active tab from the current route rather than taking
// it as a prop — that's what lets this render once in the shared
// (auth)/layout.jsx (see that file) and stay mounted across the /login <->
// /register transition, instead of remounting (and re-fetching the parent
// layout's auth() check) on every switch, which is what caused a visible
// loading flash between the two tabs before.
export default function AuthTabs() {
  const pathname = usePathname();

  return (
    <div className={styles.tabRow}>
      <Link
        href="/login"
        className={`${styles.tab} ${pathname === "/login" ? styles.activeTab : ""}`}
      >
        Sign In
      </Link>
      <Link
        href="/register"
        className={`${styles.tab} ${pathname === "/register" ? styles.activeTab : ""}`}
      >
        Create Account
      </Link>
    </div>
  );
}

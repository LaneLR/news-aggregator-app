"use client";
import { signOut } from "next-auth/react";
import { User, CreditCard, Shield, Wallet, Bookmark, LogOut } from "lucide-react";
import NavTab from "./NavTab";
import styles from "./SideNavBar.module.scss";

export default function SideBarNav() {
  return (
    <nav className={styles.sideBarNavWrapper}>
      <span className={styles.sectionLabel}>Account</span>
      <NavTab href={"/account"} Icon={User}>
        Profile
      </NavTab>
      <NavTab href={"/account/subscription"} Icon={CreditCard}>
        Subscription
      </NavTab>
      <NavTab href={"/account/privacy"} Icon={Shield}>
        Privacy
      </NavTab>
      <NavTab href={"/account/payment"} Icon={Wallet}>
        Payment Details
      </NavTab>
      <NavTab href={"/archives"} Icon={Bookmark}>
        Archives
      </NavTab>
      <span className={styles.divider} />
      <button
        type="button"
        className={styles.logoutButton}
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut size={17} strokeWidth={2} />
        Log Out
      </button>
    </nav>
  );
}

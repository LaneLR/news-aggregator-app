"use client";
import { signOut } from "next-auth/react";
import { User, CreditCard, Bookmark, Heart, Settings, LogOut } from "lucide-react";
import NavTab from "./NavTab";
import styles from "./SideNavBar.module.scss";

export default function SideBarNav() {
  return (
    <nav className={styles.sideBarNavWrapper}>
      <span className={styles.sectionLabel}>Account</span>
      <NavTab href={"/account"} Icon={User}>
        Profile
      </NavTab>
      {/* <NavTab href={"/archives"} Icon={Bookmark}>
        Your Archives
      </NavTab> */}
      <NavTab href={"/liked"} Icon={Heart}>
        Liked Articles
      </NavTab>
      <NavTab href={"/account/subscription"} Icon={CreditCard}>
        Subscription &amp; Billing
      </NavTab>
      <NavTab href={"/settings"} Icon={Settings}>
        Settings
      </NavTab>
      <span className={styles.divider} />
      <button
        type="button"
        className={styles.logoutButton}
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut size={19} strokeWidth={2} />
        Log Out
      </button>
    </nav>
  );
}

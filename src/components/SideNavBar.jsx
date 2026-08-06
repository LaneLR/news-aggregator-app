"use client";
import { User, CreditCard, Shield, Wallet, Bookmark } from "lucide-react";
import NavTab from "./NavTab";
import styles from "./SideNavBar.module.scss";

export default function SideBarNav() {
  return (
    <nav className={styles.sideBarNavWrapper}>
      <NavTab href={"/account"} Icon={User}>
        Manage Account
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
    </nav>
  );
}

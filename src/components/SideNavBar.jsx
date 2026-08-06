"use client";
import NavTab from "./NavTab";
import styles from "./SideNavBar.module.scss";

export default function SideBarNav() {
  return (
    <nav className={styles.sideBarNavWrapper}>
      <NavTab href={"/account"}>Manage Account</NavTab>
      <NavTab href={"/account/subscription"}>Subscription</NavTab>
      <NavTab href={"/account/privacy"}>Privacy</NavTab>
      <NavTab href={"/account/payment"}>Payment Details</NavTab>
      <NavTab href={"/archives"}>Archives</NavTab>
    </nav>
  );
}

"use client";
import { Suspense } from "react";
import Loading from "../loading";
import SideBarNav from "@/components/SideNavBar";
import styles from "./layout.module.scss";

export default function AccountLayout({ children }) {
  return (
    <Suspense fallback={<Loading />}>
      <div className={styles.layoutRow}>
        <SideBarNav />
        <main className={styles.main}>{children}</main>
      </div>
    </Suspense>
  );
}

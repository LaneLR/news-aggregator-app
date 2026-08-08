"use client";
import { Suspense } from "react";
import Loading from "@/app/loading";
import SideBarNav from "./SideNavBar";
import styles from "./AccountShellLayout.module.scss";

// Sidebar + main shell shared by /account and /archives — Archives lives
// under a route group there (see src/app/archives/(account)/layout.js) so
// this wraps the private archive-management views without also wrapping
// the public /archives/shared/[slug] page.
export default function AccountShellLayout({ children }) {
  return (
    <Suspense fallback={<Loading />}>
      <div className={styles.layoutRow}>
        <SideBarNav />
        <main className={styles.main}>{children}</main>
      </div>
    </Suspense>
  );
}

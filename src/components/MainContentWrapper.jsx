"use client";
import { usePathname } from "next/navigation";
import ReaderNavSidebar from "./ReaderNavSidebar";
import { shouldShowSidebar } from "@/lib/navLinks";
import styles from "./MainContentWrapper.module.scss";

export default function MainContentWrapper({ children }) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname);

  return (
    <div className={styles.shell}>
      {showSidebar && <ReaderNavSidebar />}
      <main id="main-content" className={styles.wrapper}>
        {children}
      </main>
    </div>
  );
}

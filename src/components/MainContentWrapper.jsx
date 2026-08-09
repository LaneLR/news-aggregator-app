'use client'
import styles from "./MainContentWrapper.module.scss";

export default function MainContentWrapper({ children }) {
  return (
    <main id="main-content" className={styles.wrapper}>
      {children}
    </main>
  );
}

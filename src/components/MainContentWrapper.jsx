'use client'
import styles from "./MainContentWrapper.module.scss";

export default function MainContentWrapper({ children }) {
  return <div className={styles.wrapper}>{children}</div>;
}

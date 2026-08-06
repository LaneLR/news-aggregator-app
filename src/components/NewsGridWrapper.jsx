"use client";
import styles from "./NewsGridWrapper.module.scss";

export default function NewsGridWrapper({ children }) {
  return <div className={styles.wrapper}>{children}</div>;
}

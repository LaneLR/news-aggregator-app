"use client";
import Link from "next/link";
import styles from "./Footer.module.scss";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <div className={styles.footerWrapper}>
      <div className={styles.linkWrapper}>
        <div className={styles.textContainer}>
          <p>© {year} MorningFeeds</p>
          <p>·</p>
          <div className={styles.linkContainer}>
            <Link href={"/privacy"}>Privacy</Link>
          </div>
          <p>·</p>
          <div className={styles.linkContainer}>
            <Link href={"/about"}>About us</Link>
          </div>
          <p>·</p>
          <div className={styles.linkContainer}>
            <Link href={"/contact-us"}>Contact us</Link>
          </div>
        </div>
      </div>
      <p className={styles.disclaimer}>
        This site displays publicly available RSS content for informational
        purposes. All articles link to their original publishers and remain the
        intellectual property of their respective owners.
      </p>
    </div>
  );
}

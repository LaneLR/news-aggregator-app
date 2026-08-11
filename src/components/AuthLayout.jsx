import Link from "next/link";
import Image from "next/image";
import { Newspaper, TrendingUp, Bookmark } from "lucide-react";
import styles from "./AuthLayout.module.scss";

const HIGHLIGHTS = [
  {
    Icon: Newspaper,
    title: "Curated headlines",
    description: "Top stories from trusted sources, organized by category.",
  },
  {
    Icon: TrendingUp,
    title: "Markets & business",
    description: "Stay ahead with real-time market and business coverage.",
  },
  {
    Icon: Bookmark,
    title: "Save for later",
    description: "Archive articles and pick up right where you left off.",
  },
];

export default function AuthLayout({ activeTab, children }) {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.brandPanel}>
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoContainer}>
            <Image
              src={"/images/MochaReads-M.png"}
              alt="MochaReads logo"
              width={44}
              height={40}
            />
          </div>
          <div className={styles.logoText}>
            <span>mocha</span>
            <span>reads</span>
          </div>
        </Link>

        <h1 className={styles.brandHeadline}>
          Welcome to MochaReads.
          <br />
          One place for all your news.
        </h1>

        <ul className={styles.highlightList}>
          {HIGHLIGHTS.map(({ Icon, title, description }) => (
            <li key={title} className={styles.highlightItem}>
              <span className={styles.highlightIcon}>
                <Icon size={20} strokeWidth={2} />
              </span>
              <div>
                <p className={styles.highlightTitle}>{title}</p>
                <p className={styles.highlightDescription}>{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.card}>
          {(activeTab === "signin" || activeTab === "register") && (
            <div className={styles.tabRow}>
              <Link
                href="/login"
                className={`${styles.tab} ${activeTab === "signin" ? styles.activeTab : ""}`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={`${styles.tab} ${activeTab === "register" ? styles.activeTab : ""}`}
              >
                Create Account
              </Link>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

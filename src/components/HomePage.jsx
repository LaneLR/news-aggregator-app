"use client";

import Link from "next/link";
import styles from "./HomePage.module.scss";

export default function LandingPage() {
  return (
    <>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.headline}>Stay Informed. Your Way.</h1>
          <p className={styles.subHeadline}>
            Your daily source for News, Journals, & Market Data. Start your
            journey with the solid foundation you need.
          </p>
          <Link className={styles.ctaButton} href="/register">
            Get Started Free
          </Link>
          <p
            style={{
              fontSize: "0.9em",
              color: "var(--theme-text-light)",
              marginTop: "10px",
            }}
          >
            No credit card required.
          </p>
        </div>
      </div>

      <div className={styles.featuresSection}>
        <div className={styles.featureBlock}>
          <h3>Curated Feeds</h3>
          <p>
            Tired of noise? We only bring you the most essential articles and
            data streams.
          </p>
        </div>
        <div className={styles.featureBlock}>
          <h3>Deep Dive Journals</h3>
          <p>
            Access exclusive market analysis and in-depth academic publications.
          </p>
        </div>
        <div className={styles.featureBlock}>
          <h3>Market Intelligence</h3>
          <p>
            Your trusted lens to spot trends and movements before they become
            headlines.
          </p>
        </div>
      </div>
    </>
  );
}

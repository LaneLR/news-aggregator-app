"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./MostCovered.module.scss";

export default function MostCovered() {
  const [companies, setCompanies] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/market/most-covered")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Request failed"))))
      .then((json) => {
        if (!cancelled) setCompanies(json.companies);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error || (companies && companies.length === 0)) return null;

  const topCount = companies?.[0]?.count || 1;

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Most Covered This Week</h2>
      <p className={styles.helperText}>
        The companies appearing most often in Market, Finance, and Business headlines over the last 7 days.
      </p>
      <div className={styles.list}>
        {!companies
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`${styles.row} ${styles.rowSkeleton}`}>
                <div className={`${styles.shimmerLine} ${styles.shimmer}`} />
              </div>
            ))
          : companies.map((company) => {
              const barWidth = Math.max(8, Math.round((company.count / topCount) * 100));
              const row = (
                <>
                  <div className={styles.rowHeader}>
                    <span className={styles.name}>
                      {company.name}
                      <span className={styles.ticker}>{company.ticker}</span>
                    </span>
                    <span className={styles.count}>
                      {company.count} {company.count === 1 ? "mention" : "mentions"}
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${barWidth}%` }} />
                  </div>
                </>
              );
              return company.articleId ? (
                <Link key={company.ticker} href={`/article/${company.articleId}`} className={styles.row}>
                  {row}
                </Link>
              ) : (
                <div key={company.ticker} className={styles.row}>
                  {row}
                </div>
              );
            })}
      </div>
    </div>
  );
}

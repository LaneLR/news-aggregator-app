"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import styles from "./SectorPerformance.module.scss";

export default function SectorPerformance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/market/sectors")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Request failed"))))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Not configured (no FINNHUB_API_KEY) — quietly render nothing, same as
  // MarketTicker/Watchlist.
  if (data && !data.configured) return null;

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Sector Performance</h2>
      <div className={styles.grid}>
        {!data && !error ? (
          Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className={`${styles.card} ${styles.cardSkeleton}`}>
              <div className={`${styles.shimmerLine} ${styles.shimmer}`} />
              <div className={`${styles.shimmerLine} ${styles.shimmer}`} style={{ width: "60%" }} />
            </div>
          ))
        ) : error || data.quotes.length === 0 ? (
          <p className={styles.unavailable}>Sector data is temporarily unavailable.</p>
        ) : (
          data.quotes.map((quote) => {
            const isUp = quote.change >= 0;
            return (
              <div key={quote.symbol} className={styles.card}>
                <span className={styles.name}>{quote.displayName}</span>
                <span className={styles.price}>
                  {quote.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className={`${styles.change} ${isUp ? styles.up : styles.down}`}>
                  {isUp ? (
                    <TrendingUp size={14} strokeWidth={2.5} />
                  ) : (
                    <TrendingDown size={14} strokeWidth={2.5} />
                  )}
                  {isUp ? "+" : ""}
                  {quote.changePercent.toFixed(2)}%
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

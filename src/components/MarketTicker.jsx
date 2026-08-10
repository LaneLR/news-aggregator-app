"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import styles from "./MarketTicker.module.scss";

function formatUpdatedAt(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function MarketTicker() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/market/indices")
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

  // Not configured (no FINNHUB_API_KEY) — quietly render nothing rather
  // than a permanent "not set up" message in front of real users.
  if (data && !data.configured) return null;

  return (
    <div className={styles.ticker}>
      {!data && !error ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${styles.card} ${styles.cardSkeleton}`}>
            <div className={`${styles.shimmerLine} ${styles.shimmer}`} />
            <div className={`${styles.shimmerLine} ${styles.shimmer}`} style={{ width: "60%" }} />
          </div>
        ))
      ) : error || data.quotes.length === 0 ? (
        <p className={styles.unavailable}>Market data is temporarily unavailable.</p>
      ) : (
        <>
          {data.quotes.map((quote) => {
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
          })}
          {data.lastUpdated && (
            <p className={styles.lastUpdated}>Last updated at {formatUpdatedAt(data.lastUpdated)}</p>
          )}
        </>
      )}
    </div>
  );
}

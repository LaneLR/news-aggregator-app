"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { TRACKED_INDICES } from "@/lib/marketIndices";
import { CHART_RANGES } from "@/lib/chartData";
import styles from "./MarketChart.module.scss";

const RANGE_ORDER = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y", "10y", "max"];
const DEFAULT_RANGE = "1mo";
const CHART_WIDTH = 600;
const CHART_HEIGHT = 180;

function buildPath(points) {
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - ((p.price - min) / range) * CHART_HEIGHT;
    return [x, y];
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${CHART_WIDTH},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`;

  return { linePath, areaPath, min, max };
}

function formatPointDate(iso, range) {
  const date = new Date(iso);
  if (range === "1d" || range === "5d") {
    return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
  if (range === "5y" || range === "10y" || range === "max") {
    return date.toLocaleDateString([], { month: "short", year: "numeric" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function MarketChart() {
  const [symbol, setSymbol] = useState(TRACKED_INDICES[0].symbol);
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [points, setPoints] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPoints(null);
    setError(false);
    fetch(`/api/market/history?symbol=${symbol}&range=${range}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Request failed"))))
      .then((json) => {
        if (!cancelled) setPoints(json.points);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  const selectedIndex = TRACKED_INDICES.find((idx) => idx.symbol === symbol);
  const hasEnoughData = points && points.length >= 2;
  const first = hasEnoughData ? points[0].price : null;
  const last = hasEnoughData ? points[points.length - 1].price : null;
  const isUp = hasEnoughData ? last >= first : true;
  const { linePath, areaPath, min, max } = hasEnoughData ? buildPath(points) : {};

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>{selectedIndex.displayName} Trend</h2>
        <div className={styles.tabs}>
          {TRACKED_INDICES.map((idx) => (
            <button
              key={idx.symbol}
              type="button"
              className={`${styles.tab} ${idx.symbol === symbol ? styles.activeTab : ""}`}
              onClick={() => setSymbol(idx.symbol)}
            >
              {idx.displayName}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.rangeTabs}>
        {RANGE_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`${styles.rangeTab} ${key === range ? styles.activeRangeTab : ""}`}
            onClick={() => setRange(key)}
          >
            {CHART_RANGES[key].label}
          </button>
        ))}
      </div>

      <div className={styles.chartArea}>
        {error ? (
          <p className={styles.message}>Chart data is temporarily unavailable.</p>
        ) : !points ? (
          <div className={`${styles.chartSkeleton} ${styles.shimmer}`} />
        ) : !hasEnoughData ? (
          <p className={styles.message}>No chart data available for this range right now.</p>
        ) : (
          <>
            <div className={styles.priceRow}>
              <span className={styles.currentPrice}>
                {last.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`${styles.changeBadge} ${isUp ? styles.up : styles.down}`}>
                {isUp ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                {(((last - first) / first) * 100).toFixed(2)}%
              </span>
            </div>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`${selectedIndex.displayName} price trend`}
            >
              <path d={areaPath} className={`${styles.area} ${isUp ? styles.up : styles.down}`} />
              <path d={linePath} className={`${styles.line} ${isUp ? styles.up : styles.down}`} />
            </svg>
            <div className={styles.rangeRow}>
              <span>{formatPointDate(points[0].t, range)}</span>
              <span>
                Low {min.toLocaleString(undefined, { maximumFractionDigits: 2 })} · High{" "}
                {max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span>{formatPointDate(points[points.length - 1].t, range)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

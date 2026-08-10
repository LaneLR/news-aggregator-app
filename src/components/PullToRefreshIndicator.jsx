"use client";
import { RefreshCw } from "lucide-react";
import styles from "./PullToRefreshIndicator.module.scss";

const THRESHOLD = 70;

export default function PullToRefreshIndicator({ pullDistance, isRefreshing }) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      className={styles.wrapper}
      style={{ height: `${isRefreshing ? THRESHOLD : pullDistance}px`, opacity: progress }}
    >
      <RefreshCw
        size={20}
        strokeWidth={2.25}
        className={isRefreshing ? styles.spinning : styles.icon}
        style={isRefreshing ? undefined : { transform: `rotate(${progress * 360}deg)` }}
      />
    </div>
  );
}

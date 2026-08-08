"use client";
import { useState } from "react";

// Per-device drag-to-reorder persistence (category nav pills, header icon
// group) — localStorage rather than the account DB. The user explicitly
// wants this scoped to "this device", not synced across devices, and as a
// bonus it reads synchronously on mount so there's no flash back to the
// default order while a server round trip would still be in flight.
export function useLocalOrder(storageKey) {
  const [order, setOrderState] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const setOrder = (next) => {
    setOrderState(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Best-effort only — a full/unavailable localStorage just means the
      // custom order doesn't stick, not a functional break.
    }
  };

  return [order, setOrder];
}

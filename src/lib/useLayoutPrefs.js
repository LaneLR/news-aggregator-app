"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Account-synced reading preference (List/Card/Reader density) —
// intentionally the only field left here. Category-nav and header-icon
// order live in useLocalOrder.js instead: per-device, not per-account (see
// that file's comment for why).
export function useLayoutPrefs() {
  const { data: session } = useSession();
  const [viewDensity, setViewDensityState] = useState("reader");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/users/layout-prefs")
      .then((res) => res.json())
      .then((data) => {
        // Magazine density was removed (it rendered identically to Card,
        // just fewer/larger columns) — an account that saved it before the
        // removal falls back to Card rather than matching no toggle option.
        const density = data.viewDensity === "magazine" ? "card" : data.viewDensity;
        setViewDensityState(density || "reader");
        setLoaded(true);
      })
      .catch((err) => console.error("Failed to load layout prefs:", err));
  }, [session?.user?.id]);

  const setViewDensity = (density) => {
    setViewDensityState(density);
    if (!session?.user?.id) return;
    fetch("/api/users/layout-prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewDensity: density }),
    }).catch((err) => console.error("Failed to save layout prefs:", err));
  };

  return { loaded, viewDensity, setViewDensity };
}

// Applies a persisted custom order (array of stable keys) on top of a
// default-ordered list. Anything not mentioned in `order` keeps its
// relative position at the end — handles new items added after the user
// last customized their order.
export function applyCustomOrder(items, order, getKey) {
  if (!order || order.length === 0) return items;
  const byKey = new Map(items.map((item) => [getKey(item), item]));
  const ordered = order.map((key) => byKey.get(key)).filter(Boolean);
  const orderedKeys = new Set(order);
  const remaining = items.filter((item) => !orderedKeys.has(getKey(item)));
  return [...ordered, ...remaining];
}

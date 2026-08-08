"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Shared by HeaderNavBar (category order) and Header (icon group order) —
// one fetch-on-mount for both instead of two separate round trips, since
// they're both small per-user personalization arrays living on the same
// /api/users/layout-prefs endpoint.
export function useLayoutPrefs() {
  const { data: session } = useSession();
  const [categoryOrder, setCategoryOrderState] = useState([]);
  const [headerIconOrder, setHeaderIconOrderState] = useState([]);
  const [viewDensity, setViewDensityState] = useState("card");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/users/layout-prefs")
      .then((res) => res.json())
      .then((data) => {
        setCategoryOrderState(data.categoryOrder || []);
        setHeaderIconOrderState(data.headerIconOrder || []);
        setViewDensityState(data.viewDensity || "card");
        setLoaded(true);
      })
      .catch((err) => console.error("Failed to load layout prefs:", err));
  }, [session?.user?.id]);

  const persist = (partial) => {
    if (!session?.user?.id) return;
    fetch("/api/users/layout-prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    }).catch((err) => console.error("Failed to save layout prefs:", err));
  };

  const setCategoryOrder = (order) => {
    setCategoryOrderState(order);
    persist({ categoryOrder: order });
  };

  const setHeaderIconOrder = (order) => {
    setHeaderIconOrderState(order);
    persist({ headerIconOrder: order });
  };

  const setViewDensity = (density) => {
    setViewDensityState(density);
    persist({ viewDensity: density });
  };

  return {
    loaded,
    categoryOrder,
    headerIconOrder,
    viewDensity,
    setCategoryOrder,
    setHeaderIconOrder,
    setViewDensity,
  };
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

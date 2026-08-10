"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, X, Plus } from "lucide-react";
import styles from "./Watchlist.module.scss";

const MAX_SYMBOLS = 8;
const SYMBOL_PATTERN = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;

export default function Watchlist() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadWatchlist = () => {
    fetch("/api/market/watchlist")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Request failed"))))
      .then((json) => setData(json))
      .catch(() => setError(true));
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const persistSymbols = async (symbols) => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });
      if (!res.ok) throw new Error("Failed to update watchlist");
      loadWatchlist();
    } catch (err) {
      console.error("Failed to update watchlist:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const value = draft.trim().toUpperCase();
    const symbols = data?.symbols || [];

    if (!value) return;
    if (!SYMBOL_PATTERN.test(value)) {
      setDraftError("Not a valid ticker symbol.");
      return;
    }
    if (symbols.includes(value)) {
      setDraftError("Already on your watchlist.");
      return;
    }
    if (symbols.length >= MAX_SYMBOLS) {
      setDraftError(`You can track up to ${MAX_SYMBOLS} symbols.`);
      return;
    }

    setDraftError("");
    setDraft("");
    persistSymbols([...symbols, value]);
  };

  const handleRemove = (symbol) => {
    const symbols = (data?.symbols || []).filter((s) => s !== symbol);
    persistSymbols(symbols);
  };

  // Not configured (no FINNHUB_API_KEY) — same quiet-render-nothing
  // behavior as MarketTicker rather than a permanent "not set up" message.
  if (data && data.configured === false) return null;

  const symbols = data?.symbols || [];
  const quotesBySymbol = new Map((data?.quotes || []).map((q) => [q.symbol, q]));
  const atLimit = symbols.length >= MAX_SYMBOLS;

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Your Watchlist</h2>

      <form className={styles.addRow} onSubmit={handleAdd}>
        <input
          className={styles.input}
          type="text"
          placeholder={atLimit ? `Limit of ${MAX_SYMBOLS} reached` : "Add a ticker (e.g. AAPL)…"}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setDraftError("");
          }}
          disabled={saving || atLimit}
          maxLength={8}
        />
        <button type="submit" className={styles.addButton} disabled={saving || atLimit}>
          <Plus size={16} strokeWidth={2.5} />
          Add
        </button>
      </form>
      {draftError && <p className={styles.draftError}>{draftError}</p>}

      {symbols.length === 0 ? (
        !error && data && (
          <p className={styles.emptyText}>
            Add a ticker above to track it alongside the major indices.
          </p>
        )
      ) : (
        <div className={styles.grid}>
          {!data && !error
            ? symbols.map((symbol) => (
                <div key={symbol} className={`${styles.card} ${styles.cardSkeleton}`}>
                  <div className={`${styles.shimmerLine} ${styles.shimmer}`} />
                  <div className={`${styles.shimmerLine} ${styles.shimmer}`} style={{ width: "60%" }} />
                </div>
              ))
            : symbols.map((symbol) => {
                const quote = quotesBySymbol.get(symbol);
                return (
                  <div key={symbol} className={styles.card}>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => handleRemove(symbol)}
                      disabled={saving}
                      aria-label={`Remove ${symbol} from watchlist`}
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                    <span className={styles.name}>{symbol}</span>
                    {quote ? (
                      <>
                        <span className={styles.price}>
                          {quote.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span
                          className={`${styles.change} ${quote.change >= 0 ? styles.up : styles.down}`}
                        >
                          {quote.change >= 0 ? (
                            <TrendingUp size={14} strokeWidth={2.5} />
                          ) : (
                            <TrendingDown size={14} strokeWidth={2.5} />
                          )}
                          {quote.change >= 0 ? "+" : ""}
                          {quote.changePercent.toFixed(2)}%
                        </span>
                      </>
                    ) : (
                      <span className={styles.noData}>No data available</span>
                    )}
                  </div>
                );
              })}
        </div>
      )}

      {data?.lastUpdated && symbols.length > 0 && (
        <p className={styles.lastUpdated}>Last updated at{" "}
          {new Date(data.lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}

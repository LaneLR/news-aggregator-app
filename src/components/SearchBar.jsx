"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, Clock, X, ArrowRight } from "lucide-react";
import { getCategoryColor } from "@/lib/categoryColors";
import styles from "./SearchBar.module.scss";

const RECENT_KEY = "morningfeeds:recentSearches";
const MAX_RECENT = 5;

function loadRecent() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    // Private browsing / storage disabled — recent searches just won't persist.
  }
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // `window` doesn't exist during server rendering — default to the full
  // placeholder and only switch to the short one after mounting client-side.
  const [isNarrow, setIsNarrow] = useState(false);
  const router = useRouter();
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const checkWidth = () => setIsNarrow(window.innerWidth <= 430);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  useEffect(() => {
    setRecentSearches(loadRecent());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?query=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query, isOpen]);

  const runSearch = (rawQuery) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())];
      saveRecent(next);
      return next.slice(0, MAX_RECENT);
    });
    router.push(`/search?query=${encodeURIComponent(trimmed)}`);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const openArticle = (id) => {
    router.push(`/article/${id}`);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  };

  const removeRecent = (term, e) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const next = prev.filter((q) => q !== term);
      saveRecent(next);
      return next;
    });
  };

  const showingRecent = query.trim().length === 0;
  const listItems = showingRecent ? recentSearches : suggestions;
  // The trailing "See all results" row is only present once there's an
  // active query with matches — it isn't part of the recent-searches list.
  const hasTrailingRow = !showingRecent && suggestions.length > 0;

  const handleKeyDown = (e) => {
    const itemCount = listItems.length + (hasTrailingRow ? 1 : 0);

    if (e.key === "ArrowDown" && isOpen && itemCount > 0) {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % itemCount);
      return;
    }
    if (e.key === "ArrowUp" && isOpen && itemCount > 0) {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + itemCount) % itemCount);
      return;
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < listItems.length) {
        const item = listItems[highlightedIndex];
        if (showingRecent) runSearch(item);
        else openArticle(item.id);
        return;
      }
      if (highlightedIndex === listItems.length && hasTrailingRow) {
        runSearch(query);
        return;
      }
      if (query.trim()) runSearch(query);
    }
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <Search className={styles.icon} size={18} strokeWidth={2} />
      <input
        data-search-input
        className={styles.input}
        type="text"
        placeholder={isNarrow ? "Search..." : "Search by title, topic, or author..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-label="Search articles"
        aria-expanded={isOpen}
        aria-controls="search-suggestions-listbox"
        aria-autocomplete="list"
        autoComplete="off"
      />

      {isOpen && (listItems.length > 0 || hasTrailingRow) && (
        <div id="search-suggestions-listbox" className={styles.dropdown} role="listbox">
          {showingRecent ? (
            <>
              <p className={styles.dropdownLabel}>
                <Clock size={12} strokeWidth={2.5} />
                Recent searches
              </p>
              {recentSearches.map((term, i) => (
                <button
                  type="button"
                  key={term}
                  className={`${styles.suggestionRow} ${highlightedIndex === i ? styles.highlighted : ""}`}
                  onClick={() => runSearch(term)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  role="option"
                  aria-selected={highlightedIndex === i}
                >
                  <Clock size={15} strokeWidth={2} className={styles.rowIcon} />
                  <span className={styles.rowText}>{term}</span>
                  <span
                    className={styles.removeRecent}
                    onClick={(e) => removeRecent(term, e)}
                    role="button"
                    aria-label={`Remove "${term}" from recent searches`}
                  >
                    <X size={13} strokeWidth={2.5} />
                  </span>
                </button>
              ))}
            </>
          ) : (
            <>
              {suggestions.map((article, i) => {
                const badgeCategory = Array.isArray(article.category) ? article.category[0] : null;
                return (
                  <button
                    type="button"
                    key={article.id}
                    className={`${styles.suggestionRow} ${highlightedIndex === i ? styles.highlighted : ""}`}
                    onClick={() => openArticle(article.id)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    role="option"
                    aria-selected={highlightedIndex === i}
                  >
                    <span
                      className={styles.categoryDot}
                      style={{ backgroundColor: badgeCategory ? getCategoryColor(badgeCategory) : "var(--theme-border)" }}
                    />
                    <span className={styles.rowText}>
                      {article.title}
                      <span className={styles.rowSource}>{article.sourceName}</span>
                    </span>
                  </button>
                );
              })}
              {hasTrailingRow && (
                <button
                  type="button"
                  className={`${styles.suggestionRow} ${styles.seeAllRow} ${
                    highlightedIndex === suggestions.length ? styles.highlighted : ""
                  }`}
                  onClick={() => runSearch(query)}
                  onMouseEnter={() => setHighlightedIndex(suggestions.length)}
                  role="option"
                  aria-selected={highlightedIndex === suggestions.length}
                >
                  <span className={styles.rowText}>See all results for &quot;{query.trim()}&quot;</span>
                  <ArrowRight size={15} strokeWidth={2} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

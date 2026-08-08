"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import styles from "./SearchBar.module.scss";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  // `window` doesn't exist during server rendering — default to the full
  // placeholder and only switch to the short one after mounting client-side.
  const [isNarrow, setIsNarrow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkWidth = () => setIsNarrow(window.innerWidth <= 430);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      const newQuery = query.trim();
      const newUrl = `/search?query=${encodeURIComponent(newQuery)}`;

      router.push(newUrl);
      setQuery("");
    }
  };
  return (
    <div className={styles.wrapper}>
      <Search className={styles.icon} size={18} strokeWidth={2} />
      <input
        data-search-input
        className={styles.input}
        type="text"
        placeholder={isNarrow ? "Search..." : "Search by title, topic, or author..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

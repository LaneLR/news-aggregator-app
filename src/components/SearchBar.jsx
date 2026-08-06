"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "styled-components";

const SearchBarWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SearchInput = styled.input`
  font-size: 1.2rem;
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid ${(props) => props.theme.border};
  color: ${(props) => props.theme.darkBlue};
  background-color: ${(props) => props.theme.searchBackground};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.border};
  }
`;

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
      router.refresh();
    }
  };
  return (
    <>
      <SearchBarWrapper>
        <SearchInput
          type="text"
          placeholder={isNarrow ? "Search..." : "Search by title, topic, or author..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </SearchBarWrapper>
    </>
  );
}

"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "styled-components";

const SearchBarWrapper = styled.div`
  width: 100%;
  // width: 1240px;
  margin: 5px 0 10px 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SearchInput = styled.input`
  font-size: 1.4rem;
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ccc;
  color: var(--dark-blue);
  background-color: white;

  &:focus {
    outline: none;
    border-color: #fff;
  }
`;

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
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
          placeholder={window.innerWidth <= 430 ? "Search..." : "Search by title, topic, or author..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </SearchBarWrapper>
    </>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

const SearchBarWrapper = styled.div`
  width: 80%;
  max-width: 1200px;
  margin: 5px 0 10px 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SearchInput = styled.input`
  font-size: 1.4rem;
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;

  &:focus {
    outline: none;
    border-color: #9e6532;
  }
`;

const ResultsWrapper = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 15px;
  width: 80%;
  max-width: 1200px;
`;

const ResultItem = styled.li`
  padding: 10px;
  border-bottom: 1px solid #ccc;
  background-color: white;
  color: black;
  border-radius: 4px;
  margin-bottom: 5px;
`;

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      const newQuery = query.trim();
      const newUrl = `/search?query=${encodeURIComponent(newQuery)}`;

      router.push(newUrl);
      router.refresh();
    }
  };
  return (
    <SearchBarWrapper>
      <SearchInput
        type="text"
        placeholder="Search articles by title"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </SearchBarWrapper>
  );
}

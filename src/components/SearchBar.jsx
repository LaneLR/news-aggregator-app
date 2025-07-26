"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";

const SearchBarWrapper = styled.div`
  // width: 90%;
  width: 1240px;
  margin: 5px 0 10px 0;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 1290px) {
    width: 820px;
  }

  @media (max-width: 885px) {
    width: 400px;
  }

  @media (max-width: 600px) {
    width: 372px;
  }
`;

const SearchInput = styled.input`
  font-size: 1.4rem;
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ccc;

  &:focus {
    outline: none;
    border-color: #9e6532;
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
      router.refresh();
    }
  };
  return (
    <SearchBarWrapper>
      <SearchInput
        type="text"
        placeholder="Search by title, topic, or author..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </SearchBarWrapper>
  );
}

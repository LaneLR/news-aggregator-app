import SearchFeed from "@/components/SearchFeed";
import { notFound } from "next/navigation";

export default function SearchResultsPage({ searchParams }) {
  const query = searchParams?.query?.toLowerCase() || "";

  if (!query.trim()) return notFound();

  return (
    <>
      <SearchFeed key={query} initialQuery={query} />
    </>
  );
}

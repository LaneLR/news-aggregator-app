import SearchFeed from "@/components/SearchFeed";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export default async function SearchResultsPage({ searchParams }) {
    const session = await auth();

    if (!session) {
      redirect("/login");
    }
  const params = await searchParams;
  const query = params?.query?.toLowerCase() || "";

  if (!query.trim()) return notFound();

  return (
    <>
      <SearchFeed key={query} initialQuery={query} />
    </>
  );
}

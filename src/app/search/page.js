import SearchFeed from "@/components/SearchFeed";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

export default async function SearchResultsPage({ searchParams }) {
    const session = await getServerSession(authOptions);

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

import SearchFeed from "@/components/SearchFeed";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import styles from "@/components/SearchFeed.module.scss";

export const metadata = {
  title: "Search",
  robots: { index: false, follow: false },
};

export default async function SearchResultsPage({ searchParams }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }
  const params = await searchParams;
  const query = params?.query?.toLowerCase() || "";

  if (!query.trim()) {
    // Landing here with no query — e.g. the mobile tab bar's Search icon,
    // which links to bare /search — used to 404 outright via notFound(),
    // a dead end for anyone who didn't already have a query typed into the
    // header's search bar. That search bar is already visible on this page
    // (see Header.jsx), so this is just a prompt to use it, not a 404.
    return (
      <div className={`${styles.emptyState} ${styles.landingPrompt}`}>
        <Search size={32} strokeWidth={1.5} />
        <p>Search MochaReads</p>
        <p className={styles.emptyStateHint}>
          Use the search bar above to find articles, sources, and topics.
        </p>
      </div>
    );
  }

  return (
    <>
      <SearchFeed key={query} initialQuery={query} />
    </>
  );
}

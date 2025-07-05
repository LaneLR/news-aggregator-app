//keep as server component
export const dynamic = "force-dynamic"; // <-- ADD THIS LINE TEMPORARILY

import Header from "@/components/Header";
import Link from "next/link";
import NewsFeed from "@/components/NewsFeed";
import { Suspense } from "react";
import LoadingComponent from "@/components/Loading";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  return (
    <>
      <Suspense fallback={<LoadingComponent />}>
        <h1>What&apos;s making the news</h1>
        <SearchBar />
        <NewsFeed />
      </Suspense>
    </>
  );
}

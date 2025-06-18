//keep as server component
import Header from "@/components/Header";
import Link from "next/link";
import NewsFeed from "@/components/NewsFeed";
import { Suspense } from "react";
import LoadingComponent from "@/components/Loading";

export default function Home() {
  return (
    <>
      <Suspense fallback={<LoadingComponent />}>
        <NewsFeed />
      </Suspense>
    </>
  );
}

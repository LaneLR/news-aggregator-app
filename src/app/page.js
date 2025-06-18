//keep as server component
import Header from "@/components/Header";
import Link from "next/link";
import NewsFeed from "@/components/NewsFeed";


export default function Home() {
  return (
    <>
      <NewsFeed />
    </>
  );
}

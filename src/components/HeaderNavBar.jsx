"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "./HeaderNavBar.module.scss";

export default function HeaderNavBar() {
  const { data: session } = useSession();

  const isNotSubscribed = session?.user?.tier === "Free";

  return (
    <>
      <div className={styles.wrapper}>
        {isNotSubscribed ? null : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Link href={"/for-you"}>For You</Link>
          </div>
        )}
        {isNotSubscribed ? null : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Link href={"/feeds"}>My Feeds</Link>
          </div>
        )}
        {isNotSubscribed ? null : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Link href={"/category/journal"}>Journals</Link>
          </div>
        )}
        {isNotSubscribed ? null : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Link href={"/category/market"}>Market</Link>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href={"/category/science"}>Science</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href={"/category/business"}>Business</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href={"/category/health"}>Health</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href={"/category/entertainment"}>Entertainment</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href={"/category/tech"}>Tech</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href={"/category/politics"}>Politics</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href={"/category/sports"}>Sports</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href={"/category/world"}>World</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href={"/category/us"}>US</Link>
        </div>
        {isNotSubscribed ? null : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Link href={"/category/finance"}>Finance</Link>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href={"/category/weather"}>Weather</Link>
        </div>
      </div>
    </>
  );
}

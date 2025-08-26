"use client";

import { useSession } from "next-auth/react";
import LoadingDots from "./Loading";
import Loading from "@/app/loading";

export default function AccountClientPage() {
  const { data: session, status, update } = useSession();

  if (status === "loading") return <Loading />;
  if (!session) return <p>Access Denied</p>;

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}

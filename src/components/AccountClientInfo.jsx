"use client";
import { useSession } from "next-auth/react";

export default function AccountClientInfo() {
  const { data: session, status } = useSession();
  if (status === "loading") return <p>Loading...</p>;
  if (!session) return <p>Please log in</p>;

  return <p>You're signed in as {session.user.email}</p>;
}

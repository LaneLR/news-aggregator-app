"use client";
import { useSession } from "next-auth/react";
import LoadingDots from "./Loading";
import Loading from "@/app/loading";

export default function AccountClientInfo() {
  const { data: session, status } = useSession();
  if (status === "loading")
    return (
<Loading />
    );
  if (!session) return <p>Please log in</p>;

  return <p>You're signed in as {session.user.email}</p>;
}

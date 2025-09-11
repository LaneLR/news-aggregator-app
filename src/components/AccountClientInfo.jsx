"use client";
import { useSession } from "next-auth/react";
import LoadingDots from "./Loading";
import Loading from "@/app/loading";

export default function AccountClientInfo({ sessionData }) {
  const { data: session, status, update } = useSession({ data: sessionData });
  if (status === "loading") return <Loading />;
  if (!session) return <p>Please log in</p>;

  return <p>You're signed in as {session.user.email}</p>;
}

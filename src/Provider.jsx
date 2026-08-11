"use client";
import AuthProvider from "./components/SessionProvider";

export default function Providers({ children, session }) {
  return <AuthProvider session={session}>{children}</AuthProvider>;
}

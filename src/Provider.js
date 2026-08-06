"use client";
import AuthProvider from "./components/SessionProvider";

export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

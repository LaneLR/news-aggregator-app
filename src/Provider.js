"use client";
import { useState, useEffect } from "react";
import AuthProvider from "./components/SessionProvider";
import LoadingDots from "./components/Loading";
import Loading from "./app/loading";

export default function Providers({ children }) {
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingAuth(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return <AuthProvider>{loadingAuth ? <Loading /> : children}</AuthProvider>;
}

"use client";
import { useState, useEffect } from "react";
import SessProvider from "./components/SessionProvider";
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

  return <SessProvider>{loadingAuth ? <Loading /> : children}</SessProvider>;
}

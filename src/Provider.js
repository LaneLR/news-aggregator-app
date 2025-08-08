"use client";
import { useState, useEffect } from "react";
import SessProvider from "./components/SessionProvider";
import LoadingComponent from "./components/Loading";

export default function Providers({ children }) {
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingAuth(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SessProvider>
      {loadingAuth ? (
        <LoadingComponent />
      ) : (
        children
      )}
    </SessProvider>
  );
}

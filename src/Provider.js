"use client";
import { useState, useEffect } from "react";
import SessProvider from "./components/SessionProvider";

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
        <div
          style={{
            fontSize: "3rem",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Loading feed...
        </div>
      ) : (
        children
      )}
    </SessProvider>
  );
}

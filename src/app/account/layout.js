"use client";
import { Suspense } from "react";
import Loading from "../loading";
import { useTheme } from "styled-components";

export default function AccountLayout({ children }) {
  const theme = useTheme();
  return (
    <>
      <Suspense fallback={<Loading />}>
        <div
          style={{
            display: "flex",
            height: "100%",
            padding: "15px",
            width: "100%",
            backgroundColor: theme.layoutBackground,
          }}
        >
          <main
            style={{
              flexGrow: "1",
              width: "100%",
              backgroundColor: theme.layoutBackground,
              color: theme.text,
            }}
          >
            {children}
          </main>
        </div>
      </Suspense>
    </>
  );
}

import { Suspense } from "react";
import Loading from "../loading";

export default function SettingsLayout({ children }) {
  return (
    <Suspense fallback={<Loading />}>
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          padding: "15px",
          boxSizing: "border-box",
        }}
      >
        <main style={{ flexGrow: "1", width: "100%" }}>{children}</main>
      </div>
    </Suspense>
  );
}

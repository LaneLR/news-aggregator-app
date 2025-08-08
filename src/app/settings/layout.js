import LoadingDots from "@/components/Loading";
import { Suspense } from "react";
import Loading from "../loading";

export default function AccountLayout({ children }) {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <div
          style={{
            display: "flex",
            height: "100%",
            padding: "15px",
            width: "100%",
          }}
        >
          <div style={{ height: "100%" }}>{/* <SideBarNav /> */}</div>
          <div style={{ display: "flex", height: "100%", width: "100%" }}>
            <main style={{ flexGrow: "1", width: "100%" }}>{children}</main>
          </div>
        </div>
      </Suspense>
    </>
  );
}

import LoadingComponent from "@/components/Loading";
import SideBarNav from "@/components/SideNavBar";
import { Suspense } from "react";

export default function AccountLayout({ children }) {
  return (
    <>
      <Suspense fallback={<LoadingComponent />}>
        <div
          style={{
            display: "flex",
            height: "100%",
            padding: "15px",
            width: "100%",
          }}
        >
          <div style={{ height: "100%" }}>
            {/* <SideBarNav /> */}
          </div>
          <div style={{ display: "flex", height: "100%", width: "100%" }}>
            <main style={{ flexGrow: "1", width: "100%" }}>{children}</main>
          </div>
        </div>
      </Suspense>
    </>
  );
}

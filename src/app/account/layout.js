import SideBarNav from "@/components/SideNavBar";

export default function AccountLayout({ children }) {
  return (
    <>
      <div style={{ display: "flex", height: "90vh", padding: "10px",}}>
        <div style={{ height: "100%" }}>
          <SideBarNav />
        </div>
        <div style={{ display: "flex", height: "100%" }}>
          <main style={{ flexGrow: "1" }}>{children}</main>
        </div>
      </div>
    </>
  );
}

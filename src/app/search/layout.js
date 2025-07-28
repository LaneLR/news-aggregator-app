import SearchBar from "@/components/SearchBar";

export default function SearchLayout({ children }) {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "start",
          width: "100%",
        }}
      >
        <main>{children}</main>
      </div>
    </>
  );
}

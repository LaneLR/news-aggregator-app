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
        <h1>What&apos;s making the news</h1>
        <SearchBar />
      </div>
      <main>{children}</main>
    </>
  );
}

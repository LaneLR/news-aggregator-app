import styled from "styled-components";
import CreateNewArchiveCard from "./CreateNewArchiveCard";
import ArchiveCard from "./ArchiveCard";

export default function ArchivePage() {
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
        {archives.map((archive) => (
          <ArchiveCard key={archive.id} archive={archive} />
        ))}
        <CreateNewArchiveCard
          onClick={() => {
          }}
        />
      </div>
    </>
  );
}

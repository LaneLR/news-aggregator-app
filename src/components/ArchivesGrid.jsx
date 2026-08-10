"use client";
import { useDragReorder } from "@/lib/useDragReorder";
import { useLocalOrder } from "@/lib/useLocalOrder";
import { applyCustomOrder } from "@/lib/useLayoutPrefs";
import DeleteArchiveButton from "@/components/DeleteArchiveButton";
import ArchiveCard from "@/components/ArchiveCard";
import NewsGridWrapper from "@/components/NewsGridWrapper";
import CreateNewArchiveCard from "@/components/CreateNewArchiveCard";
import styles from "./ArchivesGrid.module.scss";

// Per-device order (like the category nav pills), not synced to the
// account — this is "how I like to see MY list arranged", not identity data.
export default function ArchivesGrid({ archives }) {
  const [archiveOrder, setArchiveOrder] = useLocalOrder("morningfeeds:archiveOrder");
  const orderedArchives = applyCustomOrder(archives, archiveOrder, (a) => a.id);

  const { draggedIndex, dragOverIndex, getHandlers } = useDragReorder(
    orderedArchives,
    (reordered) => setArchiveOrder(reordered.map((a) => a.id))
  );

  return (
    <NewsGridWrapper>
      <CreateNewArchiveCard />
      {orderedArchives.map((archive, i) => (
        <div
          key={archive.id}
          className={`${styles.dragWrapper} ${draggedIndex === i ? styles.dragging : ""} ${
            dragOverIndex === i ? styles.dragOver : ""
          }`}
          {...getHandlers(i)}
        >
          <ArchiveCard archive={archive}>
            {archive.name !== "Saved for later" && <DeleteArchiveButton archiveId={archive.id} />}
          </ArchiveCard>
        </div>
      ))}
    </NewsGridWrapper>
  );
}

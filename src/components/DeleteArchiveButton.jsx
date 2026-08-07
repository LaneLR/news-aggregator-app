"use client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import styles from "./DeleteArchiveButton.module.scss";

export default function DeleteArchiveButton({ archiveId }) {
  const router = useRouter();

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this archive?")) return;

    const res = await fetch(`/api/archives/${archiveId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    } else {
      console.error("Failed to delete archive");
    }
  };

  return (
    <button
      type="button"
      className={styles.deleteButton}
      onClick={handleDelete}
      title="Delete archive"
      aria-label="Delete archive"
    >
      <Trash2 size={15} strokeWidth={2} />
    </button>
  );
}

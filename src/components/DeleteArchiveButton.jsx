"use client";
import { useRouter } from "next/navigation";
import { useTheme } from "styled-components";

export default function DeleteArchiveButton({ archiveId }) {
  const router = useRouter();
  const theme = useTheme();

  const handleDelete = async () => {
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
      onClick={handleDelete}
      style={{ marginLeft: "10px", color: theme.primary, fontSize: "0.8rem" }}
    >
      Delete
    </button>
  );
}

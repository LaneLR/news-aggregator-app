"use client";
import { useRouter } from "next/navigation";

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
      onClick={handleDelete}
      style={{
        color: "var(--theme-button-text)",
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        border: "none",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "0.8rem",
        cursor: "pointer",
      }}
    >
      Delete
    </button>
  );
}

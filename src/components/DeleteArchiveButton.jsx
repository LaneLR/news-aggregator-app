"use client";
import { useRouter } from "next/navigation";

export default function DeleteArchiveButton({ archiveId }) {
  const router = useRouter();

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
      style={{ marginLeft: "10px", color: "red", fontSize: "0.8rem" }}
    >
      Delete
    </button>
  );
}

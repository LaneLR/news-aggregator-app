"use client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useConfirm } from "./ConfirmDialogProvider";
import { useToast } from "./ToastProvider";
import styles from "./DeleteArchiveButton.module.scss";

export default function DeleteArchiveButton({ archiveId }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm({
      title: "Delete this archive?",
      message: "This will permanently delete the archive and every article saved in it. This action cannot be undone.",
      confirmLabel: "Delete archive",
      danger: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/archives/${archiveId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Archive deleted.");
      router.refresh();
    } else {
      console.error("Failed to delete archive");
      toast.error("Failed to delete archive. Please try again.");
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

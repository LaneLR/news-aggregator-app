"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import styles from "./CreateNewArchiveCard.module.scss";

export default function CreateNewArchiveCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Archive name cannot be empty.");
      return;
    }

    try {
      const res = await fetch("/api/archives", {
        method: "POST",
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setName("");
        setError("");
        setIsModalOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create archive.");
      }
    } catch (err) {
      console.error("Failed to create archive:", err);
      setError("An unexpected error occurred.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName("");
    setError("");
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleCloseModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.cardContainer}
        onClick={() => setIsModalOpen(true)}
      >
        <span className={styles.plusIcon}>
          <Plus size={26} strokeWidth={2} />
        </span>
        <p className={styles.createText}>Create New Archive</p>
      </button>

      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={handleCloseModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-archive-title"
          >
            <h2 id="create-archive-title" className={styles.modalHeader}>
              Create New Archive
            </h2>
            <input
              className={styles.input}
              type="text"
              placeholder="Enter archive name"
              aria-label="Archive name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              autoFocus
            />
            {error && <p className={styles.errorText}>{error}</p>}
            <div className={styles.buttonContainer}>
              <button
                className={`${styles.button} ${styles.cancel}`}
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.create}`}
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

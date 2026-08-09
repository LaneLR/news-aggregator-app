"use client";
import { useState, useEffect } from "react";
import Button from "./Button";
import { useToast } from "./ToastProvider";
import { useConfirm } from "./ConfirmDialogProvider";
import styles from "./CreateFeedModal.module.scss";

export default function CreateFeedModal({
  isOpen,
  onClose,
  onSuccess,
  feedToEdit,
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [title, setTitle] = useState("");
  const [availableSources, setAvailableSources] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());

  const isEditMode = !!feedToEdit;

  const resetForm = () => {
    setTitle("");
    setSelectedSources(new Set());
    setSelectedCategories(new Set());
  };

  useEffect(() => {
    if (isEditMode) {
      setTitle(feedToEdit.title);
      setSelectedSources(new Set(feedToEdit.sourceNames));
      setSelectedCategories(new Set(feedToEdit.categories));
    } else {
      setTitle("");
      setSelectedSources(new Set());
      setSelectedCategories(new Set());
    }

    if (isOpen) {
      const fetchFilters = async () => {
        const res = await fetch("/api/filters");
        const data = await res.json();
        setAvailableSources(data.sources || []);
        setAvailableCategories(data.categories || []);
      };
      fetchFilters();
    }
  }, [isOpen, feedToEdit, isEditMode]);

  const handleToggle = (item, set, currentSet) => {
    const newSet = new Set(currentSet);
    if (newSet.has(item)) newSet.delete(item);
    else newSet.add(item);
    set(newSet);
  };

  const handleSave = async () => {
    const feedData = {
      title,
      sourceNames: Array.from(selectedSources),
      categories: Array.from(selectedCategories),
    };

    const url = isEditMode ? `/api/feeds/${feedToEdit.id}` : "/api/feeds";
    const method = isEditMode ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedData),
    });

    if (res.ok) {
      toast.success(isEditMode ? "Feed updated." : "Feed created.");
      onSuccess();
      resetForm();
      onClose();
    } else {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} feed.`);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;

    const ok = await confirm({
      title: "Delete this feed?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete feed",
      danger: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/feeds/${feedToEdit.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Feed deleted.");
      onSuccess();
      onClose();
    } else {
      toast.error("Failed to delete feed.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.formTitle}>
          {isEditMode ? "Edit Feed" : "Create a New Feed"}
        </h2>
        <input
          className={styles.titleInput}
          type="text"
          placeholder="Feed Name (e.g., 'Tech News')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <h4 className={styles.categoryNames}>Select Sources</h4>
        <div className={styles.filterList}>
          {availableSources.map((source) => (
            <label
              key={source}
              className={`${styles.filterCheckbox} ${
                selectedSources.has(source) ? styles.checked : ""
              }`}
            >
              <input
                type="checkbox"
                hidden
                onChange={() =>
                  handleToggle(source, setSelectedSources, selectedSources)
                }
              />
              {source}
            </label>
          ))}
        </div>

        <h4 className={styles.categoryNames}>Select Categories</h4>
        <div className={styles.filterList}>
          {availableCategories.map((cat) => (
            <label
              key={cat}
              className={`${styles.filterCheckbox} ${
                selectedCategories.has(cat) ? styles.checked : ""
              }`}
            >
              <input
                type="checkbox"
                hidden
                onChange={() =>
                  handleToggle(cat, setSelectedCategories, selectedCategories)
                }
              />
              {cat}
            </label>
          ))}
        </div>
        <div
          className={`${styles.buttonWrapper} ${
            !isEditMode ? styles.singleAction : ""
          }`}
        >
          {isEditMode ? (
            <>
              <Button
                onClick={handleDelete}
                bgColor={"var(--theme-warning)"}
                clr={"var(--theme-button-text)"}
              >
                Delete Feed
              </Button>
              <Button
                onClick={handleSave}
                bgColor={"var(--theme-primary)"}
                clr={"var(--theme-primary-contrast)"}
              >
                Save Feed
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSave}
              bgColor={"var(--theme-primary)"}
              clr={"var(--theme-primary-contrast)"}
            >
              Create Feed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import Button from "./Button";
import styles from "./CreateFeedModal.module.scss";

export default function CreateFeedModal({
  isOpen,
  onClose,
  onSuccess,
  feedToEdit,
}) {
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
      onSuccess();
      resetForm();
      onClose();
    } else {
      alert(`Failed to ${isEditMode ? "update" : "create"} feed.`);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;

    if (
      window.confirm(
        "Are you sure you want to delete this feed? This action cannot be undone."
      )
    ) {
      const res = await fetch(`/api/feeds/${feedToEdit.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to delete feed.");
      }
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
          type="text"
          placeholder="Feed Name (e.g., 'Tech News')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "1rem" }}
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
        <div className={styles.buttonWrapper}>
          {isEditMode ? (
            <>
              {" "}
              <Button
                onClick={handleSave}
                bgColor={"var(--theme-primary)"}
                clr={"var(--theme-text)"}
                style={{ marginLeft: "auto" }}
              >
                Save Feed
              </Button>
              <Button
                onClick={handleDelete}
                bgColor={"var(--theme-warning)"}
                clr={"var(--theme-text-tertiary)"}
              >
                Delete Feed
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSave}
              bgColor={"var(--theme-primary)"}
              clr={"var(--theme-text)"}
              style={{ marginLeft: "auto" }}
            >
              Create Feed
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

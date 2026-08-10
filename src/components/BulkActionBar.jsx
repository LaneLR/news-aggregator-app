"use client";
import { CheckCheck, Bookmark, Heart, X } from "lucide-react";
import styles from "./BulkActionBar.module.scss";

export default function BulkActionBar({ count, onMarkRead, onSave, onLike, onCancel, busy }) {
  if (count === 0) return null;

  return (
    <div className={styles.bar}>
      <span className={styles.count}>{count} selected</span>
      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={onMarkRead} disabled={busy}>
          <CheckCheck size={16} strokeWidth={2.25} />
          <span>Mark read</span>
        </button>
        <button type="button" className={styles.actionButton} onClick={onSave} disabled={busy}>
          <Bookmark size={16} strokeWidth={2.25} />
          <span>Save</span>
        </button>
        <button type="button" className={styles.actionButton} onClick={onLike} disabled={busy}>
          <Heart size={16} strokeWidth={2.25} />
          <span>Like</span>
        </button>
      </div>
      <button type="button" className={styles.cancelButton} onClick={onCancel} aria-label="Cancel selection">
        <X size={18} strokeWidth={2.25} />
      </button>
    </div>
  );
}

"use client";
import { CheckCheck } from "lucide-react";
import styles from "./MarkAllReadButton.module.scss";

export default function MarkAllReadButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      className={styles.markAllReadButton}
      onClick={onClick}
      disabled={disabled}
    >
      <CheckCheck size={16} strokeWidth={2} />
      <span>Mark all as read</span>
    </button>
  );
}

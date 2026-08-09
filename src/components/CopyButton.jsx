"use client";
import { useState } from "react";
import { Copy, Check, X } from "lucide-react";
import { useToast } from "./ToastProvider";
import styles from "./CopyButton.module.scss";

export default function CopyButton({ textToCopy }) {
  const toast = useToast();
  const [copyStatus, setCopyStatus] = useState("Copy");

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard access isn't available in this browser.");
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus("Copied");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setCopyStatus("Failed!");
    } finally {
      setTimeout(() => {
        setCopyStatus("Copy");
      }, 2000);
    }
  };

  return (
    <button
      className={`${styles.wrapper} ${copyStatus === "Copied" ? styles.copied : ""} ${
        copyStatus === "Failed!" ? styles.failed : ""
      }`}
      onClick={handleCopy}
    >
      {copyStatus === "Copy" && <Copy size={18} strokeWidth={2} />}
      {copyStatus === "Copied" && <Check size={18} strokeWidth={2} />}
      {copyStatus === "Failed!" && <X size={18} strokeWidth={2} />}
      <div>{copyStatus}</div>
    </button>
  );
}

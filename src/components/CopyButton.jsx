"use client";
import { useState } from "react";
import styles from "./CopyButton.module.scss";

export default function CopyButton({ textToCopy }) {
  const [copyStatus, setCopyStatus] = useState("Copy");

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      alert("Clipboard API not available.");
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

  const status = copyStatus.toUpperCase();

  return (
    <button
      className={`${styles.wrapper} ${status === "Copied" ? styles.copied : ""}`}
      onClick={handleCopy}
    >
      {copyStatus === "Copy" ? (
        <img
          src="/images/copy-unfilled-white.svg"
          height={29}
          width={29}
          alt="Copy referral code"
        />
      ) : copyStatus === "Copied" ? (
        <img
          src="/images/copy-filled-white.svg"
          height={29}
          width={29}
          alt="Referral code copied"
        />
      ) : (
        <img
          src="/images/copy-unfilled.svg"
          height={29}
          width={29}
          alt="Copy referral code"
        />
      )}
      <div style={{ width: "100%" }}>{copyStatus}</div>
    </button>
  );
}

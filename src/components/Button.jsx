"use client";
import styles from "./Button.module.scss";

export default function Button({ bgColor, clr, wide, children, onClick, disabled, type, className }) {
  return (
    <button
      type={type || "button"}
      className={className ? `${styles.wrapper} ${className}` : styles.wrapper}
      style={{ backgroundColor: bgColor, color: clr, width: wide }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

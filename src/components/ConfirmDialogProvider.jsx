"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import Button from "./Button";
import { useFocusTrap } from "@/lib/useFocusTrap";
import styles from "./ConfirmDialogProvider.module.scss";

const ConfirmContext = createContext(() => Promise.resolve(false));

// Promise-based replacement for window.confirm(): const ok = await confirm({...}).
// Resolves true/false instead of blocking the thread, and matches the app's
// own modal/theme styling instead of the browser's native dialog chrome.
export function useConfirm() {
  return useContext(ConfirmContext);
}

export default function ConfirmDialogProvider({ children }) {
  const [request, setRequest] = useState(null);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, !!request);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setRequest({
        title: options.title || "Are you sure?",
        message: options.message || "",
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        danger: options.danger || false,
        resolve,
      });
    });
  }, []);

  const settle = useCallback(
    (value) => {
      request?.resolve(value);
      setRequest(null);
    },
    [request]
  );

  useEffect(() => {
    if (!request) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") settle(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [request, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div className={styles.overlay} onClick={() => settle(false)}>
          <div
            ref={dialogRef}
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            tabIndex={-1}
          >
            <div className={`${styles.iconWrap} ${request.danger ? styles.danger : ""}`}>
              {request.danger ? (
                <AlertTriangle size={20} strokeWidth={2} />
              ) : (
                <HelpCircle size={20} strokeWidth={2} />
              )}
            </div>
            <h2 id="confirm-dialog-title" className={styles.title}>
              {request.title}
            </h2>
            {request.message && <p className={styles.message}>{request.message}</p>}
            <div className={styles.actions}>
              <button type="button" className={styles.cancelButton} onClick={() => settle(false)}>
                {request.cancelLabel}
              </button>
              <Button
                onClick={() => settle(true)}
                bgColor={request.danger ? "var(--theme-warning)" : "var(--theme-primary)"}
                clr={request.danger ? "var(--theme-button-text)" : "var(--theme-primary-contrast)"}
              >
                {request.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

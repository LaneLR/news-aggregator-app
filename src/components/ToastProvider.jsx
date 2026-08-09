"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import styles from "./ToastProvider.module.scss";

const ToastContext = createContext({
  show: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  dismiss: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

// Errors/warnings stay up longer — a "saved!" confirmation is fine to miss,
// something that needs the user's attention shouldn't vanish in a blink.
const DEFAULT_DURATIONS = {
  success: 4000,
  info: 4500,
  warning: 5500,
  error: 7000,
};

const CLOSE_ANIMATION_MS = 200;

let nextId = 0;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, CLOSE_ANIMATION_MS);
  }, []);

  const show = useCallback(
    (message, options = {}) => {
      const type = options.type || "info";
      const id = ++nextId;
      const duration = options.duration ?? DEFAULT_DURATIONS[type];
      setToasts((prev) => [...prev, { id, message, title: options.title, type }]);
      if (duration) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      show,
      success: (message, options) => show(message, { ...options, type: "success" }),
      error: (message, options) => show(message, { ...options, type: "error" }),
      warning: (message, options) => show(message, { ...options, type: "warning" }),
      info: (message, options) => show(message, { ...options, type: "info" }),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.viewport} role="region" aria-label="Notifications">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`${styles.toast} ${styles[t.type]} ${t.closing ? styles.closing : ""}`}
              role={t.type === "error" ? "alert" : "status"}
            >
              <Icon size={19} strokeWidth={2} className={styles.icon} />
              <div className={styles.body}>
                {t.title && <p className={styles.title}>{t.title}</p>}
                <p className={styles.message}>{t.message}</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

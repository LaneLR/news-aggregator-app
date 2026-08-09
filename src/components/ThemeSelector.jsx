"use client";
import { useSession } from "next-auth/react";
import { Check, Monitor } from "lucide-react";
import { themes } from "@/styles/themes";
import styles from "./ThemeSelector.module.scss";

export default function ThemeSelector() {
  const { data: session, update } = useSession();
  // No `|| "default"` fallback — null is a real, distinct state ("follow
  // the system theme") and must not be displayed as if Light were chosen.
  const currentTheme = session?.user?.selectedTheme ?? null;

  const handleThemeChange = async (themeName) => {
    try {
      await fetch("/api/users/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeName }),
      });
      await update({ selectedTheme: themeName });
    } catch (err) {
      console.error("Failed to update theme", err);
    }
  };

  return (
    <div>
      <p className={styles.selectThemeText}>Select your preferred theme:</p>
      <div className={styles.swatchGrid}>
        <button
          type="button"
          className={`${styles.swatch} ${styles.autoSwatch} ${currentTheme === null ? styles.active : ""}`}
          onClick={() => handleThemeChange(null)}
        >
          <Monitor size={18} strokeWidth={2} />
          Auto
          {currentTheme === null && (
            <span className={styles.checkBadge}>
              <Check size={12} strokeWidth={3} />
            </span>
          )}
        </button>
        <button
          type="button"
          className={`${styles.swatch} ${currentTheme === "default" ? styles.active : ""}`}
          style={{
            backgroundColor: themes.default.background,
            color: themes.default.textTertiary,
          }}
          onClick={() => handleThemeChange("default")}
        >
          Light
          {currentTheme === "default" && (
            <span className={styles.checkBadge}>
              <Check size={12} strokeWidth={3} />
            </span>
          )}
        </button>
        <button
          type="button"
          className={`${styles.swatch} ${currentTheme === "dark" ? styles.active : ""}`}
          style={{
            backgroundColor: themes.dark.background,
            color: themes.dark.text,
          }}
          onClick={() => handleThemeChange("dark")}
        >
          Dark
          {currentTheme === "dark" && (
            <span className={styles.checkBadge}>
              <Check size={12} strokeWidth={3} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

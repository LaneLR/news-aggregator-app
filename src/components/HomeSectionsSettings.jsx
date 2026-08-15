"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Flame, Lock } from "lucide-react";
import { CATEGORY_LINKS } from "@/lib/navLinks";
import { useToast } from "./ToastProvider";
import styles from "./HomeSectionsSettings.module.scss";

// Mirrors OnboardingFlow's identical helper — the nav's plural display
// label ("Journals") isn't the singular tag actually stored on articles
// ("Journal"), so it has to be derived from the slug instead of the label.
function categoryTag(href) {
  const slug = href.split("/").pop();
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

const HERO_OPTIONS = [
  {
    key: "forYou",
    label: "For You / Trending",
    description: "The personalized carousel at the top of the page.",
    Icon: Sparkles,
  },
  {
    key: "topStories",
    label: "Top Stories",
    description: "Stories multiple sources are covering right now.",
    Icon: Flame,
  },
];

export default function HomeSectionsSettings({ initialSections, isSubscribed }) {
  const router = useRouter();
  const toast = useToast();
  const [sections, setSections] = useState(new Set(initialSections || []));
  const [saving, setSaving] = useState(false);

  const categoryOptions = CATEGORY_LINKS.map((link) => ({
    key: categoryTag(link.href),
    label: link.label,
    Icon: link.Icon,
    locked: !!link.gated && !isSubscribed,
  }));

  const persist = async (next) => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/home-sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeSections: Array.from(next) }),
      });
      if (!res.ok) throw new Error("Failed to update home page sections");
      const data = await res.json();
      setSections(new Set(data.homeSections));
    } catch (err) {
      console.error("Failed to update home page sections:", err);
      toast.error("Couldn't save your home page sections. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key, locked) => {
    if (locked) {
      router.push("/pricing");
      return;
    }
    const next = new Set(sections);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSections(next);
    persist(next);
  };

  const renderOption = ({ key, label, description, Icon, locked }) => (
    <label
      key={key}
      className={`${styles.option} ${locked ? styles.locked : ""}`}
      title={locked ? `${label} — Subscribed feature` : undefined}
    >
      <input
        type="checkbox"
        checked={sections.has(key)}
        onChange={() => toggle(key, locked)}
        // Bug fix: disabling the checkbox for locked items also silently
        // killed the "click a locked category to go to Pricing" redirect
        // below in toggle() — a disabled control never fires onChange (and
        // native label-click forwarding to a disabled control is a no-op
        // too), so that branch was unreachable from a real click. Only
        // `saving` should block interaction; `locked` still short-circuits
        // toggle() itself before any section is actually changed.
        disabled={saving}
      />
      <Icon size={16} strokeWidth={2} className={styles.optionIcon} />
      <span className={styles.optionText}>
        <span className={styles.optionLabel}>{label}</span>
        {description && <span className={styles.optionDescription}>{description}</span>}
      </span>
      {locked && <Lock size={13} strokeWidth={2} className={styles.lockIcon} />}
    </label>
  );

  return (
    <div>
      <p className={styles.helperText}>
        Choose which sections show up on your News home page.
      </p>

      <div className={styles.optionGroup}>{HERO_OPTIONS.map(renderOption)}</div>

      <p className={styles.groupLabel}>Categories</p>
      <div className={styles.optionGroup}>{categoryOptions.map(renderOption)}</div>
    </div>
  );
}

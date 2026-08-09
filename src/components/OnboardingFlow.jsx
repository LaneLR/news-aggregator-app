"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Check,
  ArrowRight,
  BookOpen,
  Keyboard,
  Bookmark,
  GripHorizontal,
  Monitor,
} from "lucide-react";
import { CATEGORY_LINKS } from "./HeaderNavBar";
import styles from "./OnboardingFlow.module.scss";

// Shown as step 3, right before landing on the actual feed — a short,
// skimmable tour of the features that are easy to miss otherwise (the 3-pane
// reader in particular has confused people who never noticed it existed).
const FEATURE_HIGHLIGHTS = [
  {
    Icon: BookOpen,
    title: "Reader view",
    description:
      "Click any article to open it in a reading pane right next to your list — no page reload. Switch views anytime with the toggle above your feed.",
  },
  {
    Icon: Keyboard,
    title: "Keyboard shortcuts",
    description: "Press ? anywhere to see them — j/k to move, o to open, s to save.",
  },
  {
    Icon: Bookmark,
    title: "Save for later",
    description: "Save any article to an archive and come back to it whenever you want.",
  },
  {
    Icon: GripHorizontal,
    title: "Make it yours",
    description: "Drag the category tabs and header icons to reorder them however you like.",
  },
  {
    Icon: Monitor,
    title: "Light, dark, or auto",
    description: "Pick a look in Settings, or leave it on Auto to match your system.",
  },
];

// CATEGORY_LINKS' `label` is display text ("Journals" reads better in nav
// than "Journal"), but article rows are tagged with the singular capitalized
// slug ("Journal"). Selections need to carry that canonical tag, not the
// label, or picking "Journals" here would silently never match anything.
function categoryTag(href) {
  const slug = href.split("/").pop();
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

async function saveOnboarding(preferredCategories, preferredSources) {
  await fetch("/api/users/onboarding", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preferredCategories, preferredSources }),
  });
}

export default function OnboardingFlow() {
  const router = useRouter();
  const { data: session } = useSession();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // First-time onboarding always happens before a user could plausibly be
  // subscribed, but gate on the actual session tier rather than assuming —
  // Journals/Market/Finance are subscriber-only, so a non-subscriber picking
  // them here would set preferences for content they can't see yet.
  const pickableCategories = CATEGORY_LINKS.filter(
    (link) => isSubscribed || !link.subscriberOnly
  );

  const toggleCategory = (tag) => {
    setSelectedCategories((prev) =>
      prev.includes(tag) ? prev.filter((c) => c !== tag) : [...prev, tag]
    );
  };

  const toggleSource = (source) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  useEffect(() => {
    if (step !== 2) return;
    setLoadingSources(true);
    fetch(`/api/onboarding/sources?categories=${encodeURIComponent(selectedCategories.join(","))}`)
      .then((res) => res.json())
      .then((data) => setAvailableSources(data.sources || []))
      .catch(() => setAvailableSources([]))
      .finally(() => setLoadingSources(false));
  }, [step, selectedCategories]);

  const finish = async (categories, sources) => {
    setFinishing(true);
    await saveOnboarding(categories, sources);
    router.push("/news");
  };

  // "Skip for now" on step 1 is the one true full bail-out — anything else
  // (Continue/Skip further into the flow) still passes through the step 3
  // feature tour before landing on /news.
  const handleSkipAll = () => finish([], []);
  const handleContinueFromStep1 = () => {
    if (selectedCategories.length === 0) {
      setStep(3);
      return;
    }
    setStep(2);
  };
  const handleSkipStep2 = () => setStep(3);
  const handleContinueFromStep2 = () => setStep(3);
  const handleFinishOnboarding = () => finish(selectedCategories, selectedSources);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <div className={styles.stepIndicator}>Step {step} of 3</div>

        {step === 1 ? (
          <>
            <h1 className={styles.title}>What are you into?</h1>
            <p className={styles.subtitle}>
              Pick a few topics — we&apos;ll use them to tailor your feed.
              You can change this anytime.
            </p>

            <div className={styles.chipGrid}>
              {pickableCategories.map(({ label, href, Icon }) => {
                const tag = categoryTag(href);
                const active = selectedCategories.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.chip} ${active ? styles.active : ""}`}
                    onClick={() => toggleCategory(tag)}
                  >
                    <Icon size={16} strokeWidth={2} />
                    {label}
                    {active && <Check size={14} strokeWidth={3} className={styles.checkIcon} />}
                  </button>
                );
              })}
            </div>

            <div className={styles.actionsRow}>
              <button type="button" className={styles.skipButton} onClick={handleSkipAll}>
                Skip for now
              </button>
              <button type="button" className={styles.continueButton} onClick={handleContinueFromStep1}>
                Continue
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </>
        ) : step === 2 ? (
          <>
            <h1 className={styles.title}>Follow a few sources</h1>
            <p className={styles.subtitle}>
              Popular sources for the topics you picked — optional, you can
              skip this step.
            </p>

            {loadingSources ? (
              <p className={styles.loadingText}>Loading sources…</p>
            ) : availableSources.length > 0 ? (
              <div className={styles.chipGrid}>
                {availableSources.map((source) => {
                  const active = selectedSources.includes(source);
                  return (
                    <button
                      key={source}
                      type="button"
                      className={`${styles.chip} ${active ? styles.active : ""}`}
                      onClick={() => toggleSource(source)}
                    >
                      {source}
                      {active && <Check size={14} strokeWidth={3} className={styles.checkIcon} />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={styles.loadingText}>
                No sources found for those topics yet — that&apos;s okay,
                skip ahead.
              </p>
            )}

            <div className={styles.actionsRow}>
              <button type="button" className={styles.skipButton} onClick={handleSkipStep2}>
                Skip
              </button>
              <button type="button" className={styles.continueButton} onClick={handleContinueFromStep2}>
                Continue
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className={styles.title}>You&apos;re all set</h1>
            <p className={styles.subtitle}>A few things that are easy to miss otherwise:</p>

            <div className={styles.featureGrid}>
              {FEATURE_HIGHLIGHTS.map(({ Icon, title, description }) => (
                <div className={styles.featureCard} key={title}>
                  <div className={styles.featureIcon}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <p className={styles.featureTitle}>{title}</p>
                    <p className={styles.featureDescription}>{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.actionsRow}>
              <span />
              <button
                type="button"
                className={styles.continueButton}
                onClick={handleFinishOnboarding}
                disabled={finishing}
              >
                {finishing ? "Taking you in…" : "Start reading"}
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

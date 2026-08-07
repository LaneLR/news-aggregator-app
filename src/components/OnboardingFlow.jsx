"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, ArrowRight } from "lucide-react";
import { CATEGORY_LINKS } from "./HeaderNavBar";
import styles from "./OnboardingFlow.module.scss";

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

  const handleSkipAll = () => finish([], []);
  const handleContinueFromStep1 = () => {
    if (selectedCategories.length === 0) {
      finish([], []);
      return;
    }
    setStep(2);
  };
  const handleSkipStep2 = () => finish(selectedCategories, []);
  const handleFinish = () => finish(selectedCategories, selectedSources);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <div className={styles.stepIndicator}>Step {step} of 2</div>

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
        ) : (
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
              <button type="button" className={styles.skipButton} onClick={handleSkipStep2} disabled={finishing}>
                Skip
              </button>
              <button type="button" className={styles.continueButton} onClick={handleFinish} disabled={finishing}>
                {finishing ? "Finishing…" : "Finish"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

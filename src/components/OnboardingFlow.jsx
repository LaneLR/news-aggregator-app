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
  Maximize2,
  Type,
  Volume2,
  Rss,
  Bell,
  LineChart,
  Mail,
  Command,
} from "lucide-react";
import { CATEGORY_LINKS } from "@/lib/navLinks";
import styles from "./OnboardingFlow.module.scss";

// Shown as a short, skimmable multi-screen tour right before landing on the
// actual feed — split into themed groups (rather than one long grid) so
// each card gets room for a real sentence without the whole thing turning
// into a wall of text. Kept to the pillars that aren't self-explanatory
// once seen (bulk-select's own "Select" button, pull-to-refresh, etc. don't
// need a slot here) — comprehensive without being exhausting.
const TOUR_STEPS = [
  {
    title: "Read your way",
    subtitle: "The reading experience is yours to tune.",
    items: [
      {
        Icon: BookOpen,
        title: "Reader view",
        description:
          "Click any article to open it in a reading pane right next to your list — no page reload. Switch views anytime with the toggle above your feed.",
      },
      {
        Icon: Maximize2,
        title: "Full-screen reading",
        description:
          "Expand any open article to full screen for a distraction-free read, then close it right back into your list.",
      },
      {
        Icon: Type,
        title: "Make text yours",
        description:
          "Adjust font size, line spacing, and reading width from the reader — it's remembered for next time.",
      },
      {
        Icon: Volume2,
        title: "Listen instead",
        description: "Full-content articles can be read aloud — look for the listen button in the reader.",
      },
      {
        Icon: Monitor,
        title: "Light, dark, or auto",
        description: "Pick a look in Settings, or leave it on Auto to match your system.",
      },
    ],
  },
  {
    title: "Stay on top of it",
    subtitle: "The whole point — never miss what you actually care about.",
    items: [
      {
        Icon: Rss,
        title: "Follow anything",
        description:
          "Follow a topic, company, or keyword in Settings, and new matching articles show up on your Following page automatically.",
      },
      {
        Icon: Bell,
        title: "Get notified",
        description:
          "Turn on push notifications and we'll let you know once a day when something you follow gets covered.",
      },
      {
        Icon: LineChart,
        title: "Live market data",
        description: "Track real-time indices, sector performance, and your own watchlist on the Market page.",
      },
      {
        Icon: Mail,
        title: "Daily or weekly digest",
        description: "Turn on an email digest in Settings and get your picks delivered without opening the app.",
      },
    ],
  },
  {
    title: "Power tools",
    subtitle: "A few things built for going fast.",
    items: [
      {
        Icon: Keyboard,
        title: "Keyboard shortcuts",
        description: "Press ? anywhere to see them — j/k to move, o to open, s to save.",
      },
      {
        Icon: Command,
        title: "Command palette",
        description: "Press Ctrl/Cmd+K to jump to any page or search instantly, without touching your mouse.",
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
    ],
  },
];

const FIRST_TOUR_STEP = 3;
const TOTAL_STEPS = FIRST_TOUR_STEP - 1 + TOUR_STEPS.length;

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
  // Journals/Market are fully subscriber-only, so a non-subscriber picking
  // them here would set preferences for content they can't see yet. Finance
  // is no longer in this set (see subscriberOnlyCategories.js) — it shows a
  // curated free selection, so it's a normal pickable category now.
  const pickableCategories = CATEGORY_LINKS.filter(
    (link) => isSubscribed || !link.gated
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
  // (Continue/Skip further into the flow, or "Skip tour" on any tour
  // screen) still saves whatever topics/sources were picked before landing
  // on /news, it just doesn't force sitting through every tour screen.
  const handleSkipAll = () => finish([], []);
  const handleContinueFromStep1 = () => {
    if (selectedCategories.length === 0) {
      setStep(FIRST_TOUR_STEP);
      return;
    }
    setStep(2);
  };
  const handleSkipStep2 = () => setStep(FIRST_TOUR_STEP);
  const handleContinueFromStep2 = () => setStep(FIRST_TOUR_STEP);
  const handleSkipTour = () => finish(selectedCategories, selectedSources);
  const handleFinishOnboarding = () => finish(selectedCategories, selectedSources);

  const tourIndex = step - FIRST_TOUR_STEP;
  const isTourStep = step >= FIRST_TOUR_STEP;
  const isLastTourStep = tourIndex === TOUR_STEPS.length - 1;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <div className={styles.stepIndicator}>
          Step {step} of {TOTAL_STEPS}
        </div>

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
        ) : isTourStep ? (
          <>
            <h1 className={styles.title}>
              {isLastTourStep ? "You're all set" : TOUR_STEPS[tourIndex].title}
            </h1>
            <p className={styles.subtitle}>{TOUR_STEPS[tourIndex].subtitle}</p>

            <div className={styles.featureGrid}>
              {TOUR_STEPS[tourIndex].items.map(({ Icon, title, description }) => (
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
              {isLastTourStep ? (
                <span />
              ) : (
                <button type="button" className={styles.skipButton} onClick={handleSkipTour}>
                  Skip tour
                </button>
              )}
              <button
                type="button"
                className={styles.continueButton}
                onClick={isLastTourStep ? handleFinishOnboarding : () => setStep(step + 1)}
                disabled={finishing}
              >
                {isLastTourStep ? (finishing ? "Taking you in…" : "Start reading") : "Continue"}
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

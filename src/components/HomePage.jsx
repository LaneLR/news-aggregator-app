import Link from "next/link";
import {
  EyeOff,
  Rss,
  Bookmark,
  ShieldCheck,
  Briefcase,
  Cpu,
  Clapperboard,
  Trophy,
  FlaskConical,
  HeartPulse,
  Landmark,
  Globe,
  Flag,
  CloudSun,
  Check,
  ArrowRight,
} from "lucide-react";
import Button from "./Button";
import styles from "./HomePage.module.scss";

// Pulled from the FAQ (AboutPage.jsx) rather than invented — real, accurate
// value props for shipped features only.
const VALUE_PROPS = [
  {
    Icon: EyeOff,
    title: "No algorithm, no ranking",
    description:
      "No upvotes, no trending scores, no clickbait ranking — just direct, real-time content from the sources you choose.",
  },
  {
    Icon: Rss,
    title: "Straight from the source",
    description:
      "Every headline, description, and image comes straight from the publisher's own RSS feed — not a rewrite or a summary.",
  },
  {
    Icon: Bookmark,
    title: "Save articles for later",
    description:
      "Archive anything into custom folders and build your own personal library of news, organized however you like.",
  },
  {
    Icon: ShieldCheck,
    title: "Fast, focused, ad-free",
    description:
      "No ads and no tracking-driven feed manipulation — just a clean, fast reading experience.",
  },
];

// Free categories only — matches sitemap.js's FREE_CATEGORIES. Defined
// locally rather than importing HeaderNavBar's CATEGORY_LINKS, since that
// file is "use client" and this page is a Server Component (same pattern
// NewNewsPage.jsx already uses for its own category icon map).
const FREE_CATEGORIES = [
  { label: "Business", href: "/category/business", Icon: Briefcase },
  { label: "Tech", href: "/category/tech", Icon: Cpu },
  { label: "Entertainment", href: "/category/entertainment", Icon: Clapperboard },
  { label: "Sports", href: "/category/sports", Icon: Trophy },
  { label: "Science", href: "/category/science", Icon: FlaskConical },
  { label: "Health", href: "/category/health", Icon: HeartPulse },
  { label: "Politics", href: "/category/politics", Icon: Landmark },
  { label: "World", href: "/category/world", Icon: Globe },
  { label: "US", href: "/category/us", Icon: Flag },
  { label: "Weather", href: "/category/weather", Icon: CloudSun },
];

// Mirrors PricingPage.jsx's feature lists (summarized) — no dollar amounts
// here, so this can't drift out of sync with the real pricing.
const FREE_FEATURES = [
  "Articles from hundreds of news sources and blogs",
  "Unlimited archives to save your favorite articles",
  "Follow topics & keywords with instant notifications",
];

const SUBSCRIBED_FEATURES = [
  "Everything in Free",
  "Live Market dashboard with real-time charts & a watchlist",
  "Full Market, Finance & Journal coverage",
  "Create and customize your own news feeds",
  '"For You" recommendations based on your reading habits',
];

export default function HomePage() {
  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <h1 className={`${styles.heroTitle} headline`}>
          All the news. One place. No algorithm deciding what you see.
        </h1>
        <p className={styles.heroSubtitle}>
          MorningFeeds is an RSS-powered news aggregator that lets you follow
          your favorite sources, read the latest headlines, and save
          articles — all in one personalized, ad-free dashboard.
        </p>
        <div className={styles.heroActions}>
          <Link href="/register">
            <Button bgColor="var(--theme-primary)" clr="var(--theme-primary-contrast)">
              Sign up free
            </Button>
          </Link>
          <Link href="/login">
            <Button bgColor="var(--theme-layout-background)" clr="var(--theme-dark-blue)">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.valueGrid}>
          {VALUE_PROPS.map(({ Icon, title, description }) => (
            <div className={styles.valueCard} key={title}>
              <span className={styles.valueIcon}>
                <Icon size={22} strokeWidth={2} />
              </span>
              <h2 className={styles.valueTitle}>{title}</h2>
              <p className={styles.valueDescription}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={`${styles.sectionTitle} headline`}>Browse by topic</h2>
        <p className={styles.sectionSubtitle}>
          Free on every plan — no account required to browse, sign up to save
          what you like.
        </p>
        <div className={styles.categoryGrid}>
          {FREE_CATEGORIES.map(({ label, href, Icon }) => (
            <Link className={styles.categoryChip} href={href} key={href}>
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={`${styles.sectionTitle} headline`}>
          Free to start, more if you want it
        </h2>
        <div className={styles.pricingGrid}>
          <div className={styles.pricingCard}>
            <h3 className={styles.pricingCardTitle}>Free</h3>
            <ul className={styles.pricingFeatureList}>
              {FREE_FEATURES.map((feature) => (
                <li key={feature}>
                  <Check size={14} strokeWidth={3} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${styles.pricingCard} ${styles.highlighted}`}>
            <h3 className={styles.pricingCardTitle}>Subscribed</h3>
            <ul className={styles.pricingFeatureList}>
              {SUBSCRIBED_FEATURES.map((feature) => (
                <li key={feature}>
                  <Check size={14} strokeWidth={3} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Link href="/pricing" className={styles.pricingLink}>
          See full pricing details
          <ArrowRight size={16} strokeWidth={2} />
        </Link>
      </section>

      <section className={styles.finalCta}>
        <h2 className={`${styles.finalCtaTitle} headline`}>
          Ready to build your feed?
        </h2>
        <Link href="/register">
          <Button bgColor="var(--theme-primary)" clr="var(--theme-primary-contrast)" wide="220px">
            Sign up free
          </Button>
        </Link>
      </section>
    </div>
  );
}

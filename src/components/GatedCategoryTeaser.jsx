import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import styles from "./GatedCategoryTeaser.module.scss";

// Custom in-house vector illustrations (not stock photography) — built to
// match the app's own category color tokens and the existing tinted-glyph
// placeholder convention (see categoryColors.js), so nothing here depends
// on sourcing/licensing external imagery.
function MarketIllustration({ className }) {
  return (
    <svg className={className} viewBox="0 0 400 220" role="img" aria-hidden="true">
      <rect width="400" height="220" rx="16" fill="var(--theme-layout-background)" />
      <line x1="20" y1="50" x2="380" y2="50" stroke="var(--theme-border)" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="20" y1="90" x2="380" y2="90" stroke="var(--theme-border)" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="20" y1="130" x2="380" y2="130" stroke="var(--theme-border)" strokeWidth="1" strokeDasharray="4 4" />

      <polyline
        points="20,150 60,132 100,142 140,105 180,118 220,78 260,95 300,55 340,68 380,35"
        fill="none"
        stroke="#047857"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* candlesticks */}
      <line x1="220" y1="150" x2="220" y2="175" stroke="#15803d" strokeWidth="2" />
      <rect x="215" y="158" width="10" height="12" rx="1.5" fill="#15803d" />
      <line x1="252" y1="140" x2="252" y2="180" stroke="#b91c1c" strokeWidth="2" />
      <rect x="247" y="150" width="10" height="18" rx="1.5" fill="#b91c1c" />
      <line x1="284" y1="130" x2="284" y2="165" stroke="#15803d" strokeWidth="2" />
      <rect x="279" y="138" width="10" height="14" rx="1.5" fill="#15803d" />
      <line x1="316" y1="145" x2="316" y2="185" stroke="#b91c1c" strokeWidth="2" />
      <rect x="311" y="155" width="10" height="16" rx="1.5" fill="#b91c1c" />
      <line x1="348" y1="120" x2="348" y2="160" stroke="#15803d" strokeWidth="2" />
      <rect x="343" y="128" width="10" height="14" rx="1.5" fill="#15803d" />

      {/* ticker row */}
      <g fontFamily="ui-monospace, monospace" fontWeight="700">
        <text x="24" y="200" fontSize="13" fill="var(--theme-text)">S&amp;P</text>
        <text x="58" y="200" fontSize="12" fill="#15803d">+1.4%</text>
        <text x="118" y="200" fontSize="13" fill="var(--theme-text)">NDX</text>
        <text x="154" y="200" fontSize="12" fill="#15803d">+2.1%</text>
        <text x="212" y="200" fontSize="13" fill="var(--theme-text)">DJI</text>
        <text x="246" y="200" fontSize="12" fill="#b91c1c">-0.3%</text>
        <text x="306" y="200" fontSize="13" fill="var(--theme-text)">BTC</text>
        <text x="342" y="200" fontSize="12" fill="#15803d">+3.6%</text>
      </g>
    </svg>
  );
}

function JournalIllustration({ className }) {
  return (
    <svg className={className} viewBox="0 0 400 220" role="img" aria-hidden="true">
      <rect width="400" height="220" rx="16" fill="var(--theme-layout-background)" />

      {/* open book */}
      <path
        d="M60 60 Q140 40 195 62 L195 168 Q140 148 60 166 Z"
        fill="var(--theme-card-background)"
        stroke="#1e3a8a"
        strokeWidth="2.5"
      />
      <path
        d="M340 60 Q260 40 205 62 L205 168 Q260 148 340 166 Z"
        fill="var(--theme-card-background)"
        stroke="#1e3a8a"
        strokeWidth="2.5"
      />
      <line x1="200" y1="58" x2="200" y2="172" stroke="#1e3a8a" strokeWidth="2.5" />

      {/* text lines, left page */}
      <line x1="80" y1="82" x2="172" y2="76" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <line x1="80" y1="98" x2="172" y2="93" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="80" y1="114" x2="150" y2="110" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="80" y1="130" x2="172" y2="127" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" opacity="0.3" />

      {/* text lines, right page */}
      <line x1="228" y1="76" x2="320" y2="82" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <line x1="228" y1="93" x2="320" y2="98" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="250" y1="110" x2="320" y2="114" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="228" y1="127" x2="320" y2="130" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" opacity="0.3" />

      {/* peer-reviewed badge */}
      <circle cx="200" cy="196" r="16" fill="#1e3a8a" />
      <path d="M192 196 l6 6 l11 -13" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CONTENT = {
  Market: {
    title: "Market coverage is for MochaReads Pro",
    subtitle: "A live dashboard plus every major market feed, all in one place.",
    features: [
      "Live indices, sector performance & historical charts",
      "A personal watchlist you can customize",
      "Headlines from MarketWatch, Investing.com, Nasdaq, Seeking Alpha & more",
    ],
    Illustration: MarketIllustration,
  },
  Journal: {
    title: "Journals are for MochaReads Pro",
    subtitle: "Peer-reviewed research and long-form analysis, without the noise.",
    features: [
      "Nature, Science, PNAS & other peer-reviewed journals",
      "Policy and foreign-affairs analysis from JSTOR, Foreign Affairs & more",
      "No ads, no clickbait — just the source material",
    ],
    Illustration: JournalIllustration,
  },
};

export default function GatedCategoryTeaser({ category }) {
  const content = CONTENT[category];
  if (!content) return null;
  const { title, subtitle, features, Illustration } = content;

  return (
    <div className={styles.wrapper}>
      <Illustration className={styles.illustration} />
      <h1 className={`${styles.title} headline`}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
      <ul className={styles.featureList}>
        {features.map((feature) => (
          <li key={feature}>
            <Check size={15} strokeWidth={2.5} />
            {feature}
          </li>
        ))}
      </ul>
      <Link href="/pricing" className={styles.ctaLink}>
        <Sparkles size={15} strokeWidth={2} />
        See Subscription Plans
      </Link>
    </div>
  );
}

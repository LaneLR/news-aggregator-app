"use client";
import { useMemo, useState } from "react";
import AccordionItem from "./AccordionItem";
import styles from "./AboutPage.module.scss";

const FAQ_ITEMS = [
  {
    question: "What is MochaReads?",
    answer:
      "MochaReads is an RSS-powered news aggregator that lets you follow your favorite news sources, read the latest headlines, and save articles — all in one personalized dashboard. You decide what to follow, and we simply fetch the content for you.",
  },
  {
    question: "Is MochaReads free to use?",
    answer:
      "Mostly! The Free plan gets you unlimited archives and articles from hundreds of general news sources. A paid subscription adds Market, Finance, and Journal coverage, custom feeds built from your own sources, and referral credit toward future bills. See the Pricing page for details.",
  },
  {
    question: "What makes MochaReads different from other news apps?",
    answer:
      "MochaReads doesn't use an algorithm to decide what you see. There's no upvoting, trending scores, or clickbait ranking — just direct, real-time content from sources you choose. It's fast, focused, and ad-free.",
  },
  {
    question: "Where does the news come from?",
    answer:
      "All content is fetched directly from the RSS feeds of news websites, blogs, and publishers. That means you're seeing the original article titles, descriptions, and images — not rewrites or summaries.",
  },
  {
    question: "Can I save articles to read later?",
    answer:
      "Yes! You can archive articles into custom folders to read them later or organize them by topic. It's like building your own personal library of news.",
  },
  {
    question: "How often is content updated?",
    answer:
      "RSS feeds are refreshed roughly once an hour to keep your feed current without putting unnecessary load on the source sites. If a source hasn't posted anything new since the last check, you won't see anything new from them until they do.",
  },
  {
    question: "Do you track what I read or click?",
    answer:
      "We count clicks and likes on articles in aggregate to power features like Trending and Most Liked — that's it. We don't sell your data, build advertising profiles, or show you targeted ads. See our Privacy Policy for the full picture.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. Any saved preferences or archives are tied to your user account and stored securely. We do not store or process any sensitive personal data like payment information on our servers — if we use payment systems like Stripe, they handle that externally.",
  },
  {
    question: "I didn't get my verification or password reset email",
    answer:
      "Check your spam or promotions folder first — that's the most common cause. Verification and reset links expire (24 hours and 1 hour respectively) and each new request invalidates the previous one, so if you requested more than once, only the most recent email will work. If it's been more than a few minutes and you still don't see anything, try again — repeated attempts are rate-limited for security, so wait a minute between tries.",
  },
  {
    question: "Why can't I see Market, Finance, or Journal articles?",
    answer:
      "Those sections are part of a paid subscription. You'll see a preview or be redirected to the Pricing page when you try to open them on the Free plan. If you're subscribed and still can't see them, try refreshing — see the next question.",
  },
  {
    question: "I just subscribed but the site still shows me as Free",
    answer:
      "Your subscription is confirmed by Stripe and applied to your account automatically, which is usually instant but can occasionally take a minute. Refresh the page or log out and back in. If it's still showing Free after a few minutes, contact us from the Contact page with the email you subscribed with.",
  },
  {
    question: "A saved article's link is broken or 404s",
    answer:
      "That's on the publisher's end, not ours — articles occasionally get removed, paywalled, or moved after we've already saved a copy of the title and link. We link directly to the original source and don't control what happens to it afterward.",
  },
  {
    question: "Can I cancel or change my subscription?",
    answer:
      "Yes, any time — go to Account → Subscription, or use Manage Subscription to open Stripe's billing portal, where you can switch between monthly/annual billing, update your payment method, or cancel. Canceling keeps your access until the end of your current billing period; we don't do partial refunds.",
  },
  {
    question: "How do referral codes work?",
    answer:
      "Active subscribers get a referral code from their Account page. Sharing it gives a friend a discount on their first billing cycle, and you get a credit toward your next bill once they subscribe. Each account can only use a referral code once, and you can't use your own.",
  },
];

export default function AboutPageComponent() {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.searchInput}
        type="search"
        placeholder="Search the FAQ (e.g. subscription, email, password)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search frequently asked questions"
      />
      {filteredItems.length === 0 ? (
        <p className={styles.noResults}>
          No matches for &quot;{query}&quot;. Try a different word, or reach
          out from the Contact page.
        </p>
      ) : (
        filteredItems.map((item) => (
          <AccordionItem
            key={item.question}
            question={item.question}
            answer={item.answer}
          />
        ))
      )}
    </div>
  );
}

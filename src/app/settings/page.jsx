import KeywordFilters from "@/components/KeywordFilters";
import FollowedKeywords from "@/components/FollowedKeywords";
import FollowedSources from "@/components/FollowedSources";
import NotificationSettings from "@/components/NotificationSettings";
import KeyboardShortcutsSettings from "@/components/KeyboardShortcutsSettings";
import HomeSectionsSettings from "@/components/HomeSectionsSettings";
import AccountTabs from "@/components/AccountTabs";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  Info,
  Shield,
  VolumeX,
  Keyboard,
  LayoutGrid,
  Rss,
  Bell,
} from "lucide-react";
import styles from "./page.module.scss";

export const metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // mutedKeywords isn't carried in the session/JWT (keeps the auth cookie
  // small — it's per-request preference data, not identity data), so it's
  // fetched directly here instead.
  const { User } = await initializeDbAndModels();
  const currentUser = await User.findByPk(session.user.id, {
    attributes: [
      "mutedKeywords",
      "followedKeywords",
      "followedSources",
      "keyboardShortcuts",
      "homeSections",
    ],
  });
  const isSubscribed = session.user.tier && session.user.tier !== "Free";

  return (
    <div className={styles.pageWrapper}>
      <AccountTabs />

      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageTitle} headline`}>
          <SettingsIcon size={26} strokeWidth={2} />
          Settings
        </h1>
        <p className={styles.pageSubtitle}>
          Manage how MochaReads keeps you updated and how you sign in.
        </p>
      </div>

      <div className={styles.layoutRow}>
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <LayoutGrid size={17} />
              </span>
              Home Page Sections
            </h2>
            <div className={styles.cardContent}>
              <HomeSectionsSettings
                initialSections={currentUser?.homeSections}
                isSubscribed={isSubscribed}
              />
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <VolumeX size={17} />
              </span>
              Keyword Filters
            </h2>
            <div className={styles.cardContent}>
              <KeywordFilters initialKeywords={currentUser?.mutedKeywords} />
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <Rss size={17} />
              </span>
              Following
            </h2>
            <div className={styles.cardContent}>
              <h3 className={styles.cardSubheading}>Topics</h3>
              <FollowedKeywords initialKeywords={currentUser?.followedKeywords} />
              <h3 className={styles.cardSubheading}>Sources</h3>
              <FollowedSources initialSources={currentUser?.followedSources} />
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <Bell size={17} />
              </span>
              Push Notifications
            </h2>
            <div className={styles.cardContent}>
              <NotificationSettings />
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <Keyboard size={17} />
              </span>
              Keyboard Shortcuts
            </h2>
            <div className={styles.cardContent}>
              <KeyboardShortcutsSettings initialShortcuts={currentUser?.keyboardShortcuts} />
            </div>
          </div>
        </div>

        <aside className={styles.sideColumn}>
          <div className={styles.tipCard}>
            <Info size={18} strokeWidth={2} />
            <div>
              <p className={styles.tipTitle}>Settings Tip</p>
              <p className={styles.tipText}>
                Mute keywords or follow topics and sources to fine-tune what
                shows up in your feeds and Following page.
              </p>
            </div>
          </div>

          <div className={styles.linksCard}>
            <p className={styles.linksTitle}>Quick Links</p>
            <Link href="/account#privacy" className={styles.quickLink}>
              <Shield size={15} strokeWidth={2} />
              Privacy &amp; Data
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

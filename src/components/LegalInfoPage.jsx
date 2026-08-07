import Link from "next/link";
import { HelpCircle, Mail, ShieldCheck, FileText } from "lucide-react";
import AboutPageComponent from "./AboutPage";
import ContactUsComponent from "./ContactUs";
import PrivacyPageComponent from "./Privacy";
import TermsOfServiceComponent from "./TermsOfService";
import styles from "./LegalInfoPage.module.scss";

const TABS = [
  { key: "about", label: "About Us", href: "/about" },
  { key: "contact", label: "Contact Us", href: "/contact-us" },
  { key: "privacy", label: "Privacy Policy", href: "/privacy" },
  { key: "terms", label: "Terms of Service", href: "/terms-of-service" },
];

export default function LegalInfoPage({ activeTab, contactEmail }) {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <div className={styles.banner}>
          <HelpCircle className={`${styles.bannerIcon} ${styles.iconOne}`} strokeWidth={1.5} />
          <ShieldCheck className={`${styles.bannerIcon} ${styles.iconTwo}`} strokeWidth={1.5} />
          <Mail className={`${styles.bannerIcon} ${styles.iconThree}`} strokeWidth={1.5} />
          <FileText className={`${styles.bannerIcon} ${styles.iconFour}`} strokeWidth={1.5} />
          <h1 className={styles.bannerTitle}>About MorningFeeds &amp; Legal Notices</h1>
        </div>

        <div className={styles.tabRow}>
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ""}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className={styles.content}>
          {activeTab === "about" && <AboutPageComponent />}
          {activeTab === "contact" && (
            <ContactUsComponent contactEmail={contactEmail} />
          )}
          {activeTab === "privacy" && (
            <PrivacyPageComponent contactEmail={contactEmail} />
          )}
          {activeTab === "terms" && (
            <TermsOfServiceComponent contactEmail={contactEmail} />
          )}
        </div>
      </div>
    </div>
  );
}

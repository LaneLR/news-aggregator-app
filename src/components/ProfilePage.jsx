"use client";
import { useSession } from "next-auth/react";
import Loading from "@/app/loading";
import Image from "next/image";
import Button from "./Button";
import { useEffect, useState } from "react";
import CopyButton from "./CopyButton";
import Link from "next/link";
import {
  CreditCard,
  Gift,
  Palette,
  Shield,
  Settings as SettingsIcon,
  Crown,
  Mail,
  Info,
  User,
  Lock,
} from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import ManageSubscriptionButton from "./ManageSubscriptionButton";
import CancelSubscriptionButton from "./CancelSubscriptionButton";
import ResumeSubscriptionButton from "./ResumeSubscriptionButton";
import DigestSettings from "./DigestSettings";
import AccountTabs from "./AccountTabs";
import styles from "./ProfilePage.module.scss";

// Two-letter fallback for accounts with no profile photo (i.e. anyone who
// didn't sign in with Google — credentials signup never collects/sets one).
// "Lane Richardson" -> "LR" (first + last initial); a single-word name (or,
// for credentials accounts that never set a name at all, the email's local
// part) -> its own first two letters, e.g. "Lane" -> "LA".
function getInitials(name, email) {
  const trimmed = (name || "").trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  const local = (email || "").split("@")[0];
  return local ? local.slice(0, 2).toUpperCase() : "?";
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [session?.user?.image]);

  if (status === "loading") {
    return <Loading />;
  }
  if (status === "unauthenticated" || !session) {
    return <p>Access Denied. Please sign in to view your profile.</p>;
  }

  const { user } = session;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : null;
  const proxiedImageUrl = user.image
    ? `/api/image-proxy?url=${encodeURIComponent(user.image)}`
    : null;
  const showImage = !!proxiedImageUrl && !imageFailed;

  return (
    <div className={styles.profileWrapper}>
      <AccountTabs />

      <div className={styles.layoutRow}>
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <User size={15} />
              </span>
              Account Information
            </h2>
            <div className={styles.cardContent}>
              <div className={styles.accountInfoRow}>
                <div className={styles.avatar}>
                  {showImage ? (
                    <Image
                      src={proxiedImageUrl}
                      width={72}
                      height={72}
                      alt={"User profile image"}
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <div className={styles.avatarInitials} aria-hidden="true">
                      {getInitials(user.name, user.email)}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className={`${styles.userName} headline`}>
                    {user.name}
                    <span
                      className={`${styles.tierBadge} ${user.tier === "Free" ? styles.free : ""}`}
                    >
                      {user.tier === "Free" ? "Free Tier" : "Subscribed"}
                    </span>
                  </h1>
                  <p className={styles.userEmail}>{user.email}</p>
                  {memberSince && (
                    <p className={styles.memberSince}>Member since {memberSince}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <CreditCard size={15} />
              </span>
              Subscription
            </h2>
            <div className={styles.cardContent}>
              {user.tier === "Free" ? (
                <p>You are currently on the Free plan.</p>
              ) : (
                <>
                  <div className={styles.infoRow}>
                    <span>Current Plan</span>
                    <strong>{user.tier}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Status</span>
                    <strong style={{ textTransform: "capitalize" }}>
                      {user.stripeSubscriptionStatus}
                    </strong>
                  </div>
                  {user.stripeSubscriptionEndsAt && (
                    <div className={styles.infoRow}>
                      <span>
                        {user.subscriptionWillCancel ? (
                          <b>Cancels on</b>
                        ) : (
                          <b>Renews on</b>
                        )}
                      </span>
                      <strong>
                        {new Date(
                          user.stripeSubscriptionEndsAt
                        ).toLocaleDateString()}
                      </strong>
                    </div>
                  )}
                  {user.subscriptionWillCancel && (
                    <ResumeSubscriptionButton
                      subscriptionEndDate={user.stripeSubscriptionEndsAt}
                    />
                  )}
                  <p className={styles.helperText}>
                    Payment methods and billing history are managed securely
                    through Stripe.
                  </p>
                </>
              )}
            </div>
            <div className={styles.cardFooter}>
              {user.tier === "Free" ? (
                <Button
                  bgColor={"var(--theme-primary)"}
                  clr={"var(--theme-primary-contrast)"}
                  onClick={() => (window.location.href = "/pricing")}
                >
                  Upgrade to Pro
                </Button>
              ) : (
                <>
                  <ManageSubscriptionButton />
                  {!user.subscriptionWillCancel && <CancelSubscriptionButton />}
                </>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <Gift size={15} />
              </span>
              Your Referral Code
            </h2>
            <div className={styles.cardContent}>
              {user.tier === "Free" ? (
                <>
                  <p>
                    Subscribe to Pro to activate your referral code and start
                    earning credits!
                  </p>
                  <div
                    style={{
                      filter: "blur(5px)",
                      backgroundColor: "var(--theme-background)",
                      padding: "9px",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "center",
                      userSelect: "none",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "1.6rem",
                        letterSpacing: "2px",
                      }}
                    >
                      FAKECODE
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Share this code with your friends! They&apos;ll get a discount
                    on their first subscription, and you&apos;ll get a credit on
                    your next bill.
                  </p>
                  <div>
                    {user.referralCount > 0 && (
                      <p>Users referred: {user.referralCount} </p>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      height: "47px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "1.6rem",
                        fontWeight: "500",
                        letterSpacing: "2px",
                        backgroundColor: "var(--theme-layout-background)",
                        padding: "9px",
                        borderTopLeftRadius: "var(--radius-sm)",
                        borderBottomLeftRadius: "var(--radius-sm)",
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {user.referralCode}
                    </p>
                    <CopyButton textToCopy={user.referralCode} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <Lock size={15} />
              </span>
              Security
            </h2>
            <div className={styles.cardContent}>
              <div className={styles.settingsRow}>
                <div>
                  <p className={styles.settingsRowLabel}>Password</p>
                  <p className={styles.settingsRowDescription}>
                    Reset your password by email.
                  </p>
                </div>
                <Link href="/forgot-password" className={styles.settingsRowAction}>
                  Change Password
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <Mail size={15} />
              </span>
              Email Preferences
            </h2>
            <div className={styles.cardContent}>
              <DigestSettings />
            </div>
          </div>

          <div id="privacy" className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <Shield size={15} />
              </span>
              Privacy
            </h2>
            <div className={styles.cardContent}>
              <p>
                See our <Link href="/privacy">Privacy Policy</Link> for details
                on what data we collect and how it&apos;s used.
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.cardHeaderIcon}>
                <Palette size={15} />
              </span>
              Appearance
            </h2>
            <div className={styles.cardContent}>
              <ThemeSelector />
            </div>
          </div>
        </div>

        <aside className={styles.sideColumn}>
          {/* <div className={styles.tipCard}>
            <Info size={18} strokeWidth={2} />
            <div>
              <p className={styles.tipTitle}>Billing Tip</p>
              <p className={styles.tipText}>
                Your subscription is billed and managed securely through
                Stripe — update your payment method or cancel anytime from
                the Subscription card.
              </p>
            </div>
          </div> */}

          <div className={styles.linksCard}>
            <p className={styles.linksTitle}>Quick Links</p>
            <Link href="/settings" className={styles.quickLink}>
              <SettingsIcon size={15} strokeWidth={2} />
              Settings
            </Link>
            <Link href="/pricing" className={styles.quickLink}>
              <Crown size={15} strokeWidth={2} />
              Plans &amp; Pricing
            </Link>
            <Link href="/contact-us" className={styles.quickLink}>
              <Mail size={15} strokeWidth={2} />
              Contact Us
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

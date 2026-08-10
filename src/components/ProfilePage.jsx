"use client";
import { useSession } from "next-auth/react";
import Loading from "@/app/loading";
import Image from "next/image";
import Button from "./Button";
import { useEffect, useState } from "react";
import CopyButton from "./CopyButton";
import Link from "next/link";
import { CreditCard, Gift, Palette, Shield, ShieldAlert, LayoutGrid, Rows3 } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import styles from "./ProfilePage.module.scss";

const FALLBACK_IMAGE_URL = "/images/default-avatar.png";

const LAYOUT_STORAGE_KEY = "accountCardLayout";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [layout, setLayout] = useState("grid");

  useEffect(() => {
    const saved = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved === "grid" || saved === "list") setLayout(saved);
  }, []);

  const handleSetLayout = (next) => {
    setLayout(next);
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, next);
  };

  const proxiedImageUrl = session?.user?.image
    ? `/api/image-proxy?url=${encodeURIComponent(session.user.image)}`
    : FALLBACK_IMAGE_URL;

  const [imageSrc, setImageSrc] = useState(FALLBACK_IMAGE_URL);

  useEffect(() => {
    if (session?.user?.image) {
      const rawUrl = session.user.image;
      const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
      setImageSrc(proxiedUrl);
    } else {
      setImageSrc(FALLBACK_IMAGE_URL);
    }
  }, [session]);

  const handleImageError = () => {
    setImageSrc(FALLBACK_IMAGE_URL);
  };

  if (status === "loading") {
    return <Loading />;
  }
  if (status === "unauthenticated" || !session) {
    return <p>Access Denied. Please sign in to view your profile.</p>;
  }

  const { user } = session;

  const handleManageSubscription = async () => {
    const response = await fetch("/api/stripe/manage-subscription", {
      method: "POST",
    });
    const { url } = await response.json();
    window.location.href = url;
  };

  const handleRequestDeletion = async () => {
    await fetch("/api/users/request-deletion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    await update();
  };

  const handleCancelDeletion = async () => {
    await fetch("/api/users/cancel-deletion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    await update();
  };

  const getScheduledDeletionDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    return tomorrow;
  };

  const scheduledDeletionDate = getScheduledDeletionDate();
  const formattedDate = scheduledDeletionDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = scheduledDeletionDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={styles.profileWrapper}>
      <div className={styles.profileHeader}>
        <div className={styles.avatar}>
          <Image
            src={imageSrc}
            width={120}
            height={120}
            alt={"User profile image"}
            onError={handleImageError}
          />
        </div>
        <h1 className={`${styles.userName} headline`}>
          {user.name}
          <span className={`${styles.tierBadge} ${user.tier === "Free" ? styles.free : ""}`}>
            {user.tier === "Free" ? "Free Tier" : "Subscribed"}
          </span>
        </h1>
        <p className={styles.userEmail}>{user.email}</p>
      </div>

      <div className={styles.layoutToggleRow}>
        <div className={styles.layoutToggle}>
          <button
            type="button"
            className={`${styles.layoutButton} ${layout === "grid" ? styles.active : ""}`}
            onClick={() => handleSetLayout("grid")}
            title="Grid view"
          >
            <LayoutGrid size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`${styles.layoutButton} ${layout === "list" ? styles.active : ""}`}
            onClick={() => handleSetLayout("list")}
            title="List view"
          >
            <Rows3 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className={`${styles.cardsGrid} ${layout === "list" ? styles.listLayout : ""}`}>
        <div className={styles.card}>
          <h2 className={styles.cardHeader}>
            <span className={styles.cardHeaderIcon}>
              <CreditCard size={17} />
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
              <Button
                bgColor={"var(--theme-primary)"}
                clr={"var(--theme-primary-contrast)"}
                onClick={handleManageSubscription}
              >
                Manage Subscription
              </Button>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardHeader}>
            <span className={styles.cardHeaderIcon}>
              <Gift size={17} />
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
                    borderRadius: "10px",
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
                      borderTopLeftRadius: "10px",
                      borderBottomLeftRadius: "10px",
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
              <Palette size={17} />
            </span>
            Appearance
          </h2>
          <div className={styles.cardContent}>
            <ThemeSelector />
          </div>
        </div>

        <div id="privacy" className={styles.card}>
          <h2 className={styles.cardHeader}>
            <span className={styles.cardHeaderIcon}>
              <Shield size={17} />
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

        <div className={`${styles.card} ${styles.spanFull}`}>
          <h2 className={`${styles.cardHeader} ${styles.dangerCardHeader}`}>
            <span className={styles.cardHeaderIcon}>
              <ShieldAlert size={17} />
            </span>
            Account Settings
          </h2>
          <div className={styles.cardContent}>
            {user.isPendingDeletion ? (
              <p>
                Your account is scheduled for deletion on <b>{formattedDate}</b>{" "}
                at <b>{formattedTime}</b>. You can request to cancel this at any
                time before the cancellation date.
              </p>
            ) : (
              <p>
                Deactivate your account and all of your content. This action is
                irreversible.
              </p>
            )}
          </div>
          <div className={styles.cardFooter}>
            {user.isPendingDeletion ? (
              <Button
                bgColor={"var(--theme-primary)"}
                clr={"var(--theme-primary-contrast)"}
                onClick={handleCancelDeletion}
              >
                Cancel Deletion
              </Button>
            ) : (
              <Button
                bgColor={"var(--theme-warning)"}
                clr={"var(--theme-button-text)"}
                onClick={handleRequestDeletion}
              >
                Delete Account
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

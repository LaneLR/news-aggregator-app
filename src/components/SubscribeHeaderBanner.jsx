import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./SubscribeHeaderBanner.module.scss";

export default function HeaderSubscribeBanner() {
  const { data: session } = useSession();
  const isNotSubscribed = session?.user?.tier === "Free";

  const [isCtaVisible, setIsCtaVisible] = useState(true);

  useEffect(() => {
    const ctaDismissed = sessionStorage.getItem("hideUpgradeCTA");
    if (ctaDismissed === "true") {
      setIsCtaVisible(false);
    }
  }, []);

  const handleDismissCta = () => {
    setIsCtaVisible(false);
    sessionStorage.setItem("hideUpgradeCTA", "true");
  };

  return (
    <>
      {isNotSubscribed && isCtaVisible && (
        <div className={styles.wrapper}>
          <div className={styles.leftContainer} />
          <div className={styles.centerContainer}>
            Want to create and customize your own feeds?
            <Link
              href="/pricing"
              style={{
                display: "flex",
                flexFlow: "column nowrap",
                width: "fit-content",
              }}
            >
              <p>Become a member!</p>
              <div className={styles.underline} />
            </Link>
          </div>
          <div className={styles.rightContainer}>
            <button className={styles.closeButton} onClick={handleDismissCta}>
              <img
                alt="Close button"
                src="/images/close.svg"
                width={16}
                height={16}
                color={"var(--theme-text)"}
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

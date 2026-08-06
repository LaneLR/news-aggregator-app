"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
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
          <div className={styles.leftContainer}>
            <Sparkles size={18} />
          </div>
          <div className={styles.centerContainer}>
            <span>Want to create and customize your own feeds?</span>
            <Link href="/pricing">Become a member!</Link>
          </div>
          <div className={styles.rightContainer}>
            <button className={styles.closeButton} onClick={handleDismissCta} title="Dismiss">
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

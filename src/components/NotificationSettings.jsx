"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import styles from "./NotificationSettings.module.scss";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Push is only meaningful once articles matching a followed keyword can
// actually be found — supportState communicates *why* the toggle is
// disabled (unsupported browser, iOS not installed as a PWA yet, or simply
// not-yet-decided) rather than just hiding it silently.
export default function NotificationSettings() {
  const [supportState, setSupportState] = useState("checking");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setSupportState("unsupported");
      return;
    }
    if (isIos && !isStandalone) {
      setSupportState("ios-needs-install");
      return;
    }

    setSupportState("ready");
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
    );
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications were blocked. You can re-enable them in your browser's site settings.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Failed to save subscription");

      setSubscribed(true);
    } catch (err) {
      console.error("Failed to enable push notifications:", err);
      setError("Something went wrong enabling notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setError("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("Failed to disable push notifications:", err);
      setError("Something went wrong turning off notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (supportState === "checking") return null;

  if (supportState === "unsupported") {
    return <p className={styles.helperText}>Push notifications aren&apos;t supported in this browser.</p>;
  }

  if (supportState === "ios-needs-install") {
    return (
      <p className={styles.helperText}>
        On iPhone/iPad, add MorningFeeds to your Home Screen first (Share → Add to Home Screen), then
        come back here to turn on notifications.
      </p>
    );
  }

  return (
    <div>
      <p className={styles.helperText}>
        Get a daily notification when new articles match the topics you follow (see the{" "}
        <a href="/following">Following</a> settings above). One check per day, not real-time.
      </p>

      <button
        type="button"
        className={subscribed ? styles.disableButton : styles.enableButton}
        onClick={subscribed ? handleDisable : handleEnable}
        disabled={busy}
      >
        {subscribed ? <BellOff size={16} strokeWidth={2.25} /> : <Bell size={16} strokeWidth={2.25} />}
        {busy ? "Working…" : subscribed ? "Turn off notifications" : "Turn on notifications"}
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
